import { test } from "node:test";
import assert from "node:assert/strict";
import { createCataloguePager, type ReadPage } from "../src/lib/catalogue.ts";
import {
  collectionDate,
  formatItemDate,
  parseSellerItemDetail,
  parseSellerItemsPage,
  plannedMarkdown,
  sellerItemDate,
  sellerItemPrice,
  sellerItemStatus,
  type SellerItem,
} from "../src/lib/seller-items.ts";
import { sellerItemsCopy } from "../src/lib/seller-items-copy.ts";

const itemId = "00000000-0000-4000-8000-000000000007";
const row: SellerItem = {
  id: itemId,
  reference: "I-00000000",
  title: "Synthetic coat",
  category: "Coats",
  acceptedAt: "2026-10-01T12:00:00+00:00",
  stage: "on_sale",
  currentPriceOre: 12550,
  acceptedPriceOre: 15000,
  soldPriceOre: null,
  soldAt: null,
  periodEnd: "2026-11-12T23:00:00+00:00",
  collectionDeadline: "2026-11-19T23:00:00+00:00",
  endOfPeriodAction: "return",
  endedAs: null,
  endedAt: null,
  nextMarkdownAt: "2026-10-29T12:00:00+00:00",
  nextPriceOre: 11000,
};
const page = (
  items = [row],
  offset = 0,
  total = items.length,
): ReadPage<SellerItem> => ({ currency: "SEK", items, total, offset });
const detail = (item: unknown = row) => ({
  currency: "SEK",
  automaticMarkdowns: false,
  item,
});
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

