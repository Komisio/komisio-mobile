import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createCataloguePager,
  parsePage,
  parseDetail,
  photoSource,
  readFailure,
  type CataloguePage,
} from "../src/lib/catalogue.ts";

const tenant = "00000000-0000-4000-8000-000000000001";
const item = "00000000-0000-4000-8000-000000000002";
const image = "00000000-0000-4000-8000-000000000003";
const row = {
  id: item,
  title: "Synthetic coat",
  category: "Coats",
  priceOre: 12550,
  photo: null,
};
const page = (offset = 0): CataloguePage => ({
  currency: "SEK",
  items: [row],
  total: 3,
  offset,
});
const photo = {
  id: image,
  bucket: "item-photos" as const,
  path: `${tenant}/${item}/${image}.jpg`,
};
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

test("late results from an older search cannot replace a newer search", async () => {
  const first = deferred<CataloguePage>();
  const pager = createCataloguePager(async (q) =>
    q === "old"
      ? first.promise
      : { ...page(), items: [{ ...row, title: "New result" }] },
  );
  const old = pager.search("old");
  await pager.search("new");
  first.resolve(page());
  await old;
  assert.equal(pager.getState().items[0].title, "New result");
});

test("cancelling on blur/unmount ignores a transport that completes anyway", async () => {
  const response = deferred<CataloguePage>();
  let signal: AbortSignal | undefined;
  const pager = createCataloguePager(async (_q, _offset, s) => {
    signal = s;
    return response.promise;
  });
  const loading = pager.refresh();
  pager.cancel();
  response.resolve(page());
  await loading;
  assert.equal(signal?.aborted, true);
  assert.equal(pager.getState().items.length, 0);
});

test("pagination deduplicates changing inventory while advancing by server rows", async () => {
  const offsets: number[] = [];
  const next = deferred<CataloguePage>();
  const pager = createCataloguePager(async (_q, offset) => {
    offsets.push(offset);
    return offset ? next.promise : page();
  });
  await pager.refresh();
  const loading = pager.more();
  await pager.more();
  next.resolve({ ...page(1), items: [row, { ...row, id: image }] });
  await loading;
  assert.deepEqual(offsets, [0, 1]);
  assert.equal(pager.getState().items.length, 2);
  assert.equal(pager.getState().offset, 3);
});

test("a failed later page retries the same offset and keeps existing rows", async () => {
  let fail = true;
  const offsets: number[] = [];
  const pager = createCataloguePager(async (_q, offset) => {
    offsets.push(offset);
    if (offset && fail) throw new Error("network failure");
    return { ...page(offset), items: offset ? [] : [row] };
  });
  await pager.refresh();
  await pager.more();
  assert.equal(pager.getState().items.length, 1);
  assert.equal(pager.getState().failure, "failed");
  fail = false;
  await pager.more();
  assert.deepEqual(offsets, [0, 1, 1]);
  assert.equal(pager.getState().offset, 3);
});

test("revoked access clears previously loaded rows even when loading more", async () => {
  const pager = createCataloguePager(async (_q, offset) => {
    if (offset) throw { code: "42501", message: "FORBIDDEN" };
    return page();
  });
  await pager.refresh();
  await pager.more();
  assert.equal(pager.getState().status, "failed");
  assert.equal(pager.getState().failure, "denied");
  assert.deepEqual(pager.getState().items, []);
});

test("refresh discards old rows immediately and reports a failed refresh", async () => {
  let fail = false;
  const pager = createCataloguePager(async () => {
    if (fail) throw new Error("offline");
    return page();
  });
  await pager.refresh();
  fail = true;
  const refreshing = pager.refresh();
  assert.deepEqual(pager.getState().items, []);
  await refreshing;
  assert.equal(pager.getState().status, "failed");
});

