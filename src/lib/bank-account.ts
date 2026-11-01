import { isId } from "./catalogue.ts";
import { bankCountries } from "./bank-countries.ts";

export type BankDetails = {
  holder: string;
  country: string;
  kind: "iban" | "local";
  account: string;
  routing: string;
};
export type BankVersion = {
  id: string;
  details: BankDetails;
  createdAt: string;
};
export type LocalBankFields = Pick<
  BankDetails,
  "holder" | "routing" | "account"
>;

export function storeBankCountry(value: unknown, slug: string): string | null {
  if (value === null) return null;
  const row = object(value);
  if (row.slug !== slug) invalid();
  const address = object(object(row.profile).address);
  if (address.country === undefined || address.country === "") return null;
  if (
    typeof address.country !== "string" ||
    !bankCountries.includes(address.country as (typeof bankCountries)[number])
  )
    invalid();
  return address.country;
}

export function localBankFields(
  current: BankVersion | null,
  country: string,
): LocalBankFields {
  const compatible =
    current?.details.kind === "local" && current.details.country === country;
  return {
    holder: current?.details.holder ?? "",
    routing: compatible ? current.details.routing : "",
    account: compatible ? current.details.account : "",
  };
}

export function localBankDetails(
  fields: LocalBankFields,
  country: string,
): BankDetails {
  return normalizeBankDetails({ ...fields, country, kind: "local" });
}
export type BankCommand = {
  action: "saveBank";
  tenantId: string;
  sellerId: string;
  requestId: string;
  expected: string | null;
  details: BankDetails;
};
function invalid(): never {
  throw new Error("INVALID_BANK");
}
function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : invalid();
}
function string(value: unknown, max: number, required = false): string {
  return typeof value === "string" &&
    value.trim().length <= max &&
    (!required || value.trim().length > 0)
    ? value
    : invalid();
}
export function parseBankDetails(value: unknown): BankDetails {
  const d = object(value);
  if (
    Object.keys(d).some(
      (key) =>
        !["holder", "country", "kind", "account", "routing"].includes(key),
    )
  )
    invalid();
  const holder = string(d.holder, 160, true),
    account = string(d.account, 100, true),
    routing = string(d.routing, 100);
  if (
    typeof d.country !== "string" ||
    !bankCountries.includes(d.country as (typeof bankCountries)[number]) ||
    (d.kind !== "iban" && d.kind !== "local")
  )
    invalid();
  if (d.kind === "iban") {
    const iban = account.trim();
    if (
      !/^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/.test(iban) ||
      !iban.startsWith(d.country)
    )
      invalid();
    const digits = (iban.slice(4) + iban.slice(0, 4)).replace(/[A-Z]/g, (c) =>
      String(c.charCodeAt(0) - 55),
    );
    if (BigInt(digits) % 97n !== 1n) invalid();
  }
  return { holder, country: d.country, kind: d.kind, account, routing };
}
export function normalizeBankDetails(d: BankDetails): BankDetails {
  return parseBankDetails({
    ...d,
    holder: d.holder.trim(),
    account:
      d.kind === "iban"
        ? d.account.replace(/\s/g, "").toUpperCase()
        : d.account.trim(),
    routing: d.kind === "iban" ? "" : d.routing.trim(),
  });
}
export function parseBankVersion(value: unknown): BankVersion | null {
  if (value === null) return null;
  const row = object(value);
  if (
    !isId(row.id) ||
    typeof row.createdAt !== "string" ||
    !Number.isFinite(Date.parse(row.createdAt))
  )
    invalid();
  return {
    id: row.id,
    details: parseBankDetails(row.details),
    createdAt: row.createdAt,
  };
}
export function parseBankCommand(
  value: unknown,
  tenant: string,
  seller: string,
): BankCommand {
  const c = object(value);
  if (
    Object.keys(c).some(
      (key) =>
        ![
          "action",
          "tenantId",
          "sellerId",
          "requestId",
          "expected",
          "details",
        ].includes(key),
    ) ||
    c.action !== "saveBank" ||
    !isId(tenant) ||
    !isId(seller) ||
    c.tenantId !== tenant ||
    c.sellerId !== seller ||
    !isId(c.requestId) ||
    (c.expected !== null && !isId(c.expected))
  )
    invalid();
  return {
    action: "saveBank",
    tenantId: tenant,
    sellerId: seller,
    requestId: c.requestId,
    expected: c.expected,
    details: parseBankDetails(c.details),
  };
}
