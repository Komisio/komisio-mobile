import { formattingLocale } from "./locale.ts";
// Reviewed read contract: Komisio/komisio#715. No seller or financial history.
export type Photo = {
  id: string;
  bucket: "item-photos" | "reception-photos" | "seller-reception-photos";
  path: string;
};
export type CatalogueItem = {
  id: string;
  title: string | null;
  category: string | null;
  priceOre: number;
  photo: Photo | null;
  facts?: { slug: FactKey; value: string }[];
};
export type ReadPage<T> = {
  currency: string;
  items: T[];
  total: number;
  offset: number;
};
export type CataloguePage = ReadPage<CatalogueItem>;
export const factKeys = [
  "category",
  "brand",
  "size",
  "color",
  "material",
  "condition",
] as const;
export type FactKey = (typeof factKeys)[number];
export type CatalogueDetail = {
  id: string;
  title: string | null;
  currency: string;
  priceOre: number;
  facts: { slug: FactKey; value: string }[];
  photos: Photo[];
};
export type ReadFailure = "denied" | "missing" | "failed";

export function readFailure(error: unknown): ReadFailure {
  const e = error as { code?: string; message?: string } | null;
  if (
    e?.code === "42501" ||
    e?.message === "AUTH_REQUIRED" ||
    e?.message === "FORBIDDEN"
  )
    return "denied";
  if (e?.message === "ITEM_NOT_FOUND") return "missing";
  return "failed";
}

function invalid(): never {
  throw new Error("INVALID_CATALOGUE_RESPONSE");
}
function object(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : invalid();
}
export function isId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(value)
  );
}
function id(value: unknown): string {
  return isId(value) ? value : invalid();
}
function text(value: unknown): string {
  return typeof value === "string" ? value : invalid();
}
function optionalText(value: unknown): string | null {
  return value === null ? null : text(value);
}
function integer(value: unknown): number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value
    : invalid();
}
function currency(value: unknown): string {
  return typeof value === "string" && /^[A-Z]{3}$/.test(value)
    ? value
    : invalid();
}
function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : invalid();
}
function photo(value: unknown, tenant: string): Photo {
  const p = object(value);
  const photoId = id(p.id);
  if (
    p.bucket !== "item-photos" &&
    p.bucket !== "reception-photos" &&
    p.bucket !== "seller-reception-photos"
  )
    invalid();
  const path = text(p.path);
  const parts = path.split("/");
  if (
    parts.length !== 3 ||
    parts[0] !== tenant ||
    !isId(parts[1]) ||
    !(
      p.bucket === "seller-reception-photos"
        ? [`${photoId}.jpg`]
        : [`${photoId}.jpg`, `${photoId}.png`]
    ).includes(parts[2])
  )
    invalid();
  return { id: photoId, bucket: p.bucket, path };
}

export function parsePage(value: unknown, tenant: string): CataloguePage {
  const p = object(value);
  const items = array(p.items).map((value) => {
    const i = object(value);
    return {
      id: id(i.id),
      title: optionalText(i.title),
      category: optionalText(i.category),
      priceOre: integer(i.priceOre),
      photo: i.photo === null ? null : photo(i.photo, tenant),
      // Older hosted catalogues have not yet added the safe detail facts.
      facts: i.facts === undefined ? [] : parseFacts(i.facts),
    };
  });
  if (items.length > 30) invalid();
  return {
    currency: currency(p.currency),
    total: integer(p.total),
    offset: integer(p.offset),
    items,
  };
}

export function parseDetail(
  value: unknown,
  tenant: string,
  itemId: string,
): CatalogueDetail {
  const p = object(value);
  if (id(p.id) !== itemId) invalid();
  const facts = parseFacts(p.facts);
  const photos = array(p.photos).map((p) => photo(p, tenant));
  if (photos.length > 20 || facts.length > factKeys.length) invalid();
  return {
    id: itemId,
    title: optionalText(p.title),
    currency: currency(p.currency),
    priceOre: integer(p.priceOre),
    facts,
    photos,
  };
}

function parseFacts(value: unknown): { slug: FactKey; value: string }[] {
  const facts = array(value).map((value) => {
    const f = object(value);
    if (!factKeys.includes(f.slug as FactKey)) invalid();
    return { slug: f.slug as FactKey, value: text(f.value).trim() };
  });
  if (
    facts.length > factKeys.length ||
    new Set(facts.map((f) => f.slug)).size !== facts.length
  )
    invalid();
  return facts.filter((f) => f.value.length > 0);
}

