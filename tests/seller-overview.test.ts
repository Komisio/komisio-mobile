import assert from "node:assert/strict";
import test from "node:test";
import {
  parseOverview,
  parseEconomyPreview,
  signedOre,
} from "../src/lib/seller-overview.ts";
import { createScopedRead } from "../src/lib/scoped-read.ts";
import { overviewCopy } from "../src/lib/overview-copy.ts";

const seller = "00000000-0000-4000-8000-000000000001";
const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
function economy() {
  return {
    balance: {
      sellerId: seller,
      availableOre: -12345,
      reservedOre: 25000,
      paidOre: 135000,
    },
    limit: 100,
    payouts: Array.from({ length: 9 }, (_, i) => ({
      id: id(i + 10),
      amount_ore: "10000",
      status: "requested",
      requested_at: "2026-10-28T10:00:00+00:00",
    })),
    ledger: [{ amount_ore: 99999999 }],
    messages: [{ body: "Not for the overview" }],
  };
}
function expiring() {
  return {
    currency: "SEK",
    total: 43,
    offset: 0,
    counts: { active: 73, sold: 400, ended: 140 },
    items: Array.from({ length: 25 }, (_, i) => ({
      id: id(i + 100),
      reference: `I-${i}`,
      title: "Synthetic item",
      category: null,
      acceptedAt: "2026-10-01T10:00:00+00:00",
      stage: "period_ending",
      currentPriceOre: 10000,
      acceptedPriceOre: 10000,
      soldPriceOre: null,
      soldAt: null,
      periodEnd: "2026-10-30T23:00:00+00:00",
      collectionDeadline: null,
      endOfPeriodAction: "return",
      endedAs: null,
      endedAt: null,
      nextMarkdownAt: null,
      nextPriceOre: null,
    })),
  };
}

test("overview uses complete counts and signed server balances, never sums a history page", () => {
  const result = parseOverview(economy(), expiring(), seller);
  assert.deepEqual(result.balance, {
    availableOre: -12345,
    reservedOre: 25000,
    paidOre: 135000,
  });
  assert.deepEqual(result.counts, {
    active: 73,
    sold: 400,
    ended: 140,
    expiring: 43,
  });
  assert.equal(result.expiring.length, 5);
  assert.equal(result.payouts.length, 5);
  assert.equal(result.payouts[0].status, "requested");
  assert.equal(result.payouts[0].amountOre, 10000);
  assert.equal("messages" in result, false);
  assert.equal("ledger" in result, false);
});
test("empty accounts are real zero states, absent facts are failures", () => {
  const e = economy(),
    p = expiring();
  e.payouts = [];
  e.balance.availableOre = 0;
  e.balance.paidOre = 0;
  e.balance.reservedOre = 0;
  p.items = [];
  p.total = 0;
  p.counts = { active: 0, sold: 0, ended: 0 };
  const result = parseOverview(e, p, seller);
  assert.equal(result.payouts.length, 0);
  assert.equal(result.counts.expiring, 0);
  assert.throws(() => parseOverview(e, { ...p, counts: undefined }, seller));
  assert.throws(() => parseOverview({ ...e, balance: undefined }, p, seller));
});
test("reject foreign identities, partial/wrong item groups and malformed financial facts", () => {
  assert.throws(() => parseOverview(economy(), expiring(), id(2)));
  assert.throws(() =>
    parseOverview(economy(), { ...expiring(), offset: 25 }, seller),
  );
  assert.throws(() =>
    parseOverview(economy(), { ...expiring(), total: 74 }, seller),
  );
  const wrongStage = expiring();
  wrongStage.items[0].stage = "sold";
  assert.throws(() => parseOverview(economy(), wrongStage, seller));
  for (const amount of [
    1.25,
    NaN,
    Infinity,
    Number.MAX_SAFE_INTEGER + 1,
    "1.25",
    "1e3",
    "",
    null,
  ])
    assert.throws(() => signedOre(amount));
  assert.equal(signedOre("-123"), -123);
  assert.equal(signedOre(0), 0);
});
test("unknown payout status, invalid date, duplicate payout and excess history fail explicitly", () => {
  const e = economy();
  for (const change of [
    { status: "unknown" },
    { requested_at: "invalid" },
    { amount_ore: "-10" },
  ])
    assert.throws(() =>
      parseEconomyPreview(
        { ...e, payouts: [{ ...e.payouts[0], ...change }] },
        seller,
      ),
    );
  assert.throws(() =>
    parseEconomyPreview(
      { ...e, payouts: [e.payouts[0], e.payouts[0]] },
      seller,
    ),
  );
  assert.throws(() =>
    parseEconomyPreview(
      { ...e, payouts: Array(101).fill(e.payouts[0]) },
      seller,
    ),
  );
  assert.match(overviewCopy.en.statuses.approved, /awaiting payment/);
  assert.equal(overviewCopy.sv.requestedAt, "Begärd");
});
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
test("cancelled reads cannot publish money after blur or an account switch", async () => {
  const old = deferred<number>();
  let signal!: AbortSignal;
  const read = createScopedRead((s) => {
    signal = s;
    return old.promise;
  });
  const pending = read.refresh();
  read.cancel();
  old.resolve(90000);
  await pending;
  assert.equal(signal.aborted, true);
  assert.deepEqual(read.getState(), {
    status: "idle",
    data: null,
    failure: null,
  });
});
test("retry ignores stale success and failure from older requests", async () => {
  for (const fails of [false, true]) {
    const old = deferred<number>();
    let calls = 0;
    const read = createScopedRead(async () =>
      ++calls === 1 ? old.promise : 100,
    );
    const first = read.refresh();
    await read.refresh();
    if (fails) old.reject({ code: "42501" });
    else old.resolve(90000);
    await first;
    assert.deepEqual(read.getState(), {
      status: "ready",
      data: 100,
      failure: null,
    });
  }
});
test("denied and failed refreshes clear old balances and allow an explicit retry", async () => {
  let calls = 0;
  const read = createScopedRead(async () => {
    if (++calls === 2) throw { code: "42501" };
    if (calls === 3) throw new Error("Offline");
    return 12345;
  });
  await read.refresh();
  const denied = read.refresh();
  assert.equal(read.getState().data, null);
  await denied;
  assert.equal(read.getState().failure, "denied");
  await read.refresh();
  assert.equal(read.getState().failure, "failed");
  await read.refresh();
  assert.equal(read.getState().data, 12345);
});
