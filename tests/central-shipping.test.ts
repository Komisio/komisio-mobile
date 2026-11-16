import test from "node:test";
import assert from "node:assert/strict";
import {
  parseBookParcel,
  parseShippingState,
  parcelTrackingUrl,
  shippingOutcome,
  shippingMeasure,
  parcelSelectionFits,
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

test("five 400 g items fit; remaining items make a separate package", () => {
  const items = Array.from({ length: 10 }, (_, n) => ({
    offerId: `f7800000-0000-4000-8000-${String(401 + n).padStart(12, "0")}`,
    handoverId: id,
    description: "Dress",
    reference: `H-${n + 1}`,
    status: "open" as const,
    selectionWeightG: 400,
  }));
  const ids = items.map((i) => i.offerId);
  assert.equal(parcelSelectionFits(items, ids.slice(0, 5), 2000), true);
  assert.equal(parcelSelectionFits(items, ids.slice(0, 6), 2000), false);
  assert.equal(parcelSelectionFits(items, ids.slice(5), 2000), true);
  assert.equal(parcelSelectionFits(items, ids, null), true);
  const unknown = [{ ...items[0], selectionWeightG: undefined }, items[1]];
  assert.equal(parcelSelectionFits(unknown, [ids[0]], 2000), true);
  assert.equal(parcelSelectionFits(unknown, ids.slice(0, 2), 2000), false);
  assert.equal(parcelSelectionFits(items, [id], 2000), false);
  assert.equal(
    parcelSelectionFits(
      [{ ...items[0], selectionWeightG: 2100 }],
      [ids[0]],
      2000,
    ),
    false,
  );
  const read = {
    offerId: offer,
    available: true,
    parcel: null,
    eligibleItems: items,
    selectionWeightLimitG: 2000,
  };
  assert.equal(parseShippingState(read, offer).selectionWeightLimitG, 2000);
  assert.throws(() =>
    parseShippingState({ ...read, selectionWeightLimitG: 3000 }, offer),
  );
  for (const selectionWeightG of [0, -1, 1.5, 100001, "400", null]) {
    assert.throws(() =>
      parseShippingState(
        { ...read, eligibleItems: [{ ...items[0], selectionWeightG }] },
        offer,
      ),
    );
  }
  assert.deepEqual(shippingOutcome(409, { error: "PARCEL_WEIGHT_LIMIT" }, id), {
    kind: "conflict",
    code: "PARCEL_WEIGHT_LIMIT",
  });
});
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

test("parcel selection is exact and rejects duplicates, missing anchor and legacy measurements", () => {
  const second = "f7800000-0000-4000-8000-000000000402";
  const { weightG, lengthMm, widthMm, heightMm, ...simple } = command;
  const grouped = { ...simple, offerIds: [offer, second] };
  assert.deepEqual(parseBookParcel(grouped, offer), grouped);
  for (const offerIds of [
    [],
    [second],
    [offer, offer],
    [offer, null],
    Array(11).fill(offer),
  ])
    assert.throws(() => parseBookParcel({ ...simple, offerIds }, offer));
  assert.throws(() =>
    parseBookParcel({ ...command, offerIds: [offer, second] }, offer),
  );
  const item = {
    offerId: offer,
    handoverId: id,
    description: "Jacket",
    reference: "H-1",
    status: "open",
  };
  const other = {
    ...item,
    offerId: second,
    handoverId: second,
    description: "Dress",
    reference: "H-2",
  };
  const read = {
    ...state,
    bundlingAvailable: true,
    eligibleItems: [],
    parcel: { ...state.parcel, items: [item, other] },
  };
  assert.equal(parseShippingState(read, offer).parcel?.items.length, 2);
  assert.equal(
    parseShippingState({ ...read, offerId: second }, second).parcel?.id,
    id,
  );
  assert.throws(() =>
    parseShippingState(
      { ...read, parcel: { ...read.parcel, items: [other] } },
      offer,
    ),
  );
  assert.throws(() =>
    parseShippingState(
      { ...read, eligibleItems: [{ ...item, status: "received" }] },
      offer,
    ),
  );
  assert.equal(parseShippingState(state, offer).bundlingAvailable, false);
});
