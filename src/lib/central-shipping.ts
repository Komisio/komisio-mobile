import { isId } from "./catalogue.ts";
import type { CommandOutcome } from "./pending-command.ts";

export type ShippingAddress = {
  street: string;
  postalCode: string;
  city: string;
};
type Contact = ShippingAddress & {
  name: string;
  phone: string;
  email: string;
  country: "SE";
};
export type BookParcel = {
  action: "book";
  requestId: string;
  offerId: string;
  offerIds?: string[];
  address: ShippingAddress;
  weightG?: number;
  lengthMm?: number;
  widthMm?: number;
  heightMm?: number;
};
export type ParcelItem = {
  offerId: string;
  description: string;
  handoverId: string;
  reference: string;
  status: "open" | "received" | "cancelled";
};
export type ShippingState = {
  offerId: string;
  available: boolean;
  measurementsOptional: boolean;
  bundlingAvailable: boolean;
  eligibleItems: ParcelItem[];
  parcel: null | {
    id: string;
    reference: string;
    environment: "sandbox" | "production";
    sender: Contact;
    recipient: Contact;
    weightG: number | null;
    lengthMm: number | null;
    widthMm: number | null;
    heightMm: number | null;
    status: "pending" | "needs_review" | "booked";
    createdAt: string;
    items: ParcelItem[];
    booking: null | {
      bookingId: string;
      returnId: string;
      trackingId: string;
      qrPng: string;
    };
  };
};
function invalid(): never {
  throw new Error("INVALID_SHIPPING");
}
function object(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : invalid();
}
function text(v: unknown, max: number): v is string {
  return typeof v === "string" && v.trim().length > 0 && v.length <= max;
}
function address(v: unknown, full = false) {
  const a = object(v);
  if (
    !text(a.street, 50) ||
    !text(a.city, 35) ||
    typeof a.postalCode !== "string" ||
    !/^[1-9][0-9]{4}$/.test(a.postalCode)
  )
    invalid();
  if (
    full &&
    (!text(a.name, 60) ||
      !text(a.email, 70) ||
      !text(a.phone, 16) ||
      !/^\+[1-9][0-9]{7,14}$/.test(a.phone) ||
      a.country !== "SE")
  )
    invalid();
  if (
    !full &&
    Object.keys(a).some((k) => !["street", "postalCode", "city"].includes(k))
  )
    invalid();
}
function measurements(v: Record<string, unknown>, nullable = false) {
  const { weightG: w, lengthMm: l, widthMm: b, heightMm: h } = v;
  if (
    nullable
      ? [w, l, b, h].every((x) => x === null)
      : [w, l, b, h].every((x) => x === undefined)
  )
    return;
  if (
    ![w, l, b, h].every(
      (x) => typeof x === "number" && Number.isSafeInteger(x) && x > 0,
    )
  )
    invalid();
  if (
    (w as number) > 20000 ||
    (l as number) > 1500 ||
    (l as number) < (b as number) ||
    (b as number) < (h as number) ||
    (l as number) + 2 * ((b as number) + (h as number)) > 3000
  )
    invalid();
}
export function parseBookParcel(value: unknown, offer: string): BookParcel {
  const v = object(value);
  if (
    v.action !== "book" ||
    !isId(v.requestId) ||
    !isId(offer) ||
    v.offerId !== offer ||
    Object.keys(v).some(
      (k) =>
        ![
          "action",
          "requestId",
          "offerId",
          "offerIds",
          "address",
          "weightG",
          "lengthMm",
          "widthMm",
          "heightMm",
        ].includes(k),
    )
  )
    invalid();
  address(v.address);
  measurements(v);
  if (
    v.offerIds !== undefined &&
    (!Array.isArray(v.offerIds) ||
      v.offerIds.length < 1 ||
      v.offerIds.length > 10 ||
      !v.offerIds.every(isId) ||
      !v.offerIds.includes(offer) ||
      new Set(v.offerIds).size !== v.offerIds.length ||
      v.weightG !== undefined)
  )
    invalid();
  return v as unknown as BookParcel;
}
function parcelItems(value: unknown): ParcelItem[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 10) invalid();
  for (const entry of value) {
    const i = object(entry);
    if (
      !isId(i.offerId) ||
      !isId(i.handoverId) ||
      !text(i.description, 160) ||
      typeof i.reference !== "string" ||
      !/^H-[1-9][0-9]{0,11}$/.test(i.reference) ||
      !["open", "received", "cancelled"].includes(String(i.status))
    )
      invalid();
  }
  if (new Set(value.map((i) => i.offerId)).size !== value.length) invalid();
  return value as ParcelItem[];
}
export function parseShippingState(
  value: unknown,
  offer: string,
): ShippingState {
  const v = object(value);
  if (!isId(offer) || v.offerId !== offer || typeof v.available !== "boolean")
    invalid();
  if (
    v.measurementsOptional !== undefined &&
    typeof v.measurementsOptional !== "boolean"
  )
    invalid();
  if (
    v.bundlingAvailable !== undefined &&
    typeof v.bundlingAvailable !== "boolean"
  )
    invalid();
  const eligibleItems = parcelItems(v.eligibleItems);
  if (eligibleItems.some((i) => i.status !== "open")) invalid();
  if (v.parcel !== null) {
    const p = object(v.parcel);
    if (
      !isId(p.id) ||
      !text(p.reference, 14) ||
      !/^P-[1-9][0-9]{0,11}$/.test(p.reference) ||
      !["sandbox", "production"].includes(String(p.environment)) ||
      !["pending", "needs_review", "booked"].includes(String(p.status)) ||
      !text(p.createdAt, 40) ||
      !Number.isFinite(Date.parse(p.createdAt))
    )
      invalid();
    address(p.sender, true);
    address(p.recipient, true);
    measurements(p, true);
    const items = parcelItems(p.items);
    if (p.items !== undefined && !items.some((i) => i.offerId === offer))
      invalid();
    if (p.status === "booked") {
      const b = object(p.booking);
      if (
        !text(b.bookingId, 200) ||
        !text(b.returnId, 128) ||
        !text(b.trackingId, 35) ||
        !/^[A-Za-z0-9]{1,35}$/.test(b.trackingId) ||
        !text(b.qrPng, 98304) ||
        !/^data:image\/png;base64,iVBORw0KGgo[A-Za-z0-9+/=]*$/.test(b.qrPng)
      )
        invalid();
    } else if (p.booking !== null) invalid();
  }
  return {
    ...v,
    measurementsOptional: v.measurementsOptional === true,
    bundlingAvailable: v.bundlingAvailable === true,
    eligibleItems,
    parcel:
      v.parcel === null
        ? null
        : { ...object(v.parcel), items: parcelItems(object(v.parcel).items) },
  } as unknown as ShippingState;
}
/** A carrier-owned URL, never a URL supplied by an API reply. */
export function parcelTrackingUrl(
  parcel: NonNullable<ShippingState["parcel"]>,
) {
  if (!parcel.booking || !/^[A-Za-z0-9]{1,35}$/.test(parcel.booking.trackingId))
    invalid();
  const host =
    parcel.environment === "sandbox"
      ? "attracking.postnord.com"
      : "tracking.postnord.com";
  return `https://${host}/se/?id=${encodeURIComponent(parcel.booking.trackingId)}`;
}
export function shippingOutcome(
  status: number,
  body: unknown,
  requestId: string,
): CommandOutcome {
  const v = body as { id?: unknown; error?: unknown } | null;
  if (status === 200 && v?.id === requestId)
    return { kind: "success", id: requestId };
  if (
    status === 409 &&
    [
      "PARCEL_EXISTS",
      "HANDOVER_CLOSED",
      "REQUEST_CONFLICT",
      "PARCEL_GROUP_UNSUPPORTED",
      "SHIPPING_CONTACT_UNSUPPORTED",
    ].includes(String(v?.error))
  )
    return { kind: "conflict", code: String(v?.error) };
  return { kind: "unknown", code: String(v?.error ?? "UNKNOWN") };
}
/** Convert typed kg/cm exactly to grams/mm; no guessed parcel defaults. */
export function shippingMeasure(value: string, decimals: 1 | 3): number {
  const match = new RegExp(
    `^([0-9]{1,4})(?:[.,]([0-9]{1,${decimals}}))?$`,
  ).exec(value.trim());
  if (!match) invalid();
  return (
    Number(match[1]) * 10 ** decimals +
    Number((match[2] ?? "").padEnd(decimals, "0"))
  );
}
