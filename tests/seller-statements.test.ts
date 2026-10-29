import assert from "node:assert/strict";
import test from "node:test";
import {
  parseStatementDetail,
  parseStatementPage,
  statementLinesPage,
  statementPeriod,
  statementReadFailure,
  statementTitleKey,
} from "../src/lib/seller-statements.ts";
import { createScopedRead } from "../src/lib/scoped-read.ts";
import { statementCopy } from "../src/lib/statement-copy.ts";
const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const tenant = id(1),
  seller = id(2),
  statement = id(3);
const summary = () => ({
  id: statement,
  number: 101,
  kind: "credit_note",
  corrects_id: id(4),
  period_from: "2026-10-24T22:00:00Z",
  period_to: "2026-10-25T23:00:00Z",
  issued_at: "2026-10-28T10:00:00Z",
  opening_ore: -1000,
  closing_ore: 4321,
  is_self_billing: true,
});
const invoice = () => ({
  version: 1,
  currency: "SEK",
  language: "de",
  supplier: {
    name: "Original supplier",
    email: "synthetic@example.test",
    phone: "",
    addressLine1: "Frozen street",
    business: {
      companyName: "Frozen company",
      vatNumber: "Synthetic VAT",
      vatRegistered: true,
    },
  },
  buyer: {
    name: "Original buyer",
    address: { street: "Original street" },
    contact: {},
  },
  lines: [
    {
      referenceId: id(6),
      saleLineId: id(7),
      description: "Original goods description",
      occurredAt: "2026-10-25T12:00:00Z",
      kind: "credit_reversal",
      netOre: -8000,
      vatOre: -2000,
      grossOre: -10000,
      rateBp: 2500,
      vatNumber: "Original VAT",
      mode: "consignment_business",
    },
  ],
});
function detail(lines = 1) {
  return {
    header: {
      ...summary(),
      seller_contact: { name: "Frozen contact", language: "de" },
      self_billing: invoice(),
      sales_gross_ore: 10000,
      commission_ore: 2000,
      credited_ore: 8000,
      reversed_ore: 700,
      paid_ore: 3000,
      adjustments_ore: -111,
    },
    lines: Array.from({ length: lines }, (_, i) => ({
      id: id(100 + i),
      statement_id: statement,
      line_no: i + 1,
      kind: "adjustment",
      amount_ore: -111,
      occurred_at: "2026-10-25T12:00:00Z",
      sale_price_ore: null,
      commission_ore: null,
    })),
  };
}
test("issued list retains exact numbers, negative balances, correction links and self-billing labels", () => {
  const p = parseStatementPage(
    {
      tenantId: tenant,
      sellerId: seller,
      currency: "SEK",
      total: 101,
      offset: 100,
      limit: 25,
      statements: [summary()],
    },
    tenant,
    seller,
    100,
  );
  assert.equal(p.total, 101);
  assert.equal(p.statements[0].openingOre, -1000);
  assert.equal(p.statements[0].correctsId, id(4));
  assert.equal(statementTitleKey(p.statements[0]), "selfBillingCredit");
  assert.equal(
    statementTitleKey({ kind: "credit_note", selfBilling: false }),
    "creditNote",
  );
  assert.equal(
    statementTitleKey({ kind: "statement", selfBilling: true }),
    "selfBilling",
  );
});
test("detail preserves recorded totals and original identities/language without current-profile substitution", () => {
  const source = detail(),
    parsed = parseStatementDetail(source, statement, "SEK");
  assert.equal(parsed.totals.adjustments, -111);
  assert.equal(parsed.summary.closingOre, 4321); // Not recomputed from the displayed lines.
  assert.equal(parsed.contact[0], "Frozen contact");
  assert.equal(parsed.language, "de");
  assert.equal(parsed.invoice?.supplier[0], "Original supplier");
  assert.equal(parsed.invoice?.business.companyName, "Frozen company");
  assert.equal(parsed.invoice?.language, "de");
  assert.equal(parsed.invoice?.lines[0].grossOre, -10000);
  assert.equal(parsed.invoice?.lines[0].vatOre, -2000);
  assert.equal(parsed.invoice?.lines[0].rateBp, 2500);
  assert.equal(parsed.lines[0].amountOre, -111);
  assert.equal(parsed.lines[0].salePriceOre, null);
  assert.deepEqual(source, detail());
});
test("missing legacy contact and absent self-billing remain absent, not reconstructed", () => {
  const source = detail();
  const parsed = parseStatementDetail(
    {
      ...source,
      header: { ...source.header, self_billing: null, seller_contact: null },
    },
    statement,
    "SEK",
  );
  assert.deepEqual(parsed.contact, []);
  assert.equal(parsed.invoice, null);
  assert.equal(parsed.language, null);
  assert.equal(parsed.summary.selfBilling, false);
});
test("exact document identity and complete, ordered lines fail closed on mismatch", () => {
  assert.throws(() => parseStatementDetail(detail(), id(9), "SEK"));
  for (const patch of [
    { statement_id: id(9) },
    { line_no: 2 },
    { amount_ore: 1.5 },
    { kind: "unknown" },
  ]) {
    const source = detail();
    assert.throws(() =>
      parseStatementDetail(
        { ...source, lines: [{ ...source.lines[0], ...patch }] },
        statement,
        "SEK",
      ),
    );
  }
  for (const patch of [
    { closing_ore: NaN },
    { kind: "statement" },
    { corrects_id: statement },
    { period_to: "2000-01-01T00:00:00Z" },
  ]) {
    const source = detail();
    assert.throws(() =>
      parseStatementDetail(
        { ...source, header: { ...source.header, ...patch } },
        statement,
        "SEK",
      ),
    );
  }
});
test("partial and foreign list pages cannot masquerade as complete seller history", () => {
  const base = {
    tenantId: tenant,
    sellerId: seller,
    currency: "SEK",
    offset: 0,
    limit: 25,
    total: 1,
    statements: [summary()],
  };
  for (const patch of [
    { tenantId: seller },
    { sellerId: tenant },
    { statements: [] },
    { total: 0 },
    { offset: 25 },
    { currency: "XXX" },
  ])
    assert.throws(() =>
      parseStatementPage({ ...base, ...patch }, tenant, seller, 0),
    );
  assert.equal(
    parseStatementPage({ ...base, total: 0, statements: [] }, tenant, seller, 0)
      .total,
    0,
  );
});
test("exclusive period end is displayed inclusively in Stockholm even over daylight-saving change", () => {
  assert.equal(
    statementPeriod(
      { from: summary().period_from, to: summary().period_to },
      "en",
    ),
    "25 Oct 2026 – 25 Oct 2026",
  );
});
test("immutable line paging reaches the last line without trimming the document; oversized reads reject", () => {
  const parsed = parseStatementDetail(detail(26), statement, "SEK");
  assert.equal(statementLinesPage(parsed.lines, 0).length, 25);
  assert.equal(statementLinesPage(parsed.lines, 1)[0].number, 26);
  assert.throws(() => statementLinesPage(parsed.lines, 2));
  assert.throws(
    () => parseStatementDetail(detail(5001), statement, "SEK"),
    /STATEMENT_TOO_LARGE/,
  );
  const source = detail();
  source.header.self_billing.lines = Array(5001).fill(invoice().lines[0]);
  assert.throws(
    () => parseStatementDetail(source, statement, "SEK"),
    /STATEMENT_TOO_LARGE/,
  );
});
test("statement failures remain distinct and the scoped reader clears prior financial data", async () => {
  assert.equal(statementReadFailure({ code: "42501" }), "denied");
  assert.equal(
    statementReadFailure(new Error("STATEMENT_NOT_FOUND")),
    "missing",
  );
  let failure = false;
  const read = createScopedRead(async () => {
    if (failure) throw new Error("STATEMENT_TOO_LARGE");
    return detail();
  }, statementReadFailure);
  await read.refresh();
  assert.ok(read.getState().data);
  failure = true;
  await read.refresh();
  assert.equal(read.getState().failure, "too-large");
  assert.equal(read.getState().data, null);
});
test("all statement labels and ledger kinds have both app languages", () => {
  assert.deepEqual(
    Object.keys(statementCopy.sv).sort(),
    Object.keys(statementCopy.en).sort(),
  );
  assert.deepEqual(
    Object.keys(statementCopy.sv.kinds).sort(),
    Object.keys(statementCopy.en.kinds).sort(),
  );
});

test("invoice groups sum the stored integer facts without recalculating tax or filling null rates", () => {
  const source = detail();
  source.header.self_billing.lines.push({
    ...invoice().lines[0],
    referenceId: id(20),
    netOre: 100,
    vatOre: 7,
    grossOre: 107,
  });
  const parsed = parseStatementDetail(source, statement, "SEK");
  assert.deepEqual(parsed.invoice?.totals, [
    { rateBp: 2500, netOre: -7900, vatOre: -1993, grossOre: -9893 },
  ]);
  const noRate = parseStatementDetail(
    {
      ...source,
      header: {
        ...source.header,
        self_billing: {
          ...invoice(),
          lines: [{ ...invoice().lines[0], rateBp: null }],
        },
      },
    },
    statement,
    "SEK",
  );
  assert.equal(noRate.invoice?.totals[0].rateBp, null);
  source.header.self_billing.lines[0].netOre = Number.MAX_SAFE_INTEGER;
  source.header.self_billing.lines[1].netOre = 1;
  assert.throws(() => parseStatementDetail(source, statement, "SEK"));
});
