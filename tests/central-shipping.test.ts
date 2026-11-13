import test from "node:test";
import assert from "node:assert/strict";
import {
  parseBookParcel,
  parseShippingState,
  parcelTrackingUrl,
  shippingOutcome,
  shippingMeasure,
} from "../src/lib/central-shipping.ts";

const id = "f7800000-0000-4000-8000-000000000601",
  offer = "f7800000-0000-4000-8000-000000000401";
const command = {
  action: "book",
  requestId: id,
  offerId: offer,
  address: { street: "Testvägen 2", postalCode: "12345", city: "Teststad" },
  weightG: 1001,
  lengthMm: 400,
  widthMm: 300,
  heightMm: 200,
};
const contact = {
  ...command.address,
  name: "Synthetic sender",
  email: "sender@example.test",
  phone: "+46700007802",
  country: "SE",
};
const state = {
  offerId: offer,
  available: true,
  parcel: {
    ...command,
    id,
    reference: "P-1",
    environment: "sandbox",
    sender: contact,
    recipient: contact,
    status: "pending",
    booking: null,
    createdAt: "2026-11-12T10:00:00Z",
  },
};
test("postal input rejects injected destinations and invalid measurements", () => {
  assert.deepEqual(parseBookParcel(command, offer), command);
  for (const extra of [
    { recipient: contact },
    { weightG: 20001 },
    { lengthMm: 1600 },
    { lengthMm: 1500, widthMm: 1000, heightMm: 1000 },
    { address: { ...command.address, country: "DE" } },
    { address: { ...command.address, street: "A".repeat(51) } },
    { address: { ...command.address, city: "A".repeat(36) } },
  ])
    assert.throws(() => parseBookParcel({ ...command, ...extra }, offer));
  assert.equal(shippingMeasure("1,001", 3), 1001);
  assert.equal(shippingMeasure("40.5", 1), 405);
  for (const s of ["-1", "NaN", "1e3", "1,1234", ""])
    assert.throws(() => shippingMeasure(s, 3));
});
test("shipping read binds the offer, validates QR and never turns pending into booked", () => {
  assert.equal(parseShippingState(state, offer).parcel?.status, "pending");
  assert.throws(() => parseShippingState(state, id));
  assert.throws(() =>
    parseShippingState(
      { ...state, parcel: { ...state.parcel, status: "booked" } },
      offer,
    ),
  );
  const booking = {
    bookingId: "test-booking",
    returnId: "return-code",
    trackingId: "003700000000000001",
    qrPng: "data:image/png;base64,iVBORw0KGgo=",
  };
  const booked = parseShippingState(
    { ...state, parcel: { ...state.parcel, status: "booked", booking } },
    offer,
  ).parcel!;
  assert.equal(
    parcelTrackingUrl(booked),
    "https://attracking.postnord.com/se/?id=003700000000000001",
  );
  assert.throws(() =>
    parseShippingState(
      {
        ...state,
        parcel: {
          ...booked,
          booking: { ...booking, qrPng: "https://evil.example/image" },
        },
      },
      offer,
    ),
  );
  assert.throws(() =>
    parcelTrackingUrl({
      ...booked,
      booking: { ...booking, trackingId: "x&redirect=https://evil.example" },
    }),
  );
});
test("unconfirmed bookings retain intent; a duplicate uses the existing parcel", () => {
  assert.deepEqual(shippingOutcome(200, { id }, id), { kind: "success", id });
  assert.equal(
    shippingOutcome(503, { error: "SHIPPING_UNAVAILABLE" }, id).kind,
    "unknown",
  );
  assert.deepEqual(shippingOutcome(409, { error: "PARCEL_EXISTS" }, id), {
    kind: "conflict",
    code: "PARCEL_EXISTS",
  });
  assert.equal(shippingOutcome(200, { id: offer }, id).kind, "unknown");
});
test("new bookings omit measurements without estimates and old queued requests still parse", () => {
  const { weightG, lengthMm, widthMm, heightMm, ...simple } = command;
  assert.deepEqual(parseBookParcel(simple, offer), simple);
  assert.deepEqual(parseBookParcel(command, offer), command);
  for (const extra of [
    { weightG },
    { lengthMm },
    { widthMm, heightMm },
    { weightG: null, lengthMm: null, widthMm: null, heightMm: null },
  ])
    assert.throws(() => parseBookParcel({ ...simple, ...extra }, offer));
  assert.equal(parseShippingState(state, offer).measurementsOptional, false);
  const unknown = {
    ...state,
    measurementsOptional: true,
    parcel: {
      ...state.parcel,
      weightG: null,
      lengthMm: null,
      widthMm: null,
      heightMm: null,
    },
  };
  assert.equal(parseShippingState(unknown, offer).parcel?.weightG, null);
  assert.throws(() =>
    parseShippingState(
      { ...unknown, parcel: { ...unknown.parcel, weightG: 1000 } },
      offer,
    ),
  );
});
