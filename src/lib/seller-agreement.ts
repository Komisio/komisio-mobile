import { formattingLocale } from "./locale.ts";
import { isId } from "./catalogue.ts";

export const agreementLanguages = {
  sv: "Svenska",
  en: "English",
  no: "Norsk",
  dk: "Dansk",
  fi: "Suomi",
  de: "Deutsch",
  es: "Español",
  it: "Italiano",
} as const;
type Language = keyof typeof agreementLanguages;
type Source = "staff_recorded" | "seller_portal";
export type AgreementSelection = {
  version: string | null;
  text: string | null;
  page: number;
};
export type AgreementArchive = {
  agreement: {
    id: string;
    version: number;
    title: string;
    body: string;
    language: Language;
    translationId: string | null;
  } | null;
  acceptance: {
    id: string;
    at: string;
    source: Source;
    language: Language | null;
    translationId: string | null;
  } | null;
  current: boolean;
  total: number;
  languages: { id: string; language: Language }[];
  history: {
    id: string;
    version: number;
    title: string;
    at: string;
    source: Source;
  }[];
};
function invalid(): never {
  throw new Error("INVALID_AGREEMENT");
}
function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : invalid();
}
function text(value: unknown, max: number): string {
  return typeof value === "string" && Array.from(value).length <= max
    ? value
    : invalid();
}
function id(value: unknown): string {
  return isId(value) ? value : invalid();
}
function integer(value: unknown, minimum = 0): number {
  return typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= minimum
    ? value
    : invalid();
}
function language(value: unknown): Language {
  return typeof value === "string" && Object.hasOwn(agreementLanguages, value)
    ? (value as Language)
    : invalid();
}
function source(value: unknown): Source {
  return value === "staff_recorded" || value === "seller_portal"
    ? value
    : invalid();
}
function date(value: unknown): string {
  const result = text(value, 50);
  return /^\d{4}-\d{2}-\d{2}T/.test(result) &&
    Number.isFinite(Date.parse(result))
    ? result
    : invalid();
}
export function agreementOffset(selection: AgreementSelection): number {
  if (
    (selection.version !== null && !isId(selection.version)) ||
    (selection.text !== null && !isId(selection.text)) ||
    !Number.isInteger(selection.page) ||
    selection.page < 0 ||
    selection.page > 100000
  )
    invalid();
  return selection.page * 20;
}
export function parseAgreementArchive(
  value: unknown,
  selection: AgreementSelection,
): AgreementArchive {
  agreementOffset(selection);
  const p = object(value);
  if (
    typeof p.current !== "boolean" ||
    !Array.isArray(p.languages) ||
    p.languages.length > 8 ||
    !Array.isArray(p.history) ||
    p.history.length > 20
  )
    invalid();
  const a = p.agreement === null ? null : object(p.agreement);
  const e = p.acceptance === null ? null : object(p.acceptance);
  const agreement = a
    ? {
        id: id(a.id),
        version: integer(a.version, 1),
        title: text(a.title, 120),
        body: text(a.body, 12000),
        language: language(a.language),
        translationId: a.translationId == null ? null : id(a.translationId),
      }
    : null;
  const acceptance = e
    ? {
        id: id(e.id),
        at: date(e.at),
        source: source(e.source),
        language: e.language === undefined ? null : language(e.language),
        translationId: e.translationId == null ? null : id(e.translationId),
      }
    : null;
  const languages = p.languages.map((value) => {
    const row = object(value);
    return { id: id(row.id), language: language(row.language) };
  });
  const history = p.history.map((value) => {
    const row = object(value);
    return {
      id: id(row.id),
      version: integer(row.version, 1),
      title: text(row.title, 120),
      at: date(row.at),
      source: source(row.source),
    };
  });
  const total = integer(p.total);
  if (
    new Set(languages.map((row) => row.id)).size !== languages.length ||
    new Set(history.map((row) => row.id)).size !== history.length ||
    history.length > total
  )
    invalid();
  if (!agreement && (acceptance || languages.length || p.current)) invalid();
  if (agreement) {
    const selected = agreement.translationId ?? agreement.id;
    if (selection.version && agreement.id !== selection.version) invalid();
    if (selection.text && selected !== selection.text) invalid();
    if (
      !languages.some(
        (row) => row.id === selected && row.language === agreement.language,
      )
    )
      invalid();
  }
  return {
    agreement,
    acceptance,
    current: p.current,
    languages,
    history,
    total,
  };
}
export function formatAgreementTime(value: string, locale: string): string {
  return new Intl.DateTimeFormat(formattingLocale(locale), {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Stockholm",
    timeZoneName: "short",
  }).format(new Date(value));
}