/** A small, stable summary of recorded facts; never infer attributes from titles. */
export function catalogueSummary(item: CatalogueItem) {
  const facts = [...(item.facts ?? [])];
  if (item.category?.trim() && !facts.some((f) => f.slug === "category"))
    facts.push({ slug: "category", value: item.category.trim() });
  const priority: FactKey[] = [
    "brand",
    "size",
    "color",
    "material",
    "category",
    "condition",
  ];
  const seen = new Set<string>();
  return priority
    .flatMap((slug) => {
      const fact = facts.find((f) => f.slug === slug);
      const normalized = fact?.value.trim().toLocaleLowerCase();
      if (!fact || !normalized || seen.has(normalized)) return [];
      seen.add(normalized);
      return [fact];
    })
    .slice(0, 3);
}

export function formatPrice(ore: number, code: string, locale: string): string {
  return new Intl.NumberFormat(formattingLocale(locale), {
    style: "currency",
    currency: code,
  }).format(ore / 100);
}

// The token is sent only to the configured Supabase origin, never to a URL
// supplied by a catalogue row. Authenticated downloads recheck Storage RLS.
export function photoSource(
  p: Photo,
  tenant: string,
  url: string,
  key: string,
  token: string,
) {
  const checked = photo(p, tenant);
  return {
    uri: `${url.replace(/\/$/, "")}/storage/v1/object/authenticated/${checked.bucket}/${checked.path}`,
    headers: { apikey: key, Authorization: `Bearer ${token}` },
  };
}

type PageState<T> = {
  status: "loading" | "ready" | "failed";
  items: T[];
  currency: string;
  total: number;
  offset: number;
  more: boolean;
  refreshing: boolean;
  failure: ReadFailure | null;
};
export type FetchPage<T = CatalogueItem> = (
  query: string,
  offset: number,
  signal: AbortSignal,
) => Promise<ReadPage<T>>;

// Each mounted account/store gets its own controller. Requests are cancelled
// and generation-checked, including transports that ignore AbortSignal.
export function createCataloguePager<T extends { id: string } = CatalogueItem>(
  fetchPage: FetchPage<T>,
  initialQuery = "",
) {
  let state: PageState<T> = {
    status: "loading",
    items: [],
    currency: "SEK",
    total: 0,
    offset: 0,
    more: false,
    refreshing: false,
    failure: null,
  };
  let query = initialQuery.trim(),
    generation = 0;
  let pending: AbortController | null = null;
  const listeners = new Set<() => void>();
  const set = (next: PageState<T>) => {
    state = next;
    listeners.forEach((l) => l());
  };
  const cancel = () => {
    generation++;
    pending?.abort();
    pending = null;
    if (state.more || state.refreshing)
      set({ ...state, more: false, refreshing: false });
  };
  async function load(mode: "reset" | "append" | "revalidate") {
    const append = mode === "append";
    const keepRows = mode === "revalidate" && state.status === "ready";
    if (
      append &&
      (state.status !== "ready" ||
        state.more ||
        state.refreshing ||
        state.offset >= state.total)
    )
      return;
    cancel();
    const run = generation;
    const controller = new AbortController();
    pending = controller;
    let offset = append ? state.offset : 0;
    const targetOffset = keepRows ? state.offset : 0;
    set(
      append
        ? { ...state, more: true, failure: null }
        : keepRows
          ? { ...state, refreshing: true, failure: null }
          : {
              ...state,
              status: "loading",
              items: [],
              total: 0,
              offset: 0,
              more: false,
              refreshing: false,
              failure: null,
            },
    );
    try {
      const items = new Map((append ? state.items : []).map((i) => [i.id, i]));
      let page: ReadPage<T>;
      let expectedCurrency = append ? state.currency : null;
      do {
        page = await fetchPage(query, offset, controller.signal);
        if (run !== generation) return;
        if (
          page.offset !== offset ||
          (expectedCurrency !== null && page.currency !== expectedCurrency)
        )
          invalid();
        expectedCurrency = page.currency;
        page.items.forEach((i) => items.set(i.id, i));
        // Offsets follow server rows, not deduplicated rows. An empty page
        // stops paging until the next refresh, including shrinking inventory.
        offset = page.items.length ? offset + page.items.length : page.total;
      } while (keepRows && offset < targetOffset && offset < page.total);
      // Publish the entire loaded range together. Keeping status ready during
      // revalidation leaves the FlatList mounted and preserves its scroll.
      set({
        status: "ready",
        items: [...items.values()],
        currency: page.currency,
        total: page.total,
        offset,
        more: false,
        refreshing: false,
        failure: null,
      });
    } catch (error) {
      if (run !== generation) return;
      const failure = readFailure(error);
      set(
        (append || keepRows) && failure === "failed"
          ? { ...state, more: false, refreshing: false, failure }
          : {
              ...state,
              status: "failed",
              items: [],
              total: 0,
              offset: 0,
              more: false,
              refreshing: false,
              failure,
            },
      );
    } finally {
      if (run === generation) pending = null;
    }
  }
  return {
    getState: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    search(next: string) {
      query = next.trim();
      return load("reset");
    },
    refresh: () => load("reset"),
    revalidate: () => load("revalidate"),
    more: () => load("append"),
    cancel,
  };
}
