import assert from "node:assert/strict";
import test from "node:test";
import { createWebCommandStorage } from "../src/lib/web-command-storage.ts";
import { commandRefusal } from "../src/lib/mobile-command-http.ts";

function fixture() {
  const values = new Map<string, string>();
  const browser = {
    get length() {
      return values.size;
    },
    key: (index: number) => [...values.keys()][index] ?? null,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
  return { values, browser, store: createWebCommandStorage(() => browser) };
}
const bank = "komisio.pending.bank.v1.user.tenant.seller";
test("logout purges legacy bank payloads for every account without losing payout replay IDs", async () => {
  const f = fixture();
  f.store.setUser("user");
  await f.store.commands.setItem(bank, "synthetic account");
  f.values.set("komisio.pending.bank.v1.other.tenant.seller", "legacy");
  f.values.set("komisio.pending.payout.v1.user.tenant.seller", "payout replay");
  f.values.set("unrelated", "keep");
  f.store.setUser(null);
  assert.equal(f.values.has(bank), false);
  assert.equal(f.values.size, 2);
  await assert.rejects(f.store.commands.setItem(bank, "late writer"));
  await assert.rejects(f.store.commands.getItem(bank));
  assert.equal(f.values.has(bank), false);
});
test("same-user reload retains recovery, identity changes remove other users' bank payloads", async () => {
  const f = fixture();
  f.store.setUser("user");
  await f.store.commands.setItem(bank, "pending");
  f.store.setUser("user");
  assert.equal(await f.store.commands.getItem(bank), "pending");
  f.store.setUser("other");
  assert.equal(f.values.has(bank), false);
  await assert.rejects(f.store.commands.setItem(bank, "wrong user"));
});
test("failed browser cleanup prevents stale bank writes", async () => {
  const f = fixture();
  f.store.setUser("user");
  await f.store.commands.setItem(bank, "pending");
  f.browser.removeItem = () => {};
  assert.throws(() => f.store.setUser(null));
  await assert.rejects(f.store.commands.setItem(bank, "late"));
});
test("only known API refusals are candidates for first-attempt settlement", () => {
  for (const [status, error] of [
    [400, "INVALID_INPUT"],
    [403, "FORBIDDEN"],
    [404, "NOT_FOUND"],
    [409, "SELLER_CLOSED"],
  ] as const)
    assert.deepEqual(commandRefusal(status, { error }), {
      kind: "rejected",
      code: error,
    });
  for (const [status, error] of [
    [401, "AUTH_REQUIRED"],
    [403, "MFA_REQUIRED"],
    [409, "PASSWORD_UPDATE_REQUIRED"],
    [503, "REQUEST_FAILED"],
    [409, "REQUEST_CONFLICT"],
    [403, "proxy denied"],
    [400, undefined],
  ] as const)
    assert.equal(commandRefusal(status, { error }), null);
});
