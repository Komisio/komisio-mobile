import assert from "node:assert/strict";
import test from "node:test";
import { bankCountries } from "../src/lib/bank-countries.ts";
import { bankCountryName } from "../src/lib/bank-country-names.ts";

test("every accepted bank country has bundled names instead of a code fallback", () => {
  for (const code of bankCountries) {
    for (const locale of ["sv", "en"] as const) {
      const name = bankCountryName(code, locale);
      assert.ok(name.length > 2, `${locale}: ${code}`);
      assert.notEqual(name, code);
      assert.notEqual(name, "Okänt land");
      assert.notEqual(name, "Unknown country");
      assert.ok(!name.includes(`(${code})`));
    }
  }
  assert.equal(bankCountryName("SE", "sv"), "Sverige");
  assert.equal(bankCountryName("NO", "sv"), "Norge");
  assert.equal(bankCountryName("DK", "sv"), "Danmark");
  assert.equal(bankCountryName("SE", "en"), "Sweden");
  assert.equal(bankCountryName("XX", "sv"), "Okänt land");
});
