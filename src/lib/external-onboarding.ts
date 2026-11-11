import { isId } from "./catalogue.ts";
import { parseBankDetails, type BankDetails } from "./bank-account.ts";
import type { CommandOutcome } from "./pending-command.ts";
export type ExternalOnboarding = {
  offerId: string;
  tenantId: string;
  phone: string;
  account: { id: string; name: string; email: string; hasBank: boolean } | null;
  store: {
    address: {
      street: string;
      postalCode: string;
      city: string;
      country?: string;
    } | null;
    openingHours: { day: string; opens: string; closes: string }[];
  };
  handover: {
    id: string;
    reference: string;
    status: "open" | "received" | "cancelled";
    receivedAt: string | null;
    itemCount: number;
    items: {
      requestId: string;
      offerId: string;
      description: string;
      brand: string;
      photoId: string;
    }[];
  } | null;
  qrPng: string | null;
};
export type CompleteExternalOffer = {
  action: "complete";
  requestId: string;
  offerId: string;
  agreementVersionId: string;
  profile: { name: string; email: string } | null;
  bank: BankDetails | null;
};
function invalid(): never {
  throw new Error("INVALID_ONBOARDING");
}
function object(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : invalid();
}
function string(v: unknown, max: number, required = false): v is string {
  return (
    typeof v === "string" &&
    v.length <= max &&
    (!required || v.trim().length > 0)
  );
}
export function parseExternalOnboarding(
  value: unknown,
  offer: string,
): ExternalOnboarding {
  const v = object(value),
    s = object(v.store);
  if (
    v.offerId !== offer ||
    !isId(offer) ||
    !isId(v.tenantId) ||
    !string(v.phone, 40, true)
  )
    invalid();
  if (v.account !== null) {
    const a = object(v.account);
    if (
      !isId(a.id) ||
      !string(a.name, 120, true) ||
      !string(a.email, 254) ||
      typeof a.hasBank !== "boolean"
    )
      invalid();
  }
  if (s.address !== null) {
    const a = object(s.address);
    if (
      !string(a.street, 120) ||
      !string(a.postalCode, 20) ||
      !string(a.city, 120)
    )
      invalid();
  }
  if (!Array.isArray(s.openingHours) || s.openingHours.length > 7) invalid();
  for (const row of s.openingHours) {
    const h = object(row);
    if (
      !["mon", "tue", "wed", "thu", "fri", "sat", "sun"].includes(
        String(h.day),
      ) ||
      !/^\d{2}:\d{2}$/.test(String(h.opens)) ||
      !/^\d{2}:\d{2}$/.test(String(h.closes))
    )
      invalid();
  }
  if (v.handover !== null) {
    const h = object(v.handover);
    if (
      !isId(h.id) ||
      !/^H-[1-9]\d{0,11}$/.test(String(h.reference)) ||
      !["open", "received", "cancelled"].includes(String(h.status)) ||
      !Array.isArray(h.items) ||
      h.items.length < 1 ||
      h.items.length > 10 ||
      h.itemCount !== h.items.length ||
      (h.receivedAt !== null &&
        (!string(h.receivedAt, 40) ||
          !Number.isFinite(Date.parse(h.receivedAt))))
    )
      invalid();
    for (const item of h.items) {
      const i = object(item);
      if (
        ![i.requestId, i.offerId, i.photoId].every(isId) ||
        !string(i.description, 500, true) ||
        !string(i.brand, 120)
      )
        invalid();
    }
    if (!h.items.some((i) => object(i).offerId === offer) || v.account === null)
      invalid();
    if (
      h.status === "open"
        ? !string(v.qrPng, 131072, true) ||
          !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(v.qrPng)
        : v.qrPng !== null
    )
      invalid();
  } else if (v.qrPng !== null) invalid();
  return v as unknown as ExternalOnboarding;
}
export function parseCompleteExternalOffer(
  value: unknown,
  offer: string,
): CompleteExternalOffer {
  const v = object(value);
  if (
    Object.keys(v).some(
      (k) =>
        ![
          "action",
          "requestId",
          "offerId",
          "agreementVersionId",
          "profile",
          "bank",
        ].includes(k),
    ) ||
    v.action !== "complete" ||
    !isId(v.requestId) ||
    !isId(offer) ||
    v.offerId !== offer ||
    !isId(v.agreementVersionId)
  )
    invalid();
  if (v.profile !== null) {
    const p = object(v.profile);
    if (
      Object.keys(p).length !== 2 ||
      !string(p.name, 120, true) ||
      !string(p.email, 254, true) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)
    )
      invalid();
  }
  if (v.bank !== null) {
    const b = parseBankDetails(v.bank);
    if (b.country !== "SE" || b.kind !== "local" || !b.routing.trim())
      invalid();
  }
  return v as unknown as CompleteExternalOffer;
}
export function externalOnboardingOutcome(
  status: number,
  body: unknown,
  id: string,
): CommandOutcome {
  const value = body as { id?: unknown; error?: unknown } | null;
  if (status === 200 && value?.id === id) return { kind: "success", id };
  if (
    status === 409 &&
    [
      "REQUEST_CHANGED",
      "OFFER_EXPIRED",
      "AGREEMENT_CHANGED",
      "ACCOUNT_REQUIRED",
    ].includes(String(value?.error))
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