test("returning to a 34-item catalogue keeps both pages until revalidation completes", async () => {
  const rows = Array.from({ length: 34 }, (_, index) => ({
    ...row,
    id: `00000000-0000-4000-8000-${String(index + 10).padStart(12, "0")}`,
  }));
  const lastPage = deferred<CataloguePage>();
  const requests: [string, number][] = [];
  let returning = false;
  const pager = createCataloguePager(async (query, offset) => {
    requests.push([query, offset]);
    if (returning && offset === 30) return lastPage.promise;
    return {
      ...page(offset),
      total: 34,
      items: rows.slice(offset, offset + 30).map((r) => ({
        ...r,
        priceOre: returning ? 9999 : r.priceOre,
      })),
    };
  });
  await pager.search(" coat ");
  await pager.more();
  const previousRows = pager.getState().items;
  pager.cancel(); // Blur to item detail or another tab.
  returning = true;
  const snapshots: ReturnType<typeof pager.getState>[] = [];
  pager.subscribe(() => snapshots.push(pager.getState()));
  const returningLoad = pager.revalidate();
  await Promise.resolve();
  assert.equal(pager.getState().items, previousRows);
  assert.equal(pager.getState().refreshing, true);
  await pager.more(); // Do not mix pagination into a range refresh.
  lastPage.resolve({ ...page(30), total: 34, items: rows.slice(30) });
  await returningLoad;
  assert.deepEqual(requests, [
    ["coat", 0],
    ["coat", 30],
    ["coat", 0],
    ["coat", 30],
  ]);
  assert.ok(
    snapshots.every((s) => s.status === "ready" && s.items.length === 34),
  );
  assert.equal(pager.getState().offset, 34);
  assert.equal(pager.getState().items[0].priceOre, 9999);
  assert.equal(pager.getState().refreshing, false);
});

test("revalidation retains rows on network failure and retries the loaded range", async () => {
  let offline = false;
  const pager = createCataloguePager(async (_q, offset) => {
    if (offline) throw new Error("offline");
    return {
      ...page(offset),
      items: [{ ...row, id: String(offset) }],
      total: 2,
    };
  });
  await pager.revalidate();
  await pager.more();
  const rows = pager.getState().items;
  offline = true;
  await pager.revalidate();
  assert.equal(pager.getState().items, rows);
  assert.equal(pager.getState().status, "ready");
  assert.equal(pager.getState().failure, "failed");
  assert.equal(pager.getState().refreshing, false);
  offline = false;
  await pager.revalidate();
  assert.equal(pager.getState().items.length, 2);
  assert.equal(pager.getState().failure, null);
});

test("denied access on a later revalidation page clears the entire catalogue", async () => {
  let denied = false;
  const pager = createCataloguePager(async (_q, offset) => {
    if (denied && offset) throw { code: "42501" };
    return { ...page(offset), total: 2 };
  });
  await pager.revalidate();
  await pager.more();
  denied = true;
  await pager.revalidate();
  assert.equal(pager.getState().status, "failed");
  assert.equal(pager.getState().failure, "denied");
  assert.deepEqual(pager.getState().items, []);
});

test("a new search supersedes an in-flight revalidation", async () => {
  const response = deferred<CataloguePage>();
  let returning = false;
  const pager = createCataloguePager(async (q) => {
    if (q === "new") return { ...page(), items: [{ ...row, title: "New" }] };
    return returning ? response.promise : page();
  });
  await pager.revalidate();
  returning = true;
  const old = pager.revalidate();
  await pager.search("new");
  response.resolve(page());
  await old;
  assert.equal(pager.getState().items[0].title, "New");
  assert.equal(pager.getState().refreshing, false);
});

test("blur cancels revalidation and pagination without leaving busy controls", async () => {
  for (const operation of ["revalidate", "more"] as const) {
    const response = deferred<CataloguePage>();
    let delay = false;
    let signal: AbortSignal | undefined;
    const pager = createCataloguePager(async (_q, _offset, s) => {
      signal = s;
      return delay ? response.promise : page();
    });
    await pager.revalidate();
    const previousRows = pager.getState().items;
    delay = true;
    const pending = pager[operation]();
    pager.cancel();
    assert.equal(signal?.aborted, true);
    assert.equal(pager.getState().more, false);
    assert.equal(pager.getState().refreshing, false);
    response.resolve({ ...page(), items: [] });
    await pending;
    assert.equal(pager.getState().items, previousRows);
    delay = false;
    await pager.revalidate();
    assert.equal(pager.getState().status, "ready");
  }
});

