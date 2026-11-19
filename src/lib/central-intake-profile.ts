import { isId } from "./catalogue.ts";
import {
  parseShippingAccount,
  parseShippingAddress,
  type ShippingAccount,
} from "./central-shipping-address.ts";
import {
  parseShippingContact,
  type ShippingContact,
  type ShippingAddress,
} from "./central-shipping.ts";
import type { ExternalOfferDetail } from "./external-offer.ts";
import type { CommandOutcome } from "./pending-command.ts";
import type { CentralPayoutPreference } from "./central-payout-preference.ts";
export type IntakeProfile = {
  payoutPreference?: CentralPayoutPreference | null;
  payoutBank?: { id: string; lastFour: string } | null;
  tenantId: string;
  account: ShippingAccount | null;
  agreement: ExternalOfferDetail["agreement"];
  agreementAccepted: boolean;
};
export type SaveIntakeProfile = {
  action: "save";
  requestId: string;
  tenantId: string;
  agreementVersionId: string;
  expectedRevision: number;
  address: ShippingAddress;
  contact: ShippingContact;
  acceptAgreement: boolean;
};
const invalid = (): never => {
  throw new Error("INVALID_INTAKE_PROFILE");
};
export function parseIntakeProfile(value: unknown): IntakeProfile {
  const v = value as IntakeProfile;
  if (
    !v ||
    !isId(v.tenantId) ||
    typeof v.agreementAccepted !== "boolean" ||
    !v.agreement ||
    !isId(v.agreement.id) ||
    !Number.isSafeInteger(v.agreement.version) ||
    v.agreement.version < 1 ||
    typeof v.agreement.title !== "string" ||
    typeof v.agreement.body !== "string" ||
    typeof v.agreement.language !== "string"
  )
    invalid();
  const pref = v.payoutPreference,
    bank = v.payoutBank;
  if (
    pref != null &&
    (!isId(pref.id) ||
      !(
        (pref.method === "swish" &&
          typeof pref.phone === "string" &&
          /^\+467[023689]\d{7}$/.test(pref.phone) &&
          pref.bankVersionId === null) ||
        (pref.method === "bank" &&
          isId(pref.bankVersionId) &&
          typeof pref.bankLastFour === "string" &&
          pref.bankLastFour.length <= 4 &&
          pref.phone === null)
      ))
  )
    invalid();
  if (
    bank != null &&
    (!isId(bank.id) ||
      typeof bank.lastFour !== "string" ||
      !bank.lastFour.length ||
      bank.lastFour.length > 4)
  )
    invalid();
  const { account } = parseShippingAccount(v);
  if (account && account.tenantId !== v.tenantId) invalid();
  return { ...v, account };
}
export function parseSaveIntakeProfile(
  value: unknown,
  tenant: string,
): SaveIntakeProfile {
  const v = value as SaveIntakeProfile;
  if (
    !v ||
    v.action !== "save" ||
    !isId(v.requestId) ||
    !isId(tenant) ||
    v.tenantId !== tenant ||
    !isId(v.agreementVersionId) ||
    !Number.isSafeInteger(v.expectedRevision) ||
    v.expectedRevision < -1 ||
    v.expectedRevision > 2147483646 ||
    typeof v.acceptAgreement !== "boolean" ||
    Object.keys(v).some(
      (k) =>
        ![
          "action",
          "requestId",
          "tenantId",
          "agreementVersionId",
          "expectedRevision",
          "address",
          "contact",
          "acceptAgreement",
        ].includes(k),
    )
  )
    invalid();
  parseShippingAddress(v.address);
  parseShippingContact(v.contact);
  return v;
}
export function intakeProfileOutcome(
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
      "REQUEST_CONFLICT",
      "PROFILE_CHANGED",
      "BANK_DETAILS_CHANGED",
      "AGREEMENT_CHANGED",
      "AGREEMENT_REQUIRED",
      "STORE_UNAVAILABLE",
    ].includes(String(v?.error))
  )
    return { kind: "conflict", code: String(v?.error) };
  return { kind: "unknown", code: String(v?.error ?? "UNKNOWN") };
}
