import { isId } from "./catalogue.ts";
import { parseSellerItemsPage, type SellerItem } from "./seller-items.ts";

export const payoutStatuses = [
  "requested",
  "approved",
  "paid",
  "rejected",
] as const;
export type PayoutSummary = {
  id: string;
  amountOre: number;
  status: (typeof payoutStatuses)[number];
  requestedAt: string;
};
export function payoutBadgeTone(status: PayoutSummary["status"]) {
  return status === "paid"
    ? ("positive" as const)
    : status === "requested" || status === "rejected"
      ? ("warning" as const)
      : ("neutral" as const);
}
export type SellerOverview = {
  currency: string;
  counts: { active: number; sold: number; ended: number; expiring: number };
  expiring: SellerItem[];
  recentSales: RecentSale[] | null;
};
export type RecentSale = {
  id: string;
  reference: string;
  title: string | null;
  soldAt: string;
  soldPriceOre: number;
};
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("INVALID_OVERVIEW");
  return value as Record<string, unknown>;
}
export function signedOre(value: unknown): number {
  const number =
    typeof value === "string" && /^-?\d+$/.test(value) ? Number(value) : value;
  if (typeof number !== "number" || !Number.isSafeInteger(number))
    throw new Error("INVALID_OVERVIEW");
  return number;
}
function count(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0)
    throw new Error("INVALID_OVERVIEW");
  return value;
}
export function parseEconomyPreview(value: unknown, seller: string) {
  const e = object(value),
    balance = object(e.balance);
  if (
    !isId(seller) ||
    balance.sellerId !== seller ||
    e.limit !== 100 ||
    !Array.isArray(e.payouts) ||
    e.payouts.length > 100
  )
    throw new Error("INVALID_OVERVIEW");
  const payouts: PayoutSummary[] = e.payouts.map((value) => {
    const p = object(value);
    const amountOre = signedOre(p.amount_ore);
    if (
      !isId(p.id) ||
      !payoutStatuses.includes(p.status as PayoutSummary["status"]) ||
      amountOre <= 0 ||
      typeof p.requested_at !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T/.test(p.requested_at) ||
      !Number.isFinite(Date.parse(p.requested_at))
    )
      throw new Error("INVALID_OVERVIEW");
    return {
      id: p.id,
      amountOre,
      status: p.status as PayoutSummary["status"],
      requestedAt: p.requested_at,
    };
  });
  if (new Set(payouts.map((p) => p.id)).size !== payouts.length)
    throw new Error("INVALID_OVERVIEW");
  return {
    balance: {
      availableOre: signedOre(balance.availableOre),
      reservedOre: signedOre(balance.reservedOre),
      paidOre: signedOre(balance.paidOre),
    },
    payouts,
  };
}
export function parseRecentSales(
  value: unknown,
  seller: string,
  currency: string,
): RecentSale[] {
  const page = object(value);
  if (
    !isId(seller) ||
    page.sellerId !== seller ||
    page.currency !== currency ||
    page.limit !== 5 ||
    !Array.isArray(page.items) ||
    page.items.length > 5
  )
    throw new Error("INVALID_OVERVIEW");
  const sales: RecentSale[] = page.items.map((value) => {
    const sale = object(value);
    const price = signedOre(sale.soldPriceOre);
    if (
      !isId(sale.id) ||
      typeof sale.reference !== "string" ||
      !sale.reference.trim() ||
      (sale.title !== null && typeof sale.title !== "string") ||
      typeof sale.soldAt !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T/.test(sale.soldAt) ||
      !Number.isFinite(Date.parse(sale.soldAt)) ||
      price <= 0
    )
      throw new Error("INVALID_OVERVIEW");
    return {
      id: sale.id,
      reference: sale.reference,
      title: sale.title,
      soldAt: sale.soldAt,
      soldPriceOre: price,
    };
  });
  if (
    new Set(sales.map((sale) => sale.id)).size !== sales.length ||
    sales.some(
      (sale, index) =>
        index > 0 &&
        Date.parse(sale.soldAt) > Date.parse(sales[index - 1].soldAt),
    )
  )
    throw new Error("INVALID_OVERVIEW");
  return sales;
}

/** Totals are server facts; null sales means unavailable, never an empty history. */
export function parseOverview(
  expiringPage: unknown,
  salesPage: unknown | null,
  seller: string,
): SellerOverview {
  const page = parseSellerItemsPage(expiringPage);
  const counts = object(object(expiringPage).counts);
  const active = count(counts.active),
    sold = count(counts.sold),
    ended = count(counts.ended);
  if (
    page.offset !== 0 ||
    page.total > active ||
    page.items.length > page.total ||
    page.items.some((item) => item.stage !== "period_ending")
  )
    throw new Error("INVALID_OVERVIEW");
  return {
    currency: page.currency,
    counts: { active, sold, ended, expiring: page.total },
    expiring: page.items.slice(0, 5),
    recentSales:
      salesPage === null
        ? null
        : parseRecentSales(salesPage, seller, page.currency),
  };
}