test("revalidation stops when inventory shrinks instead of retaining removed rows", async () => {
  let shrinking = false;
  const offsets: number[] = [];
  const pager = createCataloguePager(async (_q, offset) => {
    offsets.push(offset);
    return {
      ...page(offset),
      items: shrinking ? [] : [{ ...row, id: String(offset) }],
      total: shrinking ? 0 : 2,
    };
  });
  await pager.revalidate();
  await pager.more();
  shrinking = true;
  await pager.revalidate();
  assert.deepEqual(offsets, [0, 1, 0]);
  assert.equal(pager.getState().status, "ready");
  assert.equal(pager.getState().total, 0);
  assert.deepEqual(pager.getState().items, []);
});

test("read parsers reject malformed amounts, foreign photo paths and unexpected detail identities", () => {
  assert.deepEqual(parsePage(page(), tenant), page());
  assert.throws(() =>
    parsePage({ ...page(), items: [{ ...row, priceOre: 1.5 }] }, tenant),
  );
  assert.throws(() =>
    parsePage(
      {
        ...page(),
        items: [
          { ...row, photo: { ...photo, path: `${item}/${item}/${image}.jpg` } },
        ],
      },
      tenant,
    ),
  );
  const detail = {
    id: item,
    title: "Coat",
    currency: "SEK",
    priceOre: 100,
    facts: [{ slug: "size", value: "M" }],
    photos: [photo],
  };
  assert.equal(parseDetail(detail, tenant, item).photos.length, 1);
  assert.throws(() => parseDetail(detail, tenant, image));
  assert.throws(() =>
    parseDetail(
      { ...detail, facts: [{ slug: "seller", value: "private" }] },
      tenant,
      item,
    ),
  );
});

test("photo requests authenticate only against the configured Storage endpoint", () => {
  const source = photoSource(
    photo,
    tenant,
    "https://example.supabase.co",
    "public-key",
    "test-token",
  );
  assert.equal(
    source.uri,
    `https://example.supabase.co/storage/v1/object/authenticated/item-photos/${photo.path}`,
  );
  assert.equal(source.headers.Authorization, "Bearer test-token");
  assert.throws(() =>
    photoSource(
      { ...photo, path: "https://attacker.test/photo.jpg" },
      tenant,
      "https://example.supabase.co",
      "public-key",
      "test-token",
    ),
  );
  assert.equal(readFailure({ message: "ITEM_NOT_FOUND" }), "missing");
  assert.equal(readFailure({ message: "AUTH_REQUIRED" }), "denied");
});

test("safe inherited derivatives are supported without relaxing destination or tenant validation", () => {
  const derivative = { ...photo, bucket: "seller-reception-photos" as const };
  assert.deepEqual(
    parsePage({ ...page(), items: [{ ...row, photo: derivative }] }, tenant)
      .items[0].photo,
    derivative,
  );
  const detail = {
    id: item,
    title: "Coat",
    currency: "SEK",
    priceOre: 100,
    facts: [],
    photos: [derivative],
  };
  assert.deepEqual(parseDetail(detail, tenant, item).photos, [derivative]);
  const source = photoSource(
    derivative,
    tenant,
    "https://example.supabase.co",
    "public-key",
    "test-token",
  );
  assert.equal(
    source.uri,
    `https://example.supabase.co/storage/v1/object/authenticated/seller-reception-photos/${photo.path}`,
  );
  assert.equal(source.headers.Authorization, "Bearer test-token");
  for (const invalid of [
    { ...derivative, bucket: "other-private-bucket" },
    { ...derivative, path: `${tenant}/${item}/${image}.png` },
    { ...derivative, path: `${item}/${item}/${image}.jpg` },
    { ...derivative, path: `${tenant}/${item}/${image}.jpg?download=1` },
    { ...derivative, path: `${tenant}/${item}/${image}.jpg/extra` },
  ])
    assert.throws(() =>
      parseDetail({ ...detail, photos: [invalid] }, tenant, item),
    );
  // Keep the old descriptor usable until the coordinated platform rollout.
  const legacy = { ...photo, bucket: "reception-photos" as const };
  assert.deepEqual(
    parseDetail({ ...detail, photos: [legacy] }, tenant, item).photos,
    [legacy],
  );
});
