import { isId, readFailure, type ReadFailure } from "./catalogue.ts";
import { signedOre } from "./seller-overview.ts";
import { formatItemDate } from "./seller-items.ts";

export const statementLineLimit = 5000;
export function statementReadFailure(
  error: unknown,
): ReadFailure | "too-large" {
  const message = (error as { message?: unknown } | null)?.message;
  return message === "STATEMENT_TOO_LARGE"
    ? "too-large"
    : message === "STATEMENT_NOT_FOUND"
      ? "missing"
      : readFailure(error);
}
export const ledgerKinds = [
  "credit_sale",
  "credit_reversal",
  "payout_reserved",
  "payout_paid",
  "payout_released",
  "booking_charge",
  "consignment_fee",
  "consignment_fee_reversal",
  "adjustment",
] as const;
export const businessFields = [
  "companyName",
  "organisationNumber",
  "vatNumber",
  "contactPerson",
  "billingAddress",
  "invoiceEmail",
  "invoiceReference",
] as const;
export type StatementSummary = {
  id: string;
  number: number;
  kind: "statement" | "credit_note";
  correctsId: string | null;
  from: string;
  to: string;
  issuedAt: string;
  openingOre: number;
  closingOre: number;
  selfBilling: boolean;
};
export type StatementPage = {
  currency: string;
  total: number;
  offset: number;
  statements: StatementSummary[];
};
export type StatementLine = {
  id: string;
  number: number;
  kind: (typeof ledgerKinds)[number];
  amountOre: number;
  at: string;
  salePriceOre: number | null;
  commissionOre: number | null;
};
export type InvoiceLine = {
  referenceId: string;
  saleLineId: string;
  description: string | null;
  at: string;
  kind: "credit_sale" | "credit_reversal";
  netOre: number;
  vatOre: number;
  grossOre: number;
  rateBp: number | null;
  vatNumber: string;
  mode: string;
};
export type Invoice = {
  currency: string;
  language: string | null;
  supplier: string[];
  business: Partial<Record<(typeof businessFields)[number], string>>;
  vatRegistered: boolean | null;
  buyer: string[];
  lines: InvoiceLine[];
  totals: {
    rateBp: number | null;
    netOre: number;
    vatOre: number;
    grossOre: number;
  }[];
};
export type StatementDetail = {
  summary: StatementSummary;
  currency: string;
  language: string | null;
  contact: string[];
  totals: {
    salesGross: number;
    commission: number;
    credited: number;
    reversed: number;
    paid: number;
    adjustments: number;
  };
  lines: StatementLine[];
  invoice: Invoice | null;
};
function invalid(): never {
  throw new Error("INVALID_STATEMENT");
}
function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : invalid();
}
function text(value: unknown): string {
  return typeof value === "string" && value.length <= 10000 ? value : invalid();
}
function optionalText(value: unknown): string {
  return value === undefined || value === null ? "" : text(value);
}
function at(value: unknown): string {
  const s = text(value);
  return /^\d{4}-\d{2}-\d{2}T/.test(s) && Number.isFinite(Date.parse(s))
    ? s
    : invalid();
}
function currency(value: unknown): string {
  return ["SEK", "NOK", "DKK", "EUR", "USD"].includes(String(value))
    ? String(value)
    : invalid();
}
function language(value: unknown): string | null {
  return value === undefined || value === null || value === ""
    ? null
    : ["sv", "en", "no", "dk", "fi", "de", "es", "it"].includes(String(value))
      ? String(value)
      : invalid();
}
function summary(value: unknown): StatementSummary {
  const s = object(value);
  if (
    !isId(s.id) ||
    typeof s.number !== "number" ||
    !Number.isSafeInteger(s.number) ||
    s.number < 1 ||
    !["statement", "credit_note"].includes(String(s.kind)) ||
    (s.corrects_id !== null && !isId(s.corrects_id)) ||
    (s.kind === "credit_note") !== (s.corrects_id !== null) ||
    s.corrects_id === s.id ||
    typeof s.is_self_billing !== "boolean"
  )
    invalid();
  const from = at(s.period_from),
    to = at(s.period_to);
  if (Date.parse(to) <= Date.parse(from)) invalid();
  return {
    id: s.id,
    number: s.number,
    kind: s.kind as StatementSummary["kind"],
    correctsId: s.corrects_id,
    from,
    to,
    issuedAt: at(s.issued_at),
    openingOre: signedOre(s.opening_ore),
    closingOre: signedOre(s.closing_ore),
    selfBilling: s.is_self_billing,
  };
}
export function parseStatementPage(
  value: unknown,
  tenant: string,
  seller: string,
  offset: number,
): StatementPage {
  const p = object(value);
  if (
    !isId(tenant) ||
    !isId(seller) ||
    p.tenantId !== tenant ||
    p.sellerId !== seller ||
    p.limit !== 25 ||
    p.offset !== offset ||
    !Number.isSafeInteger(offset) ||
    offset < 0 ||
    offset > 2500000 ||
    typeof p.total !== "number" ||
    !Number.isSafeInteger(p.total) ||
    p.total < 0 ||
    !Array.isArray(p.statements) ||
    p.statements.length !== Math.min(25, Math.max(0, p.total - offset))
  )
    invalid();
  const statements = p.statements.map(summary);
  if (
    new Set(statements.map((s) => s.id)).size !== statements.length ||
    new Set(statements.map((s) => s.number)).size !== statements.length
  )
    invalid();
  return { currency: currency(p.currency), total: p.total, offset, statements };
}
function boundedLines(value: unknown): unknown[] {
  if (!Array.isArray(value)) invalid();
  if (value.length > statementLineLimit) throw new Error("STATEMENT_TOO_LARGE");
  return value;
}
function contact(value: unknown): string[] {
  const p = object(value);
  return [
    text(p.name),
    ...[
      "email",
      "phone",
      "addressLine1",
      "addressLine2",
      "postalCode",
      "city",
      "country",
    ].map((key) => optionalText(p[key])),
  ].filter(Boolean);
}
/** Group already-recorded minor-unit amounts, matching the portal; never recalculate VAT. */
function invoiceTotals(lines: InvoiceLine[]): Invoice["totals"] {
  const groups = new Map<number | null, Invoice["totals"][number]>();
  for (const line of lines) {
    const total = groups.get(line.rateBp) ?? {
      rateBp: line.rateBp,
      netOre: 0,
      vatOre: 0,
      grossOre: 0,
    };
    for (const key of ["netOre", "vatOre", "grossOre"] as const)
      total[key] = signedOre(total[key] + line[key]);
    groups.set(line.rateBp, total);
  }
  return [...groups.values()];
}
function invoice(value: unknown): Invoice | null {
  if (value === undefined || value === null) return null;
  const p = object(value),
    supplier = object(p.supplier),
    business = object(supplier.business),
    buyer = object(p.buyer),
    address = object(buyer.address),
    details = object(buyer.contact);
  if (
    p.version !== 1 ||
    (business.vatRegistered !== undefined &&
      typeof business.vatRegistered !== "boolean")
  )
    invalid();
  const lines: InvoiceLine[] = boundedLines(p.lines).map((value) => {
    const l = object(value);
    if (
      !isId(l.referenceId) ||
      !isId(l.saleLineId) ||
      !["credit_sale", "credit_reversal"].includes(String(l.kind)) ||
      (l.rateBp !== null &&
        (typeof l.rateBp !== "number" ||
          !Number.isSafeInteger(l.rateBp) ||
          l.rateBp < 0))
    )
      invalid();
    return {
      referenceId: l.referenceId,
      saleLineId: l.saleLineId,
      description: l.description === null ? null : text(l.description),
      at: at(l.occurredAt),
      kind: l.kind as InvoiceLine["kind"],
      netOre: signedOre(l.netOre),
      vatOre: signedOre(l.vatOre),
      grossOre: signedOre(l.grossOre),
      rateBp: l.rateBp as number | null,
      vatNumber: text(l.vatNumber),
      mode: text(l.mode),
    };
  });
  if (new Set(lines.map((l) => l.referenceId)).size !== lines.length) invalid();
  return {
    currency: currency(p.currency),
    language: language(p.language),
    supplier: contact(supplier),
    business: Object.fromEntries(
      businessFields
        .map((key) => [key, optionalText(business[key])])
        .filter(([, value]) => value),
    ),
    vatRegistered:
      typeof business.vatRegistered === "boolean"
        ? business.vatRegistered
        : null,
    buyer: [
      text(buyer.name),
      ...["street", "postalCode", "city", "country"].map((key) =>
        optionalText(address[key]),
      ),
      optionalText(details.email),
      optionalText(details.phone),
    ].filter(Boolean),
    lines,
    totals: invoiceTotals(lines),
  };
}
export function parseStatementDetail(
  value: unknown,
  id: string,
  storeCurrency: string,
): StatementDetail {
  const p = object(value),
    h = object(p.header);
  if (!isId(id) || h.id !== id) invalid();
  const frozenInvoice = invoice(h.self_billing);
  const s = summary({ ...h, is_self_billing: frozenInvoice !== null });
  const lines: StatementLine[] = boundedLines(p.lines).map((value, i) => {
    const l = object(value);
    if (
      !isId(l.id) ||
      l.statement_id !== id ||
      l.line_no !== i + 1 ||
      !ledgerKinds.includes(l.kind as (typeof ledgerKinds)[number])
    )
      invalid();
    return {
      id: l.id,
      number: i + 1,
      kind: l.kind as StatementLine["kind"],
      amountOre: signedOre(l.amount_ore),
      at: at(l.occurred_at),
      salePriceOre:
        l.sale_price_ore === null ? null : signedOre(l.sale_price_ore),
      commissionOre:
        l.commission_ore === null ? null : signedOre(l.commission_ore),
    };
  });
  if (new Set(lines.map((l) => l.id)).size !== lines.length) invalid();
  return {
    summary: s,
    currency: currency(storeCurrency),
    contact: h.seller_contact ? contact(h.seller_contact) : [],
    language: h.seller_contact
      ? language(object(h.seller_contact).language)
      : null,
    totals: {
      salesGross: signedOre(h.sales_gross_ore),
      commission: signedOre(h.commission_ore),
      credited: signedOre(h.credited_ore),
      reversed: signedOre(h.reversed_ore),
      paid: signedOre(h.paid_ore),
      adjustments: signedOre(h.adjustments_ore),
    },
    lines,
    invoice: frozenInvoice,
  };
}
/** Match the platform document's inclusive calendar display of an exclusive end. */
export function statementPeriod(
  s: Pick<StatementSummary, "from" | "to">,
  locale: string,
) {
  return `${formatItemDate(s.from, locale)} – ${formatItemDate(new Date(Date.parse(s.to) - 1).toISOString(), locale)}`;
}
export function statementLinesPage<T>(rows: T[], page: number): T[] {
  if (
    !Number.isSafeInteger(page) ||
    page < 0 ||
    page > Math.max(0, Math.ceil(rows.length / 25) - 1)
  )
    invalid();
  return rows.slice(page * 25, (page + 1) * 25);
}
export function statementTitleKey(
  s: Pick<StatementSummary, "kind" | "selfBilling">,
) {
  return s.selfBilling
    ? s.kind === "credit_note"
      ? "selfBillingCredit"
      : "selfBilling"
    : s.kind === "credit_note"
      ? "creditNote"
      : "statement";
}
