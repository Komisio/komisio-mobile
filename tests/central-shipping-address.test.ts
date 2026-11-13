import test from "node:test";
import assert from "node:assert/strict";
import {
  parseSaveShippingAddress,
  parseShippingAccount,
  shippingAddressOutcome,
} from "../src/lib/central-shipping-address.ts";
import { createPendingCommand } from "../src/lib/pending-command.ts";
const tenant = "f7800000-0000-4000-8000-000000000801",
  seller = "f7800000-0000-4000-8000-000000000802",
  id = "f7800000-0000-4000-8000-000000000803";
const command = {
  action: "save",
  requestId: id,
  tenantId: tenant,
  sellerId: seller,
  expectedRevision: 0,
  address: { street: "Testgatan 1", postalCode: "12345", city: "Teststad" },
};
test("address commands bind identity and revision and cannot write other profile fields", () => {
  assert.deepEqual(parseSaveShippingAddress(command, tenant, seller), command);
  for (const extra of [
    { tenantId: id },
    { sellerId: id },
    { expectedRevision: -1 },
    { expectedRevision: 1.5 },
    { name: "Another person" },
    { address: { ...command.address, country: "DE" } },
    { address: { ...command.address, postalCode: "01234" } },
  ])
    assert.throws(() =>
      parseSaveShippingAddress({ ...command, ...extra }, tenant, seller),
    );
  assert.equal(parseShippingAccount({ account: null }).account, null);
  assert.equal(
    parseShippingAccount({
      account: {
        tenantId: tenant,
        sellerId: seller,
        revision: 0,
        address: null,
      },
    }).account?.address,
    null,
  );
  assert.throws(() =>
    parseShippingAccount({
      account: {
        tenantId: tenant,
        sellerId: seller,
        revision: 0,
        address: { ...command.address, postalCode: "bad" },
      },
    }),
  );
});
test("lost address reply replays the same request; stale profile conflict requires reload", async () => {
  let stored: string | null = null;
  const sent: unknown[] = [];
  const writer = createPendingCommand({
    key: "address",
    binding: JSON.stringify([tenant, seller]),
    storage: {
      getItem: async () => stored,
      setItem: async (_k, v) => {
        stored = v;
      },
      removeItem: async () => {
        stored = null;
      },
    },
    lock: async (_k, run) => run(),
    parse: (v) => parseSaveShippingAddress(v, tenant, seller),
    send: async (c) => {
      sent.push(c);
      return sent.length === 1
        ? shippingAddressOutcome(503, null, id)
        : shippingAddressOutcome(200, { id }, id);
    },
  });
  await writer.load();
  await writer.submit(parseSaveShippingAddress(command, tenant, seller));
  assert.equal(writer.getState().status, "pending");
  await writer.retry();
  assert.equal(writer.getState().status, "success");
  assert.deepEqual(sent, [command, command]);
  assert.equal(stored, null);
  assert.deepEqual(
    shippingAddressOutcome(409, { error: "PROFILE_CHANGED" }, id),
    { kind: "conflict", code: "PROFILE_CHANGED" },
  );
  assert.equal(shippingAddressOutcome(200, { id: seller }, id).kind, "unknown");
});
