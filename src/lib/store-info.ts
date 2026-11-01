export const weekdays = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
] as const;
export type Weekday = (typeof weekdays)[number];
export type StoreInfo = {
  name: string;
  slug: string;
  address: {
    street: string;
    postalCode: string;
    city: string;
    country: string;
  };
  contact: { email: string; phone: string; website: string };
  openingHours: { day: Weekday; opens: string; closes: string }[];
  concept: string;
  accepts: string;
};

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("INVALID_PROFILE");
  return value as Record<string, unknown>;
}
function text(value: unknown, max: number): string {
  if (typeof value !== "string" || value.length > max)
    throw new Error("INVALID_PROFILE");
  return value;
}

/** Only published public fields; never expose staff profile metadata. */
export function parseStoreInfo(value: unknown, slug: string): StoreInfo | null {
  if (value === null) return null;
  const row = object(value);
  if (row.slug !== slug) throw new Error("INVALID_PROFILE");
  const profile = object(row.profile);
  const address = object(profile.address);
  const contact = object(profile.contact);
  if (!Array.isArray(profile.openingHours) || profile.openingHours.length > 7)
    throw new Error("INVALID_PROFILE");
  const seen = new Set<string>();
  const openingHours = profile.openingHours.map((value) => {
    const row = object(value);
    const day = text(row.day, 3) as Weekday;
    const opens = text(row.opens, 5);
    const closes = text(row.closes, 5);
    const clock = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (
      !weekdays.includes(day) ||
      seen.has(day) ||
      !clock.test(opens) ||
      !clock.test(closes) ||
      opens >= closes
    )
      throw new Error("INVALID_PROFILE");
    seen.add(day);
    return { day, opens, closes };
  });
  return {
    name: text(row.name, 200),
    slug,
    address: {
      street: text(address.street, 120),
      postalCode: text(address.postalCode, 20),
      city: text(address.city, 120),
      country: address.country === undefined ? "" : text(address.country, 2),
    },
    contact: {
      email: text(contact.email, 254),
      phone: text(contact.phone, 40),
      website: text(contact.website, 200),
    },
    openingHours,
    concept: text(profile.concept, 2000),
    accepts: text(profile.accepts, 2000),
  };
}

export function websiteUrl(value: string): string | null {
  if (!value || /[\s\\\u0000-\u001f\u007f]/.test(value)) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      url.hostname &&
      !url.username &&
      !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
export function emailUrl(value: string): string | null {
  // A single plain mailbox, with no URL headers or control characters.
  if (
    !/^[a-zA-Z0-9.!#$&'*+/=^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/.test(
      value,
    )
  )
    return null;
  const [local, domain] = value.split("@");
  return `mailto:${encodeURIComponent(local)}@${domain}`;
}
export function phoneUrl(value: string): string | null {
  if (!/^\+?[\d ().-]+$/.test(value)) return null;
  const number = value.replace(/[ ().-]/g, "");
  return /^\+?\d{3,20}$/.test(number) ? `tel:${number}` : null;
}
export function addressLines(address: StoreInfo["address"]): string[] {
  return [
    address.street.trim(),
    [address.postalCode.trim(), address.city.trim()].filter(Boolean).join(" "),
    address.country.trim(),
  ].filter(Boolean);
}
export function mapUrl(address: StoreInfo["address"]): string | null {
  if (!address.street.trim() || !address.city.trim()) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressLines(address).join(", "))}`;
}
