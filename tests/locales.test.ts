import assert from "node:assert/strict";
import test from "node:test";
import { dictionaries } from "../src/lib/dictionaries.ts";
import { locales, matchLocale, formattingLocale } from "../src/lib/locale.ts";
import { bankCountries } from "../src/lib/bank-countries.ts";
import { bankCountryName } from "../src/lib/bank-country-names.ts";
import { formatPrice } from "../src/lib/catalogue.ts";
import { formatItemDate } from "../src/lib/seller-items.ts";
import {
  formatAgreementTime,
  agreementLanguages,
} from "../src/lib/seller-agreement.ts";

function flatten(value: unknown, prefix = ""): Record<string, string> {
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).flatMap(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      return typeof value === "string"
        ? [[path, value]]
        : Object.entries(flatten(value, path));
    }),
  );
}
test("all eight dictionaries cover every UI key and preserve interpolated facts", () => {
  assert.deepEqual(locales, ["sv", "en", "no", "da", "fi", "de", "es", "it"]);
  assert.deepEqual(Object.keys(dictionaries), [...locales]);
  const source = flatten(dictionaries.en);
  const tokens = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
  for (const locale of locales) {
    const translated = flatten(dictionaries[locale]);
    assert.deepEqual(
      Object.keys(translated).sort(),
      Object.keys(source).sort(),
      locale,
    );
    for (const [key, value] of Object.entries(translated)) {
      assert.ok(value.trim().length > 0, `${locale}.${key}`);
      assert.deepEqual(tokens(value), tokens(source[key]), `${locale}.${key}`);
    }
  }
  assert.deepEqual(
    locales.map((l) => dictionaries[l].languageName),
    [
      "Svenska",
      "English",
      "Norsk",
      "Dansk",
      "Suomi",
      "Deutsch",
      "Español",
      "Italiano",
    ],
  );
});
test("device aliases use valid formatting locales without changing agreement API codes", () => {
  assert.equal(matchLocale("nb-NO"), "no");
  assert.equal(matchLocale("nn_NO"), "no");
  assert.equal(matchLocale("dk"), "da");
  assert.equal(matchLocale("da-DK"), "da");
  assert.equal(matchLocale("de-AT"), "de");
  assert.equal(matchLocale("fr"), null);
  assert.equal(matchLocale(null), null);
  assert.deepEqual(Object.keys(agreementLanguages), [
    "sv",
    "en",
    "no",
    "dk",
    "fi",
    "de",
    "es",
    "it",
  ]);
  const date = "2026-10-30T12:34:00Z";
  for (const locale of locales) {
    const tag = formattingLocale(locale);
    assert.equal(
      formatPrice(123456, "SEK", locale),
      new Intl.NumberFormat(tag, { style: "currency", currency: "SEK" }).format(
        1234.56,
      ),
    );
    assert.equal(
      formatItemDate(date, locale),
      new Intl.DateTimeFormat(tag, {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "Europe/Stockholm",
      }).format(new Date(date)),
    );
    assert.equal(
      formatAgreementTime(date, locale),
      new Intl.DateTimeFormat(tag, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Stockholm",
        timeZoneName: "short",
      }).format(new Date(date)),
    );
  }
});
test("every bank country has a bundled localized name in all eight languages", () => {
  for (const locale of locales)
    for (const code of bankCountries) {
      const name = bankCountryName(code, locale);
      assert.ok(name.length > 2, `${locale}:${code}`);
      assert.notEqual(name, code);
      assert.notEqual(name, bankCountryName("XX", locale));
    }
  assert.deepEqual(
    locales.map((l) => bankCountryName("SE", l)),
    [
      "Sverige",
      "Sweden",
      "Sverige",
      "Sverige",
      "Ruotsi",
      "Schweden",
      "Suecia",
      "Svezia",
    ],
  );
});
