import {
  getCountryCallingCode,
  isSupportedCountry,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/min";

export type PhoneEntry = { callingCode: string; number: string };

export function initialPhoneEntry(
  region: string | null | undefined,
  storedPhone?: string,
): PhoneEntry {
  const country = region?.toUpperCase();
  const callingCode = `+${getCountryCallingCode(
    country && isSupportedCountry(country) ? (country as CountryCode) : "SE",
  )}`;
  const entry = { callingCode, number: "" };
  return storedPhone
    ? changePhoneNumber(entry, `+${storedPhone.replace(/^\+/, "")}`)
    : entry;
}

/** Pasted/autofilled international numbers bring their own calling code. */
export function changePhoneNumber(
  entry: PhoneEntry,
  value: string,
): PhoneEntry {
  const number = value.trim().replace(/^00/, "+");
  if (/^\+/.test(number) && /^[+\d\s()-]+$/.test(number)) {
    const parsed = parsePhoneNumberFromString(number, { extract: false });
    if (parsed && !parsed.ext)
      return {
        callingCode: `+${parsed.countryCallingCode}`,
        number: parsed.nationalNumber,
      };
  }
  return { ...entry, number: value };
}

/** Format a shipping contact number; it is not an authentication factor. */
export function phoneEntryValue(entry: PhoneEntry): string {
  const number = entry.number.trim().replace(/^00/, "+");
  const callingCode = entry.callingCode.trim().replace(/^\+?/, "+");
  if (!/^\+[1-9]\d{0,2}$/.test(callingCode) || !/^[+\d\s()-]+$/.test(number))
    throw new Error("PHONE_INVALID");
  try {
    const parsed = parsePhoneNumberFromString(number, {
      defaultCallingCode: callingCode.slice(1),
      extract: false,
    });
    if (!parsed || parsed.ext || !parsed.isPossible())
      throw new Error("PHONE_INVALID");
    return parsed.number;
  } catch {
    throw new Error("PHONE_INVALID");
  }
}