test("own-item contracts accept integer ore strings and discard fields outside the projection", () => {
  const result = parseSellerItemsPage(
    page([
      {
        ...row,
        currentPriceOre: "12550",
        staffNote: "private",
      } as unknown as SellerItem,
    ]),
  );
  assert.equal(result.items[0].currentPriceOre, 12550);
  assert.equal("staffNote" in result.items[0], false);
  assert.deepEqual(parseSellerItemDetail(detail(), itemId).item, row);
});
test("malformed contracts and an unrelated detail id fail closed", () => {
  for (const bad of [
    NaN,
    Infinity,
    -1,
    12.5,
    Number.MAX_SAFE_INTEGER + 1,
    "999999999999999999999",
    "1e4",
    "",
    "-1",
  ]) {
    assert.throws(() =>
      parseSellerItemDetail(detail({ ...row, currentPriceOre: bad }), itemId),
    );
  }
  for (const change of [
    { stage: "ready_to_collect" },
    { acceptedAt: "not a date" },
    { periodEnd: null },
    { endOfPeriodAction: "guess" },
    { id: "bad" },
  ]) {
    assert.throws(() =>
      parseSellerItemDetail(detail({ ...row, ...change }), itemId),
    );
  }
  assert.throws(() =>
    parseSellerItemsPage(page(Array.from({ length: 26 }, () => row))),
  );
  assert.throws(() =>
    parseSellerItemsPage({ ...page(), currency: "invalid", total: -1 }),
  );
  assert.throws(() =>
    parseSellerItemDetail(detail(), "00000000-0000-4000-8000-000000000008"),
  );
  assert.throws(() =>
    parseSellerItemDetail({ ...detail(), automaticMarkdowns: "false" }, itemId),
  );
});
test("sold amounts and dates are recorded facts, including zero and unknown amounts", () => {
  const sold = {
    ...row,
    stage: "sold" as const,
    soldAt: "2026-10-20T10:00:00Z",
    soldPriceOre: 0,
  };
  assert.equal(sellerItemPrice(sold), 0);
  assert.equal(sellerItemPrice({ ...sold, soldPriceOre: null }), null);
  assert.deepEqual(sellerItemDate(sold), {
    label: "soldAt",
    value: sold.soldAt,
  });
  assert.equal(plannedMarkdown(sold), null);
  assert.equal(collectionDate(sold), null);
  assert.equal(sellerItemStatus({ ...row, stage: "markdown_due" }), "forSale");
  assert.equal(
    sellerItemStatus({ ...row, stage: "period_ending" }),
    "period_ending",
  );
});
test("period and collection information never invents a ready-to-collect date", () => {
  const ended = {
    ...row,
    stage: "ended" as const,
    endedAt: "2026-10-25T09:00:00Z",
    endedAs: "return",
  };
  assert.deepEqual(sellerItemDate(ended), {
    label: "endedAt",
    value: ended.endedAt,
  });
  assert.equal(plannedMarkdown(ended), null);
  assert.equal(collectionDate(ended), row.collectionDeadline);
  assert.equal(collectionDate({ ...ended, endedAs: "charity" }), null);
  assert.equal(collectionDate({ ...row, endOfPeriodAction: "charity" }), null);
  assert.deepEqual(sellerItemDate({ ...row, stage: "period_ended" }), {
    label: "expiredAt",
    value: row.periodEnd,
  });
  assert.equal(plannedMarkdown({ ...row, nextPriceOre: null }), null);
  assert.deepEqual(plannedMarkdown(row), {
    at: row.nextMarkdownAt,
    priceOre: 11000,
  });
  assert.match(formatItemDate("2026-10-28T23:30:00Z", "en"), /^29 Oct 2026$/);
});
test("filtered paging keeps the query, all loaded rows and matching metadata on revalidation", async () => {
  const rows = Array.from({ length: 27 }, (_, n) => ({
    ...row,
    id: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
  }));
  const calls: [string, number][] = [];
  const pager = createCataloguePager<SellerItem>(async (query, offset) => {
    calls.push([query, offset]);
    return page(rows.slice(offset, offset + 25), offset, 27);
  }, " coat ");
  await pager.revalidate();
  await pager.more();
  await pager.revalidate();
  assert.deepEqual(calls, [
    ["coat", 0],
    ["coat", 25],
    ["coat", 0],
    ["coat", 25],
  ]);
  assert.equal(pager.getState().items.length, 27);
  assert.equal(pager.getState().items[26].periodEnd, row.periodEnd);
  assert.equal(pager.getState().status, "ready");
});
test("changing filter or account discards a delayed previous scope", async () => {
  const delayed = deferred<ReadPage<SellerItem>>();
  const old = createCataloguePager<SellerItem>(async () => delayed.promise);
  const loading = old.revalidate();
  old.cancel();
  const next = createCataloguePager<SellerItem>(async () =>
    page([{ ...row, stage: "sold" }]),
  );
  await next.revalidate();
  delayed.resolve(page());
  await loading;
  assert.equal(old.getState().items.length, 0);
  assert.equal(next.getState().items[0].stage, "sold");
});
test("a denied own-item refresh clears cached rows whereas a network failure can be retried", async () => {
  let failure: unknown = null;
  const pager = createCataloguePager<SellerItem>(async () => {
    if (failure) throw failure;
    return page();
  });
  await pager.revalidate();
  failure = new Error("offline");
  await pager.revalidate();
  assert.equal(pager.getState().items.length, 1);
  failure = null;
  await pager.revalidate();
  assert.equal(pager.getState().failure, null);
  failure = { code: "42501" };
  await pager.revalidate();
  assert.equal(pager.getState().items.length, 0);
  assert.equal(pager.getState().failure, "denied");
});
test("both languages cover the same item states and controls", () => {
  assert.deepEqual(
    Object.keys(sellerItemsCopy.sv),
    Object.keys(sellerItemsCopy.en),
  );
  assert.deepEqual(
    Object.keys(sellerItemsCopy.sv.filters),
    Object.keys(sellerItemsCopy.en.filters),
  );
  assert.deepEqual(
    Object.keys(sellerItemsCopy.sv.statuses),
    Object.keys(sellerItemsCopy.en.statuses),
  );
});
