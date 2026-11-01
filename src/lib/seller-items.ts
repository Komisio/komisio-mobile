import { formattingLocale } from "./locale.ts";
import { isId, type ReadPage } from "./catalogue.ts";

export const itemFilters = [
  "active",
  "expiring",
  "sold",
  "ended",
  "all",
] as const;
export type ItemFilter = (typeof itemFilters)[number];
const stages = [
  "on_sale",
  "markdown_due",
  "period_ending",
  "period_ended",
  "ended",
  "sold",
] as const;
export type SellerItem = {
  id: string;
  reference: string;
  title: string | null;
  category: string | null;
  acceptedAt: string;
  stage: (typeof stages)[number];
  currentPriceOre: number | null;
  acceptedPriceOre: number | null;
  soldPriceOre: number | null;
  soldAt: string | null;
  periodEnd: string;
  collectionDeadline: string | null;
  endOfPeriodAction: "charity" | "return" | null;
  endedAs: string | null;
  endedAt: string | null;
  nextMarkdownAt: string | null;
  nextPriceOre: number | null;
};
export type SellerItemDetail = {
  currency: string;
  automaticMarkdowns: boolean;
  item: SellerItem;
};

function invalid(): never {
  throw new Error("INVALID_SELLER_ITEMS_RESPONSE");
}
function object(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : invalid();
}
function text(value: unknown): string {
  return typeof value === "string" ? value : invalid();
}
function nullableText(value: unknown): string | null {
  return value === null ? null : text(value);
}
function integer(value: unknown): number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value
    : invalid();
}
function ore(value: unknown): number | null {
  if (value === null) return null;
  return integer(
    typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value,
  );
}
function date(value: unknown): string {
  const result = text(value);
  return /^\d{4}-\d{2}-\d{2}(T|$)/.test(result) &&
    Number.isFinite(Date.parse(result))
    ? result
    : invalid();
}
function optionalDate(value: unknown): string | null {
  return value === null ? null : date(value);
}
function currency(value: unknown): string {
  return typeof value === "string" && /^[A-Z]{3}$/.test(value)
    ? value
    : invalid();
}
function parseItem(value: unknown): SellerItem {
  const i = object(value);
  if (!isId(i.id) || !stages.includes(i.stage as SellerItem["stage"]))
    invalid();
  if (
    i.endOfPeriodAction !== null &&
    i.endOfPeriodAction !== "charity" &&
    i.endOfPeriodAction !== "return"
  )
    invalid();
  return {
    id: i.id,
    reference: text(i.reference),
    title: nullableText(i.title),
    category: nullableText(i.category),
    stage: i.stage as SellerItem["stage"],
    acceptedAt: date(i.acceptedAt),
    currentPriceOre: ore(i.currentPriceOre),
    acceptedPriceOre: ore(i.acceptedPriceOre),
    soldPriceOre: ore(i.soldPriceOre),
    soldAt: optionalDate(i.soldAt),
    periodEnd: date(i.periodEnd),
    collectionDeadline: optionalDate(i.collectionDeadline),
    endOfPeriodAction: i.endOfPeriodAction,
    endedAs: nullableText(i.endedAs),
    endedAt: optionalDate(i.endedAt),
    nextMarkdownAt: optionalDate(i.nextMarkdownAt),
    nextPriceOre: ore(i.nextPriceOre),
  };
}
export function parseSellerItemsPage(value: unknown): ReadPage<SellerItem> {
  const p = object(value);
  if (!Array.isArray(p.items) || p.items.length > 25) invalid();
  return {
    currency: currency(p.currency),
    total: integer(p.total),
    offset: integer(p.offset),
    items: p.items.map(parseItem),
  };
}
export function parseSellerItemDetail(
  value: unknown,
  expectedId: string,
): SellerItemDetail {
  const p = object(value),
    item = parseItem(p.item);
  if (item.id !== expectedId || typeof p.automaticMarkdowns !== "boolean")
    invalid();
  return {
    currency: currency(p.currency),
    automaticMarkdowns: p.automaticMarkdowns,
    item,
  };
}
// Display only facts from the engine; a scheduled price is never a seller payout.
export function sellerItemPrice(item: SellerItem) {
  return item.stage === "sold" ? item.soldPriceOre : item.currentPriceOre;
}
export function sellerItemStatus(item: SellerItem) {
  if (item.stage === "on_sale" || item.stage === "markdown_due")
    return "forSale";
  return item.stage;
}
export function sellerItemDate(item: SellerItem) {
  if (item.stage === "sold")
    return { label: "soldAt" as const, value: item.soldAt };
  if (item.stage === "ended")
    return { label: "endedAt" as const, value: item.endedAt };
  return {
    label:
      item.stage === "period_ended"
        ? ("expiredAt" as const)
        : ("periodEnd" as const),
    value: item.periodEnd,
  };
}
export function plannedMarkdown(item: SellerItem) {
  return ["on_sale", "markdown_due", "period_ending"].includes(item.stage) &&
    item.nextMarkdownAt !== null &&
    item.nextPriceOre !== null
    ? { at: item.nextMarkdownAt, priceOre: item.nextPriceOre }
    : null;
}
export function collectionDate(item: SellerItem) {
  if (
    item.stage === "sold" ||
    item.endOfPeriodAction !== "return" ||
    (item.stage === "ended" && item.endedAs !== "return")
  )
    return null;
  return item.collectionDeadline;
}
export function formatItemDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(formattingLocale(locale), {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Europe/Stockholm",
  }).format(new Date(value));
}
