import { isId } from "./catalogue.ts";
import type { CommandOutcome } from "./pending-command.ts";

export type ExternalOffer = {
  id: string;
  requestId: string;
  tenantId: string;
  sellerAmountOre: string;
  expectedSalePriceOre: string;
  currency: "SEK";
  agreementVersionId: string;
  createdAt: string;
  expiresAt: string;
  serverNow: string;
  status: "offered" | "accepted" | "declined" | "expired" | "superseded";
  canAccept: boolean;
  canDecline: boolean;
  response: { id: string; accepted: boolean; createdAt: string } | null;
  handover?: {
    id: string;
    reference: string;
    status: "open" | "received" | "cancelled";
    receivedAt: string | null;
    itemCount: number;
  } | null;
};
export type ExternalOfferDetail = ExternalOffer & {
  agreement: {
    id: string;
    version: number;
    title: string;
    body: string;
    language: string;
  };
};
export type OfferResponse = {
  action: "respond";
  requestId: string;
  offerId: string;
  accepted: boolean;
  agreementVersionId: string | null;
};
function invalid(): never {
  throw new Error("OFFER_UNAVAILABLE");
}
function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : invalid();
}
function date(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= 40 &&
    Number.isFinite(Date.parse(value))
  );
}
export function parseExternalOffer(value: unknown): ExternalOffer {
  const o = object(value);
  if (
    ![o.id, o.requestId, o.tenantId, o.agreementVersionId].every(isId) ||
    ![o.sellerAmountOre, o.expectedSalePriceOre].every(
      (v) => typeof v === "string" && /^[1-9]\d{0,10}$/.test(v),
    ) ||
    o.currency !== "SEK" ||
    ![o.createdAt, o.expiresAt, o.serverNow].every(date) ||
    !["offered", "accepted", "declined", "expired", "superseded"].includes(
      String(o.status),
    ) ||
    o.canAccept !== (o.status === "offered") ||
    o.canDecline !== (o.status === "offered" || o.status === "expired")
  )
    invalid();
  if (
    Date.parse(o.expiresAt as string) - Date.parse(o.createdAt as string) !==
    48 * 3600000
  )
    invalid();
  if (o.response !== null) {
    const r = object(o.response);
    if (
      !isId(r.id) ||
      typeof r.accepted !== "boolean" ||
      !date(r.createdAt) ||
      (r.accepted ? o.status !== "accepted" : o.status !== "declined")
    )
      invalid();
  } else if (o.status === "accepted") invalid();
  if (o.handover != null) {
    const h = object(o.handover);
    if (
      o.status !== "accepted" ||
      !isId(h.id) ||
      typeof h.reference !== "string" ||
      !/^H-[1-9]\d{0,11}$/.test(h.reference) ||
      !["open", "received", "cancelled"].includes(String(h.status)) ||
      !Number.isInteger(h.itemCount) ||
      (h.itemCount as number) < 1 ||
      (h.itemCount as number) > 10 ||
      (h.status === "received" ? !date(h.receivedAt) : h.receivedAt !== null)
    )
      invalid();
  }
  return o as unknown as ExternalOffer;
}
export function parseExternalOfferDetail(value: unknown): ExternalOfferDetail {
  const o = parseExternalOffer(value),
    a = object(object(value).agreement);
  if (
    a.id !== o.agreementVersionId ||
    !Number.isSafeInteger(a.version) ||
    (a.version as number) < 1 ||
    typeof a.title !== "string" ||
    !a.title.length ||
    a.title.length > 120 ||
    typeof a.body !== "string" ||
    !a.body.length ||
    a.body.length > 12000 ||
    typeof a.language !== "string" ||
    a.language.length < 2 ||
    a.language.length > 10
  )
    invalid();
  return { ...o, agreement: a as ExternalOfferDetail["agreement"] };
}
export function parseOfferResponse(
  value: unknown,
  offerId: string,
): OfferResponse {
  const c = object(value);
  if (
    Object.keys(c).some(
      (k) =>
        ![
          "action",
          "requestId",
          "offerId",
          "accepted",
          "agreementVersionId",
        ].includes(k),
    ) ||
    c.action !== "respond" ||
    !isId(c.requestId) ||
    !isId(offerId) ||
    c.offerId !== offerId ||
    typeof c.accepted !== "boolean" ||
    (c.accepted ? !isId(c.agreementVersionId) : c.agreementVersionId !== null)
  )
    invalid();
  return c as unknown as OfferResponse;
}
export function offerResponseOutcome(
  status: number,
  body: unknown,
  id: string,
): CommandOutcome {
  const value = body as { id?: unknown; error?: unknown } | null;
  if (status === 200 && value?.id === id) return { kind: "success", id };
  // These checks run after exact replay in the engine, so they disprove a commit.
  if (
    status === 409 &&
    ["REQUEST_CHANGED", "OFFER_EXPIRED", "AGREEMENT_CHANGED"].includes(
      String(value?.error),
    )
  )
    return { kind: "conflict", code: String(value!.error) };
  return {
    kind: "unknown",
    code: [
      "AUTH_REQUIRED",
      "MFA_REQUIRED",
      "PASSWORD_UPDATE_REQUIRED",
    ].includes(String(value?.error))
      ? String(value!.error)
      : "UNKNOWN",
  };
}
export function offerAmount(ore: string, locale: string) {
  if (!/^[1-9]\d{0,10}$/.test(ore)) invalid();
  const minor = BigInt(ore),
    fraction = minor % 100n;
  const whole = new Intl.NumberFormat(locale).format(minor / 100n);
  const decimal =
    new Intl.NumberFormat(locale)
      .formatToParts(1.1)
      .find((p) => p.type === "decimal")?.value ?? ",";
  return `${whole}${fraction ? decimal + String(fraction).padStart(2, "0") : ""} ${locale.startsWith("sv") ? "kr" : "SEK"}`;
}
/** Server time plus elapsed monotonic time; a wrong device clock cannot extend an offer. */
export function offerIsExpired(offer: ExternalOffer, elapsedMs: number) {
  return (
    Date.parse(offer.serverNow) + Math.max(0, elapsedMs) >=
    Date.parse(offer.expiresAt)
  );
}
