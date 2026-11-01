import assert from "node:assert/strict";
import test from "node:test";
import {
  addressLines,
  emailUrl,
  mapUrl,
  parseStoreInfo,
  phoneUrl,
  websiteUrl,
} from "../src/lib/store-info.ts";

function fixture() {
  return {
    name: "Demo",
    slug: "demo",
    version: 1,
    publishedAt: "2026-10-28T10:00:00Z",
    internalNotes: "never displayed",
    profile: {
      address: {
        street: "Götgatan 10",
        postalCode: "118 46",
        city: "Stockholm",
        country: "SE",
      },
      contact: {
        email: "store@example.test",
        phone: "+46 (0)8 123-456",
        website: "https://example.test",
      },
      openingHours: [{ day: "mon", opens: "09:00", closes: "18:00" }],
      concept: "A published description",
      accepts: "Clothing",
      language: "sv",
    },
  };
}

test("public profile remains scoped to the requested store and exposes only displayed fields", () => {
  const info = parseStoreInfo(fixture(), "demo")!;
  assert.equal(info.slug, "demo");
  assert.equal(info.concept, "A published description");
  assert.equal("internalNotes" in info, false);
  assert.equal("version" in info, false);
  assert.throws(() => parseStoreInfo(fixture(), "different-store"));
  assert.equal(parseStoreInfo(null, "demo"), null);
  assert.throws(() => parseStoreInfo(undefined, "demo"));
});

test("missing hours stay unknown and legacy addresses without country remain readable", () => {
  const value = fixture();
  value.profile.openingHours = [];
  delete (value.profile.address as { country?: string }).country;
  const info = parseStoreInfo(value, "demo")!;
  assert.deepEqual(info.openingHours, []);
  assert.equal(info.address.country, "");
  assert.deepEqual(addressLines(info.address), [
    "Götgatan 10",
    "118 46 Stockholm",
  ]);
});

test("reject malformed or duplicate opening hours and oversized content", () => {
  for (const hours of [
    [{ day: "mon", opens: "24:00", closes: "25:00" }],
    [{ day: "mon", opens: "18:00", closes: "09:00" }],
    [{ day: "foo", opens: "09:00", closes: "18:00" }],
    [fixture().profile.openingHours[0], fixture().profile.openingHours[0]],
  ]) {
    const value = fixture();
    value.profile.openingHours = hours;
    assert.throws(() => parseStoreInfo(value, "demo"));
  }
  const value = fixture();
  value.profile.concept = "x".repeat(2001);
  assert.throws(() => parseStoreInfo(value, "demo"));
});

test("website actions accept only complete HTTPS URLs without credentials or controls", () => {
  assert.equal(
    websiteUrl("https://example.test/path?a=1"),
    "https://example.test/path?a=1",
  );
  for (const value of [
    "",
    "javascript:alert(1)",
    "http://example.test",
    "intent://foo",
    "//example.test",
    "https://user:pass@example.test",
    "https://example.test\n",
    "https://exam\\ple.test",
  ])
    assert.equal(websiteUrl(value), null, value);
});

test("email and phone links cannot introduce headers, extensions or executable schemes", () => {
  assert.equal(
    emailUrl("seller+store@example.test"),
    "mailto:seller%2Bstore@example.test",
  );
  for (const value of [
    "a@example.test?bcc=other@example.test",
    "a%0D%0A@example.test",
    "a@example.test\r\nBcc:b@example.test",
    "a@example.test,b@example.test",
    "",
  ])
    assert.equal(emailUrl(value), null);
  assert.equal(phoneUrl("+46 (0)8 123-456"), "tel:+4608123456");
  for (const value of [
    "",
    "1",
    "123;456",
    "*123#",
    "123?x=2",
    "javascript:123",
  ])
    assert.equal(phoneUrl(value), null);
});

test("maps receive only the encoded published address and no device location", () => {
  const address = fixture().profile.address;
  const url = new URL(mapUrl(address)!);
  assert.equal(url.origin, "https://www.google.com");
  assert.equal(
    url.searchParams.get("query"),
    "Götgatan 10, 118 46 Stockholm, SE",
  );
  assert.equal(mapUrl({ ...address, street: "" }), null);
  assert.equal(mapUrl({ ...address, city: "  " }), null);
  const hostile = new URL(
    mapUrl({ ...address, street: "Road &query=other#fragment" })!,
  );
  assert.equal(
    hostile.searchParams.get("query"),
    "Road &query=other#fragment, 118 46 Stockholm, SE",
  );
  assert.equal(hostile.hash, "");
});
