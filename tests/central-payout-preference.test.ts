import assert from "node:assert/strict";
import test from "node:test";
import {
  swishNumber,
  parsePreferenceCommand,
} from "../src/lib/central-payout-preference.ts";
const id = (n: number) =>
  "e8123400-0000-4000-8000-" + String(n).padStart(12, "0");
test("Swish accepts a Swedish domestic mobile number and rejects a landline or foreign number", () => {
  for (const value of ["070-123 45 67", "+46701234567", "0046701234567"])
    assert.equal(swishNumber(value), "+46701234567");
  for (const value of ["", "08-12345678", "+4791234567"])
    assert.throws(() => swishNumber(value));
});
test("settings recovery keeps the intended destination and seller", () => {
  const base = {
    action: "savePayoutPreference",
    requestId: id(1),
    expected: null,
    sellerId: id(2),
    tenantId: id(3),
  };
  for (const destination of [
    { method: "swish", phone: "+46701234567" },
    { method: "bank", bankVersionId: id(4) },
  ]) {
    const c = { ...base, destination };
    assert.deepEqual(parsePreferenceCommand(c, id(3), id(2)), c);
    assert.throws(() => parsePreferenceCommand(c, id(3), id(1)));
  }
});
