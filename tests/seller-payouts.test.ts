import assert from "node:assert/strict";
import test from "node:test";
import {
  parsePendingPayout,
  parsePayoutPage,
  payoutAmount,
  payoutAmountInput,
  payoutCommandOutcome,
  payoutLimitError,
  payoutOffset,
} from "../src/lib/seller-payouts.ts";
import {
  createPendingCommand,
  type CommandOutcome,
} from "../src/lib/pending-command.ts";
import { sendMobileCommand } from "../src/lib/mobile-command-http.ts";
import { payoutCopy } from "../src/lib/payout-copy.ts";
const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const tenant = id(1),
  seller = id(2);
const pending = () => ({
  currency: "SEK",
  command: {
    action: "requestPayout",
    tenantId: tenant,
    sellerId: seller,
    requestId: id(3),
    amountOre: 10101,
  },
});
function page(offset = 0) {
  return {
    tenantId: tenant,
    sellerId: seller,
    currency: "SEK",
    total: 27,
    offset,
    limit: 25,
    thresholdOre: 10000,
    balance: {
      sellerId: seller,
      availableOre: -125,
      reservedOre: 5000,
      paidOre: 7000,
    },
    payouts: Array.from(
      { length: Math.min(25, Math.max(0, 27 - offset)) },
      (_, i) => ({
        id: id(i + offset + 10),
        amount_ore: 12345,
        status: i === 0 ? "paid" : "requested",
        request_source: "seller",
        requested_at: "2026-10-28T20:00:00+00:00",
      }),
    ),
  };
}
test("decimal input converts to integer units without rounding or scientific notation", () => {
  for (const [text, expected] of [
    ["0.01", 1],
    ["101,01", 10101],
    ["999999999.99", 99999999999],
    ["1.1", 110],
    [" 12 ", 1200],
  ] as const)
    assert.equal(payoutAmount(text), expected);
  for (const value of [
    "0",
    "0.00",
    "1.001",
    "1e3",
    "-1",
    "+1",
    "1 000",
    "1,000.00",
    "1000000000",
    "NaN",
    ".1",
    "1.",
  ])
    assert.throws(() => payoutAmount(value));
  for (const amount of [1, 99, 10101, 99999999999])
    assert.equal(payoutAmount(payoutAmountInput(amount)), amount);
  assert.throws(() => payoutAmountInput(100000000000));
  assert.equal(payoutLimitError(9999, 20000, 10000), "below");
  assert.equal(payoutLimitError(20001, 20000, 10000), "above");
  assert.equal(payoutLimitError(20000, 20000, 10000), null);
});
test("paged history preserves negative server balance, total, actual status and request date", () => {
  const first = parsePayoutPage(page(), tenant, seller, 0),
    next = parsePayoutPage(page(25), tenant, seller, 25);
  assert.equal(first.balance.availableOre, -125);
  assert.equal(first.balance.reservedOre, 5000);
  assert.equal(first.payouts[0].status, "paid");
  assert.equal(first.payouts[0].requestedAt, "2026-10-28T20:00:00+00:00");
  assert.equal(first.total, 27);
  assert.equal(next.payouts.length, 2);
  assert.equal(
    parsePayoutPage({ ...page(), total: 0, payouts: [] }, tenant, seller, 0)
      .payouts.length,
    0,
  );
  assert.equal(parsePayoutPage(page(50), tenant, seller, 50).total, 27);
  assert.equal(payoutOffset(100000), 2500000);
  assert.throws(() => payoutOffset(100001));
});
test("missing/partial/foreign financial pages fail closed instead of inventing empty history", () => {
  for (const patch of [
    { tenantId: seller },
    { sellerId: tenant },
    { currency: "XXX" },
    { offset: 25 },
    { total: -1 },
    { payouts: [] },
    { limit: 100 },
    { thresholdOre: -1 },
    { balance: { ...page().balance, sellerId: tenant } },
  ])
    assert.throws(() =>
      parsePayoutPage({ ...page(), ...patch }, tenant, seller, 0),
    );
  for (const patch of [
    { status: "processing" },
    { amount_ore: 0.1 },
    { requested_at: "not a date" },
    { request_source: "unknown" },
  ]) {
    const data = page();
    data.payouts[0] = {
      ...data.payouts[0],
      ...patch,
    } as (typeof data.payouts)[number];
    assert.throws(() => parsePayoutPage(data, tenant, seller, 0));
  }
  const duplicate = page();
  duplicate.payouts[1] = duplicate.payouts[0];
  assert.throws(() => parsePayoutPage(duplicate, tenant, seller, 0));
});
test("pending payout includes display currency but only exact command fields enter the API", async () => {
  const parsed = parsePendingPayout(pending(), tenant, seller);
  assert.deepEqual(parsed, pending());
  for (const patch of [
    { sellerId: tenant },
    { requestId: "bad" },
    { amountOre: 0 },
    { amountOre: 1.5 },
    { amountOre: 100000000000 },
    { action: "approvePayout" },
    { currency: "SEK" },
  ])
    assert.throws(() =>
      parsePendingPayout(
        { ...pending(), command: { ...pending().command, ...patch } },
        tenant,
        seller,
      ),
    );
  let body: unknown;
  const outcome = await sendMobileCommand(
    parsed.command,
    {
      endpoint: "https://portal.example.test/api/mobile/v1/seller",
      user: "seller-user",
      session: async () => ({ user: "seller-user", token: "synthetic-token" }),
      request: async (_url, init) => {
        body = JSON.parse(String(init.body));
        return {
          status: 200,
          text: async () =>
            JSON.stringify({ ok: true, id: parsed.command.requestId }),
        };
      },
    },
    payoutCommandOutcome,
  );
  assert.deepEqual(body, pending().command);
  assert.equal(outcome.kind, "success");
});
test("only exact request success or post-replay threshold/balance conflicts release intent", () => {
  assert.equal(
    payoutCommandOutcome(200, { ok: true, id: id(3) }, id(3)).kind,
    "success",
  );
  for (const error of ["PAYOUT_BELOW_THRESHOLD", "PAYOUT_EXCEEDS_BALANCE"])
    assert.equal(payoutCommandOutcome(409, { error }, id(3)).kind, "conflict");
  for (const error of [
    "AUTH_REQUIRED",
    "MFA_REQUIRED",
    "PASSWORD_UPDATE_REQUIRED",
    "SELLER_CLOSED",
    "REQUEST_CONFLICT",
    "INVALID_INPUT",
    "BANK_DETAILS_CHANGED",
    "FORBIDDEN",
  ])
    assert.equal(payoutCommandOutcome(409, { error }, id(3)).kind, "unknown");
  assert.equal(
    payoutCommandOutcome(200, { ok: true, id: id(9) }, id(3)).kind,
    "unknown",
  );
});
test("payout recovery replays exact amount and ID, does not touch independent bank intent", async () => {
  const values = new Map<string, string>([
    ["bank-key", "existing-bank-intent"],
  ]);
  const sent: unknown[] = [];
  let outcome: CommandOutcome = { kind: "unknown", code: "UNKNOWN" };
  const writer = () =>
    createPendingCommand({
      key: "payout-key",
      binding: "same user/project",
      storage: {
        getItem: async (key) => values.get(key) ?? null,
        setItem: async (key, value) => {
          values.set(key, value);
        },
        removeItem: async (key) => {
          values.delete(key);
        },
      },
      lock: async (_key, work) => work(),
      parse: (value) => parsePendingPayout(value, tenant, seller),
      send: async (value) => {
        sent.push(structuredClone(value));
        return outcome;
      },
    });
  await writer().submit(parsePendingPayout(pending(), tenant, seller));
  const restored = writer();
  await restored.load();
  await restored.submit(
    parsePendingPayout(
      {
        ...pending(),
        command: { ...pending().command, requestId: id(4), amountOre: 20000 },
      },
      tenant,
      seller,
    ),
  );
  assert.equal(sent.length, 1);
  outcome = { kind: "success", id: id(3) };
  await restored.retry();
  assert.deepEqual(sent, [pending(), pending()]);
  assert.equal(values.get("bank-key"), "existing-bank-intent");
  assert.equal(values.has("payout-key"), false);
});
test("both languages cover payout feedback and distinguish requests from bank transfers", () => {
  assert.deepEqual(
    Object.keys(payoutCopy.sv).sort(),
    Object.keys(payoutCopy.en).sort(),
  );
  assert.ok(payoutCopy.sv.notice.includes("ingen banköverföring"));
  assert.ok(payoutCopy.en.notice.includes("does not transfer money"));
});
