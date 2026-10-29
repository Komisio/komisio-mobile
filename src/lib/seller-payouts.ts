import { isId } from "./catalogue.ts";
import {
  payoutStatuses,
  signedOre,
  type PayoutSummary,
} from "./seller-overview.ts";
import type { CommandOutcome } from "./pending-command.ts";

const currencies = ["SEK", "NOK", "DKK", "EUR", "USD"] as const;
export type PayoutCommand = {
  action: "requestPayout";
  tenantId: string;
  sellerId: string;
  requestId: string;
  amountOre: number;
};
export type PendingPayout = { currency: string; command: PayoutCommand };
export type PayoutPage = {
  currency: string;
  total: number;
  offset: number;
  balance: { availableOre: number; reservedOre: number; paidOre: number };
  thresholdOre: number;
  payouts: PayoutSummary[];
};
function invalid(): never {
  throw new Error("INVALID_PAYOUT");
}
function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : invalid();
}
function currency(value: unknown): string {
  return typeof value === "string" &&
    currencies.includes(value as (typeof currencies)[number])
    ? value
    : invalid();
}
export function payoutOffset(page: number) {
  return Number.isSafeInteger(page) && page >= 0 && page <= 100000
    ? page * 25
    : invalid();
}
export function parsePayoutPage(
  value: unknown,
  tenant: string,
  seller: string,
  offset: number,
): PayoutPage {
  const p = object(value),
    balance = object(p.balance);
  if (
    !isId(tenant) ||
    !isId(seller) ||
    p.tenantId !== tenant ||
    p.sellerId !== seller ||
    balance.sellerId !== seller ||
    p.limit !== 25 ||
    p.offset !== offset ||
    !Number.isSafeInteger(offset) ||
    offset < 0 ||
    offset > 2500000 ||
    typeof p.total !== "number" ||
    !Number.isSafeInteger(p.total) ||
    p.total < 0 ||
    !Array.isArray(p.payouts) ||
    p.payouts.length !== Math.min(25, Math.max(0, p.total - offset))
  )
    invalid();
  const rows: PayoutSummary[] = p.payouts.map((value) => {
    const row = object(value),
      amountOre = signedOre(row.amount_ore);
    if (
      !isId(row.id) ||
      !payoutStatuses.includes(row.status as PayoutSummary["status"]) ||
      !["staff", "seller"].includes(String(row.request_source)) ||
      amountOre <= 0 ||
      amountOre > 99999999999 ||
      typeof row.requested_at !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T/.test(row.requested_at) ||
      !Number.isFinite(Date.parse(row.requested_at))
    )
      invalid();
    return {
      id: row.id,
      amountOre,
      status: row.status as PayoutSummary["status"],
      requestedAt: row.requested_at,
    };
  });
  if (new Set(rows.map((row) => row.id)).size !== rows.length) invalid();
  const thresholdOre = signedOre(p.thresholdOre);
  if (thresholdOre < 0) invalid();
  return {
    currency: currency(p.currency),
    total: p.total,
    offset,
    thresholdOre,
    balance: {
      availableOre: signedOre(balance.availableOre),
      reservedOre: signedOre(balance.reservedOre),
      paidOre: signedOre(balance.paidOre),
    },
    payouts: rows,
  };
}

/** Convert at most two decimal digits to integer minor units; never round. */
export function payoutAmount(value: string): number {
  const text = value.trim();
  if (!/^\d{1,9}(?:[.,]\d{1,2})?$/.test(text)) invalid();
  const [whole, fraction = ""] = text.replace(",", ".").split(".");
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (amount <= 0 || amount > 99999999999) invalid();
  return amount;
}
export function payoutAmountInput(ore: number): string {
  if (!Number.isSafeInteger(ore) || ore <= 0 || ore > 99999999999) invalid();
  return `${Math.floor(ore / 100)}.${String(ore % 100).padStart(2, "0")}`;
}
export function payoutLimitError(
  amount: number,
  available: number,
  threshold: number,
): "below" | "above" | null {
  return amount < threshold ? "below" : amount > available ? "above" : null;
}
export function parsePendingPayout(
  value: unknown,
  tenant: string,
  seller: string,
): PendingPayout {
  const p = object(value),
    c = object(p.command);
  if (
    Object.keys(p).some((key) => !["currency", "command"].includes(key)) ||
    Object.keys(c).some(
      (key) =>
        !["action", "tenantId", "sellerId", "requestId", "amountOre"].includes(
          key,
        ),
    ) ||
    c.action !== "requestPayout" ||
    !isId(tenant) ||
    !isId(seller) ||
    c.tenantId !== tenant ||
    c.sellerId !== seller ||
    !isId(c.requestId) ||
    typeof c.amountOre !== "number" ||
    !Number.isSafeInteger(c.amountOre) ||
    c.amountOre <= 0 ||
    c.amountOre > 99999999999
  )
    invalid();
  return {
    currency: currency(p.currency),
    command: {
      action: "requestPayout",
      tenantId: tenant,
      sellerId: seller,
      requestId: c.requestId,
      amountOre: c.amountOre,
    },
  };
}
export function payoutCommandOutcome(
  status: number,
  body: unknown,
  requestId: string,
): CommandOutcome {
  const p = body as { ok?: unknown; id?: unknown; error?: unknown } | null;
  if (status === 200 && p?.ok === true && p.id === requestId)
    return { kind: "success", id: requestId };
  // Both engine checks follow request replay: these prove this ID was not created.
  if (
    status === 409 &&
    ["PAYOUT_BELOW_THRESHOLD", "PAYOUT_EXCEEDS_BALANCE"].includes(
      String(p?.error),
    )
  )
    return { kind: "conflict", code: String(p!.error) };
  return {
    kind: "unknown",
    code: [
      "AUTH_REQUIRED",
      "MFA_REQUIRED",
      "PASSWORD_UPDATE_REQUIRED",
    ].includes(String(p?.error))
      ? String(p!.error)
      : "UNKNOWN",
  };
}
