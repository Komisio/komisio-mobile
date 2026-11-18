import test from "node:test";
import assert from "node:assert/strict";
import {
  parseIntakeProfile,
  parseSaveIntakeProfile,
  intakeProfileOutcome,
} from "../src/lib/central-intake-profile.ts";
import { createPendingCommand } from "../src/lib/pending-command.ts";
const id = (n: number) =>
  `f8580000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const command = {
  action: "save",
  requestId: id(1),
  tenantId: id(2),
  agreementVersionId: id(3),
  expectedRevision: -1,
  address: { street: "Test 1", postalCode: "12345", city: "Teststad" },
  contact: { firstName: "Alex", lastName: "Example", phone: "+46700000000" },
  acceptAgreement: true,
};
test("one-time sender details are explicit, Sweden scoped and never bank or identity linking data", () => {
  assert.deepEqual(parseSaveIntakeProfile(command, id(2)), command);
  for (const c of [
    { ...command, ownerId: id(4) },
    { ...command, tenantId: id(4) },
    { ...command, bank: {} },
    { ...command, agreementVersionId: "" },
    { ...command, acceptAgreement: undefined },
    { ...command, address: { ...command.address, country: "DE" } },
    { ...command, contact: { ...command.contact, phone: "0700000000" } },
  ])
    assert.throws(() => parseSaveIntakeProfile(c, id(2)));
  const profile = {
    tenantId: id(2),
    account: null,
    agreement: {
      id: id(3),
      version: 1,
      title: "Terms",
      body: "Synthetic terms",
      language: "sv",
    },
    agreementAccepted: false,
  };
  assert.equal(parseIntakeProfile(profile).agreementAccepted, false);
  assert.throws(() =>
    parseIntakeProfile({
      ...profile,
      account: {
        tenantId: id(4),
        sellerId: id(5),
        revision: 1,
        address: command.address,
        contact: command.contact,
      },
    }),
  );
});
test("a lost profile reply retains the exact agreement and address until an explicit retry", async () => {
  let saved: string | null = null,
    calls = 0;
  const sent: unknown[] = [];
  const writer = createPendingCommand({
    key: "test",
    binding: "synthetic user tenant",
    storage: {
      getItem: async () => saved,
      setItem: async (_k, v) => {
        saved = v;
      },
      removeItem: async () => {
        saved = null;
      },
    },
    lock: async (_k, work) => work(),
    parse: (v) => parseSaveIntakeProfile(v, id(2)),
    send: async (c) => {
      sent.push(c);
      return ++calls === 1
        ? intakeProfileOutcome(503, null, c.requestId)
        : intakeProfileOutcome(200, { id: c.requestId }, c.requestId);
    },
  });
  await writer.load();
  await writer.submit(parseSaveIntakeProfile(command, id(2)));
  assert.equal(writer.getState().status, "pending");
  assert.ok(saved);
  await writer.submit(
    parseSaveIntakeProfile(
      { ...command, requestId: id(9), agreementVersionId: id(8) },
      id(2),
    ),
  );
  assert.equal(calls, 1);
  await writer.retry();
  assert.deepEqual(sent, [command, command]);
  assert.equal(saved, null);
  assert.equal(writer.getState().status, "success");
  assert.equal(
    intakeProfileOutcome(409, { error: "AGREEMENT_CHANGED" }, id(1)).kind,
    "conflict",
  );
  assert.equal(intakeProfileOutcome(200, { id: id(9) }, id(1)).kind, "unknown");
});
