/** App locales use BCP 47 language codes; the agreement API keeps its own codes. */
export const locales = [
  "sv",
  "en",
  "no",
  "da",
  "fi",
  "de",
  "es",
  "it",
] as const;
export type Locale = (typeof locales)[number];
const tags: Record<Locale, string> = {
  sv: "sv-SE",
  en: "en-GB",
  no: "nb-NO",
  da: "da-DK",
  fi: "fi-FI",
  de: "de-DE",
  es: "es-ES",
  it: "it-IT",
};
export function matchLocale(value: string | null | undefined): Locale | null {
  const code = value?.toLowerCase().split(/[-_]/)[0];
  if (code === "nb" || code === "nn") return "no";
  if (code === "dk") return "da";
  return locales.includes(code as Locale) ? (code as Locale) : null;
}
export function formattingLocale(value: string): string {
  return tags[matchLocale(value) ?? "en"];
}
