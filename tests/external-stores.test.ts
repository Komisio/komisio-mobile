import assert from "node:assert/strict";
import test from "node:test";
import {
  parseExternalStore,
  parseExternalStorePage,
  readExternalStores,
} from "../src/lib/external-stores.ts";
const store = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Synthetic store",
  slug: "synthetic-store",
  city: null,
  country: null,
  currency: "SEK",
};
test("external discovery validates the limited projection without inventing country or exposing extra data", () => {
  assert.deepEqual(
    parseExternalStore({ ...store, email: "private@example.test", policy: {} }),
    store,
  );
  for (const row of [
    { ...store, id: "bad" },
    { ...store, name: "" },
    { ...store, city: 5 },
    { ...store, country: "sv" },
    { ...store, currency: "ZZZ" },
  ])
    assert.throws(() => parseExternalStore(row));
  assert.deepEqual(parseExternalStorePage({ stores: [], hasMore: false }), {
    stores: [],
    hasMore: false,
  });
  for (const page of [
    { stores: [store, store], hasMore: false },
    { stores: [], hasMore: true },
    { stores: [], hasMore: "false" },
    { stores: null, hasMore: false },
  ])
    assert.throws(() => parseExternalStorePage(page));
});
test("external discovery uses only the explicit opt-in RPC and verifies exact selected-store reads", async () => {
  const calls: unknown[] = [];
  const client = {
    rpc: async (name: string, args: Record<string, unknown>) => {
      calls.push([name, args]);
      return { data: { stores: [store], hasMore: false }, error: null };
    },
  };
  assert.equal(
    (await readExternalStores(client, " Synthetic ")).stores[0].id,
    store.id,
  );
  assert.deepEqual(calls[0], [
    "public_external_app_stores",
    { p_query: "Synthetic", p_limit: 25, p_offset: 0, p_tenant: null },
  ]);
  await readExternalStores(client, "", 0, store.id);
  assert.deepEqual(calls[1], [
    "public_external_app_stores",
    { p_query: "", p_limit: 1, p_offset: 0, p_tenant: store.id },
  ]);
  await assert.rejects(
    readExternalStores(client, "", 0, "00000000-0000-4000-8000-000000000002"),
  );
  const missing = {
    rpc: async () => ({ data: null, error: { code: "PGRST202" } }),
  };
  await assert.rejects(
    readExternalStores(missing),
    /EXTERNAL_INTAKE_UNAVAILABLE/,
  );
  const before = calls.length;
  for (const params of [
    ["x".repeat(101), 0],
    ["", -1],
    ["", 10001],
    ["", 0.1],
  ] as const)
    await assert.rejects(readExternalStores(client, params[0], params[1]));
  assert.equal(calls.length, before, "invalid reads never reach the server");
});
