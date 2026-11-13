import { isId } from "./catalogue.ts";
import type { ShippingAddress } from "./central-shipping.ts";
import type { CommandOutcome } from "./pending-command.ts";

export type ShippingAccount = {
  tenantId: string;
  sellerId: string;
  revision: number;
  address: ShippingAddress | null;
};
export type SaveShippingAddress = {
  action: "save";
  requestId: string;
  tenantId: string;
  sellerId: string;
  expectedRevision: number;
  address: ShippingAddress;
};
function invalid(): never {
  throw new Error("INVALID_SHIPPING_ADDRESS");
}
function object(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : invalid();
}
export function parseShippingAddress(value: unknown): ShippingAddress {
  const v = object(value);
  if (
    Object.keys(v).some((k) => !["street", "postalCode", "city"].includes(k)) ||
    typeof v.street !== "string" ||
    !v.street.trim() ||
    v.street.length > 50 ||
    typeof v.city !== "string" ||
    !v.city.trim() ||
    v.city.length > 35 ||
    typeof v.postalCode !== "string" ||
    !/^[1-9][0-9]{4}$/.test(v.postalCode)
  )
    invalid();
  return v as ShippingAddress;
}
export function parseShippingAccount(value: unknown): {
  account: ShippingAccount | null;
} {
  const v = object(value);
  if (v.account === null) return { account: null };
  const a = object(v.account);
  if (
    !isId(a.tenantId) ||
    !isId(a.sellerId) ||
    !Number.isSafeInteger(a.revision) ||
    (a.revision as number) < 0
  )
    invalid();
  if (a.address !== null) parseShippingAddress(a.address);
  return { account: a as ShippingAccount };
}
export function parseSaveShippingAddress(
  value: unknown,
  tenant: string,
  seller: string,
): SaveShippingAddress {
  const v = object(value);
  if (
    v.action !== "save" ||
    !isId(v.requestId) ||
    !isId(tenant) ||
    !isId(seller) ||
    v.tenantId !== tenant ||
    v.sellerId !== seller ||
    !Number.isSafeInteger(v.expectedRevision) ||
    (v.expectedRevision as number) < 0 ||
    (v.expectedRevision as number) > 2147483646 ||
    Object.keys(v).some(
      (k) =>
        ![
          "action",
          "requestId",
          "tenantId",
          "sellerId",
          "expectedRevision",
          "address",
        ].includes(k),
    )
  )
    invalid();
  parseShippingAddress(v.address);
  return v as SaveShippingAddress;
}
export function shippingAddressOutcome(
  status: number,
  body: unknown,
  requestId: string,
): CommandOutcome {
  const v = body as { id?: unknown; error?: unknown } | null;
  if (status === 200 && v?.id === requestId)
    return { kind: "success", id: requestId };
  if (
    status === 409 &&
    ["PROFILE_CHANGED", "REQUEST_CONFLICT"].includes(String(v?.error))
  )
    return { kind: "conflict", code: String(v?.error) };
  return { kind: "unknown", code: String(v?.error ?? "UNKNOWN") };
}
