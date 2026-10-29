import { isId } from "./catalogue.ts";
import {
  agreementLanguages,
  type AgreementArchive,
} from "./seller-agreement.ts";
import type { CommandOutcome } from "./pending-command.ts";

export type AgreementCommand = {
  action: "acceptAgreement";
  tenantId: string;
  sellerId: string;
  requestId: string;
  agreementId: string;
  translationId: string | null;
};
export type PendingAgreement = {
  document: {
    version: number;
    title: string;
    language: keyof typeof agreementLanguages;
  };
  command: AgreementCommand;
};
function invalid(): never {
  throw new Error("INVALID_AGREEMENT_COMMAND");
}
function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : invalid();
}
export function parsePendingAgreement(
  value: unknown,
  tenant: string,
  seller: string,
): PendingAgreement {
  const p = object(value),
    c = object(p.command),
    d = object(p.document);
  if (
    Object.keys(p).some((key) => !["document", "command"].includes(key)) ||
    Object.keys(c).some(
      (key) =>
        ![
          "action",
          "tenantId",
          "sellerId",
          "requestId",
          "agreementId",
          "translationId",
        ].includes(key),
    ) ||
    Object.keys(d).some(
      (key) => !["version", "title", "language"].includes(key),
    ) ||
    c.action !== "acceptAgreement" ||
    !isId(tenant) ||
    !isId(seller) ||
    c.tenantId !== tenant ||
    c.sellerId !== seller ||
    !isId(c.requestId) ||
    !isId(c.agreementId) ||
    (c.translationId !== null && !isId(c.translationId)) ||
    c.translationId === c.agreementId ||
    typeof d.version !== "number" ||
    !Number.isSafeInteger(d.version) ||
    d.version < 1 ||
    typeof d.title !== "string" ||
    Array.from(d.title).length > 120 ||
    typeof d.language !== "string" ||
    !Object.hasOwn(agreementLanguages, d.language)
  )
    invalid();
  return {
    document: {
      version: d.version,
      title: d.title,
      language: d.language as keyof typeof agreementLanguages,
    },
    command: {
      action: "acceptAgreement",
      tenantId: tenant,
      sellerId: seller,
      requestId: c.requestId,
      agreementId: c.agreementId,
      translationId: c.translationId,
    },
  };
}
export function agreementIntent(
  archive: AgreementArchive,
  tenant: string,
  seller: string,
  requestId: string,
): PendingAgreement {
  const a = archive.agreement;
  if (!archive.current || !a || archive.acceptance) invalid();
  return parsePendingAgreement(
    {
      document: { version: a.version, title: a.title, language: a.language },
      command: {
        action: "acceptAgreement",
        tenantId: tenant,
        sellerId: seller,
        requestId,
        agreementId: a.id,
        translationId: a.translationId,
      },
    },
    tenant,
    seller,
  );
}
export function agreementCommandOutcome(
  status: number,
  body: unknown,
): CommandOutcome {
  const value = body as { ok?: unknown; id?: unknown; error?: unknown } | null;
  // The engine may return earlier equivalent evidence for the same identity,
  // agreement and translation. Success need not echo this request UUID.
  if (status === 200 && value?.ok === true && isId(value.id))
    return { kind: "success", id: value.id };
  // The exact request-ID replay check precedes the current-version check.
  if (status === 409 && value?.error === "AGREEMENT_CHANGED")
    return { kind: "conflict", code: "AGREEMENT_CHANGED" };
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
