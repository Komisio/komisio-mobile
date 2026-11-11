import { test } from "node:test";
import assert from "node:assert/strict";
import {
  initialPhoneEntry,
  changePhoneNumber,
  phoneEntryValue,
} from "../src/lib/phone-entry.ts";

test("device region suggests an editable calling code, with a Sweden fallback", () => {
  assert.deepEqual(initialPhoneEntry("SE"), { callingCode: "+46", number: "" });
  assert.equal(initialPhoneEntry("GB").callingCode, "+44");
  assert.equal(initialPhoneEntry("US").callingCode, "+1");
  assert.equal(initialPhoneEntry("de").callingCode, "+49");
  assert.equal(initialPhoneEntry(null).callingCode, "+46");
  assert.equal(initialPhoneEntry("not-a-region").callingCode, "+46");
});
test("an existing identity's number takes precedence over the device region", () => {
  assert.deepEqual(initialPhoneEntry("US", "46701234567"), {
    callingCode: "+46",
    number: "701234567",
  });
});
test("Swedish numbers can be entered with or without the national leading zero", () => {
  for (const number of ["070 123 45 67", "701234567", "(070) 123-45-67"]) {
    assert.equal(
      phoneEntryValue({ callingCode: "+46", number }),
      "+46701234567",
    );
  }
});
test("pasting or autofilling a full number never duplicates the calling code", () => {
  for (const number of [
    "+46 70 123 45 67",
    "0046701234567",
    "+46 (0)70 123 45 67",
  ]) {
    const entry = changePhoneNumber(initialPhoneEntry("SE"), number);
    assert.equal(entry.callingCode, "+46");
    assert.equal(entry.number, "701234567");
    assert.equal(phoneEntryValue(entry), "+46701234567");
  }
  const foreign = changePhoneNumber(
    initialPhoneEntry("SE"),
    "+1 (202) 555-0123",
  );
  assert.deepEqual(foreign, { callingCode: "+1", number: "2025550123" });
  assert.equal(phoneEntryValue(foreign), "+12025550123");
});
test("country-specific national prefixes are handled without dropping significant digits", () => {
  assert.equal(
    phoneEntryValue({ callingCode: "+44", number: "07700 900123" }),
    "+447700900123",
  );
  assert.equal(
    phoneEntryValue({ callingCode: "+39", number: "02 3661 8300" }),
    "+390236618300",
  );
  assert.equal(
    phoneEntryValue({ callingCode: "46", number: "0701234567" }),
    "+46701234567",
  );
});
test("invalid input and extensions are not silently converted to another SMS address", () => {
  for (const number of [
    "",
    "+",
    "123",
    "call 0701234567",
    "0701234567 ext 42",
    "0701234567#42",
    "+46701234567;+12025550123",
  ]) {
    assert.throws(
      () => phoneEntryValue({ callingCode: "+46", number }),
      /PHONE_INVALID/,
    );
  }
  for (const callingCode of ["", "+", "+046", "+999", "+4670", "46abc"]) {
    assert.throws(
      () => phoneEntryValue({ callingCode, number: "0701234567" }),
      /PHONE_INVALID/,
    );
  }
});
