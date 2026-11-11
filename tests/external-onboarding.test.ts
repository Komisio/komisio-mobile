import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseCompleteExternalOffer,
  parseExternalOnboarding,
  externalOnboardingOutcome,
} from "../src/lib/external-onboarding.ts";
import { createPendingCommand } from "../src/lib/pending-command.ts";

const id = (n: number) =>
  `f7300000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const command = {
  action: "complete",
  requestId: id(1),
  offerId: id(2),
  agreementVersionId: id(3),
  profile: { name: "Synthetic seller", email: "contact@example.test" },
  bank: {
    holder: "Synthetic seller",
    country: "SE",
    kind: "local",
    routing: "8327",
    account: "123456789",
  },
} as const;
const read = {
  offerId: id(2),
  tenantId: id(4),
  phone: "46700007300",
  account: {
    id: id(5),
    name: "Synthetic seller",
    email: "contact@example.test",
    hasBank: true,
  },
  store: { address: null, openingHours: [] },
  handover: {
    id: id(6),
    reference: "H-128",
    status: "open",
    receivedAt: null,
    itemCount: 1,
    items: [
      {
        requestId: id(7),
        offerId: id(2),
        description: "Jacket",
        brand: "",
        photoId: id(8),
      },
    ],
  },
  qrPng: "data:image/png;base64,aGVsbG8=",
};

test("onboarding commands cannot substitute identity or bypass Swedish bank details", () => {
  assert.deepEqual(parseCompleteExternalOffer(command, id(2)), command);
  assert.throws(() =>
    parseCompleteExternalOffer({ ...command, ownerId: id(9) }, id(2)),
  );
  assert.throws(() => parseCompleteExternalOffer(command, id(9)));
  for (const bank of [
    { ...command.bank, country: "DE" },
    { ...command.bank, routing: "" },
    { ...command.bank, kind: "iban" },
  ])
    assert.throws(() =>
      parseCompleteExternalOffer({ ...command, bank }, id(2)),
    );
  assert.deepEqual(
    parseCompleteExternalOffer({ ...command, profile: null, bank: null }, id(2))
      .bank,
    null,
  );
});
test("handover reads bind the offer, grouped count and QR to real current state", () => {
  assert.equal(
    parseExternalOnboarding(read, id(2)).handover?.reference,
    "H-128",
  );
  for (const patch of [
    { offerId: id(9) },
    { account: null },
    { qrPng: null },
    { qrPng: "https://other.test/code.png" },
    { handover: { ...read.handover, itemCount: 2 } },
    { handover: { ...read.handover, status: "received" } },
  ])
    assert.throws(() => parseExternalOnboarding({ ...read, ...patch }, id(2)));
  assert.equal(
    parseExternalOnboarding(
      {
        ...read,
        qrPng: null,
        handover: {
          ...read.handover,
          status: "received",
          receivedAt: "2026-11-10T10:00:00Z",
        },
      },
      id(2),
    ).handover?.status,
    "received",
  );
});
test("lost onboarding response retries the exact profile, bank and agreement after remount", async () => {
  const values = new Map<string, string>(),
    sent: unknown[] = [];
  const deps = {
    key: "synthetic-onboarding",
    binding: "phone-owner/project/offer",
    storage: {
      getItem: async (k: string) => values.get(k) ?? null,
      setItem: async (k: string, v: string) => {
        values.set(k, v);
      },
      removeItem: async (k: string) => {
        values.delete(k);
      },
    },
    lock: async <T>(_key: string, fn: () => Promise<T>) => fn(),
    parse: (v: unknown) => parseCompleteExternalOffer(v, id(2)),
    send: async (c: ReturnType<typeof parseCompleteExternalOffer>) => {
      sent.push(c);
      return externalOnboardingOutcome(
        sent.length === 1 ? 503 : 200,
        { id: c.requestId },
        c.requestId,
      );
    },
  };
  const first = createPendingCommand(deps);
  await first.submit(command);
  assert.equal(first.getState().status, "pending");
  const resumed = createPendingCommand(deps);
  await resumed.load();
  await resumed.submit({ ...command, requestId: id(10) });
  assert.equal(sent.length, 1);
  await resumed.retry();
  assert.deepEqual(sent, [command, command]);
  assert.equal(resumed.getState().status, "success");
  assert.equal(values.size, 0);
});
test("unconfirmed and MFA outcomes never report completed account creation", () => {
  assert.equal(
    externalOnboardingOutcome(200, { id: id(10) }, id(1)).kind,
    "unknown",
  );
  assert.deepEqual(
    externalOnboardingOutcome(403, { error: "MFA_REQUIRED" }, id(1)),
    { kind: "unknown", code: "MFA_REQUIRED" },
  );
  assert.equal(
    externalOnboardingOutcome(409, { error: "OFFER_EXPIRED" }, id(1)).kind,
    "conflict",
  );
});
