import { isId } from "./catalogue.ts";
import { phoneEntryValue } from "./phone-entry.ts";

export type PayoutDestination =
  | { method: "swish"; phone: string }
  | { method: "bank"; bankVersionId: string };
export type CentralPayoutPreference = {
  id: string;
  method: "swish" | "bank";
  phone: string | null;
  bankVersionId: string | null;
  bankLastFour: string | null;
};
export type SavePayoutPreference = {
  action: "savePayoutPreference";
  tenantId: string;
  sellerId: string;
  requestId: string;
  expected: string | null;
  destination: PayoutDestination;
};

export function swishNumber(input: string) {
  const number = phoneEntryValue({ callingCode: "+46", number: input });
  if (!/^\+467[023689]\d{7}$/.test(number)) throw new Error("PHONE_INVALID");
  return number;
}
export function parsePreferenceCommand(
  raw: unknown,
  tenant: string,
  seller: string,
): SavePayoutPreference {
  const c = raw as SavePayoutPreference;
  if (
    !c ||
    c.action !== "savePayoutPreference" ||
    !isId(c.tenantId) ||
    c.tenantId !== tenant ||
    !isId(c.sellerId) ||
    c.sellerId !== seller ||
    !isId(c.requestId) ||
    (c.expected !== null && !isId(c.expected)) ||
    !c.destination
  )
    throw new Error("INVALID_PREFERENCE");
  const d = c.destination;
  if (
    d.method === "swish" &&
    typeof d.phone === "string" &&
    swishNumber(d.phone) === d.phone
  )
    return { ...c, destination: { method: "swish", phone: d.phone } };
  if (d.method === "bank" && isId(d.bankVersionId))
    return {
      ...c,
      destination: { method: "bank", bankVersionId: d.bankVersionId },
    };
  throw new Error("INVALID_PREFERENCE");
}
