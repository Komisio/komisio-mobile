import { sv, en, type Dictionary } from "./dictionary-base.ts";
import no from "./locales/no.ts";
import da from "./locales/da.ts";
import fi from "./locales/fi.ts";
import de from "./locales/de.ts";
import es from "./locales/es.ts";
import it from "./locales/it.ts";
import type { Locale } from "./locale.ts";

export const dictionaries: Record<Locale, Dictionary> = {
  sv,
  en,
  no,
  da,
  fi,
  de,
  es,
  it,
};
export type { Dictionary } from "./dictionary-base.ts";
