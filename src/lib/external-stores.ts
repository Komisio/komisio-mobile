export const EXTERNAL_STORE_PAGE_SIZE = 25;
export const externalCurrencies = ["SEK", "NOK", "DKK", "EUR", "USD"] as const;
export type ExternalCurrency = (typeof externalCurrencies)[number];
export type ExternalStore = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  country: string | null;
  currency: ExternalCurrency;
};
export type ExternalStorePage = { stores: ExternalStore[]; hasMore: boolean };

const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
const object = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("INVALID_EXTERNAL_STORE");
  return value as Record<string, unknown>;
};
function text(value: unknown, max: number, empty = false): string {
  if (
    typeof value !== "string" ||
    (!empty && !value.trim()) ||
    value.length > max
  )
    throw new Error("INVALID_EXTERNAL_STORE");
  return value;
}
export function parseExternalStore(value: unknown): ExternalStore {
  const row = object(value);
  const id = text(row.id, 36);
  if (
    !uuid.test(id) ||
    !externalCurrencies.includes(row.currency as ExternalCurrency)
  )
    throw new Error("INVALID_EXTERNAL_STORE");
  const country = row.country === null ? null : text(row.country, 2);
  if (country !== null && !/^[A-Z]{2}$/.test(country))
    throw new Error("INVALID_EXTERNAL_STORE");
  return {
    id,
    name: text(row.name, 200),
    slug: text(row.slug, 100),
    city: row.city === null ? null : text(row.city, 120),
    country,
    currency: row.currency as ExternalCurrency,
  };
}
export function parseExternalStorePage(
  value: unknown,
  limit = EXTERNAL_STORE_PAGE_SIZE,
): ExternalStorePage {
  const page = object(value);
  if (
    !Array.isArray(page.stores) ||
    page.stores.length > limit ||
    typeof page.hasMore !== "boolean" ||
    (page.hasMore && page.stores.length !== limit)
  )
    throw new Error("INVALID_EXTERNAL_STORE");
  const stores = page.stores.map(parseExternalStore);
  if (new Set(stores.map((s) => s.id)).size !== stores.length)
    throw new Error("INVALID_EXTERNAL_STORE");
  return { stores, hasMore: page.hasMore };
}

type RpcClient = {
  rpc: (
    name: string,
    args: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: { code?: string } | null }>;
};
export async function readExternalStores(
  client: RpcClient,
  query = "",
  offset = 0,
  tenant: string | null = null,
) {
  if (
    query.length > 100 ||
    !Number.isInteger(offset) ||
    offset < 0 ||
    offset > 10000 ||
    (tenant !== null && !uuid.test(tenant))
  )
    throw new Error("INVALID_EXTERNAL_STORE");
  const limit = tenant ? 1 : EXTERNAL_STORE_PAGE_SIZE;
  const { data, error } = await client.rpc("public_external_app_stores", {
    p_query: query.trim(),
    p_limit: limit,
    p_offset: offset,
    p_tenant: tenant,
  });
  if (error)
    throw new Error(
      error.code === "PGRST202"
        ? "EXTERNAL_INTAKE_UNAVAILABLE"
        : "EXTERNAL_STORES_FAILED",
    );
  const page = parseExternalStorePage(data, limit);
  if (
    tenant &&
    (page.hasMore || page.stores.some((store) => store.id !== tenant))
  )
    throw new Error("INVALID_EXTERNAL_STORE");
  return page;
}

/** Read only the host-designated recipient; never fall back to a store search. */
export async function readCentralRecipient(
  client: RpcClient,
): Promise<ExternalStore | null> {
  const { data, error } = await client.rpc("public_central_app_recipient", {});
  if (error)
    throw new Error(
      error.code === "PGRST202"
        ? "EXTERNAL_INTAKE_UNAVAILABLE"
        : "EXTERNAL_STORES_FAILED",
    );
  if (data === null) return null;
  const store = parseExternalStore(data);
  if (
    store.currency !== "SEK" ||
    store.country !== "SE" ||
    store.name !== "Komisio"
  )
    throw new Error("INVALID_EXTERNAL_STORE");
  return store;
}
