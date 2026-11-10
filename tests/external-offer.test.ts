import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseExternalOfferDetail,
  parseExternalOffer,
  parseOfferResponse,
  offerResponseOutcome,
  offerIsExpired,
  offerAmount,
} from "../src/lib/external-offer.ts";
import { createExternalOfferApi } from "../src/lib/external-offer-http.ts";
import { createPendingCommand } from "../src/lib/pending-command.ts";

const id = (n: number) =>
  `f7200000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const offer = {
  id: id(1),
  requestId: id(2),
  tenantId: id(3),
  sellerAmountOre: "40000",
  expectedSalePriceOre: "100000",
  currency: "SEK",
  agreementVersionId: id(4),
  createdAt: "2026-11-10T10:00:00Z",
  expiresAt: "2026-11-12T10:00:00Z",
  serverNow: "2026-11-12T09:59:59Z",
  status: "offered",
  canAccept: true,
  canDecline: true,
  response: null,
};
const detail = {
  ...offer,
  agreement: {
    id: id(4),
    version: 1,
    title: "Synthetic agreement",
    body: "Synthetic original terms",
    language: "sv",
  },
};
test("offers bind a fixed positive SEK amount, 48-hour deadline and exact agreement", () => {
  assert.equal(
    parseExternalOfferDetail(detail).agreement.body,
    detail.agreement.body,
  );
  for (const patch of [
    { sellerAmountOre: "1.5" },
    { sellerAmountOre: "0" },
    { currency: "EUR" },
    { expiresAt: "2026-11-13T10:00:00Z" },
    { agreement: { ...detail.agreement, id: id(5) } },
    { status: "accepted", canAccept: true },
    { response: { id: id(6), accepted: true, createdAt: offer.createdAt } },
  ])
    assert.throws(() => parseExternalOfferDetail({ ...detail, ...patch }));
  assert.equal(offerIsExpired(parseExternalOffer(offer), 999), false);
  assert.equal(offerIsExpired(parseExternalOffer(offer), 1000), true);
  assert.equal(offerAmount("40001", "sv-SE"), "400,01 kr");
  assert.equal(offerAmount("99999999999", "en-GB"), "999,999,999.99 SEK");
});
test("reads reject foreign request results and a changed login", async () => {
  let current = id(10);
  const deps = {
    endpoint: "https://example.test/api/mobile/v1/external-items/offers",
    user: id(10),
    session: async () => ({ user: current, token: "synthetic" }),
    request: async () => ({
      status: 200,
      text: async () => JSON.stringify({ offers: [offer] }),
    }),
  };
  assert.equal((await createExternalOfferApi(deps).list([id(2)])).length, 1);
  await assert.rejects(createExternalOfferApi(deps).list([id(20)]));
  await assert.rejects(createExternalOfferApi(deps).list([id(2), id(2)]));
  await assert.rejects(
    createExternalOfferApi({
      ...deps,
      request: async () => {
        current = id(11);
        return { status: 200, text: async () => JSON.stringify(detail) };
      },
    }).read(id(1)),
    /SESSION_CHANGED/,
  );
});
test("only exact confirmation or replay-safe conflicts settle a response", () => {
  const c = {
    action: "respond",
    requestId: id(7),
    offerId: id(1),
    accepted: true,
    agreementVersionId: id(4),
  };
  assert.deepEqual(parseOfferResponse(c, id(1)), c);
  assert.throws(() => parseOfferResponse({ ...c, ownerId: id(20) }, id(1)));
  assert.throws(() => parseOfferResponse({ ...c, accepted: false }, id(1)));
  assert.equal(offerResponseOutcome(200, { id: id(8) }, id(7)).kind, "unknown");
  assert.equal(offerResponseOutcome(200, { id: id(7) }, id(7)).kind, "success");
  assert.equal(
    offerResponseOutcome(409, { error: "OFFER_EXPIRED" }, id(7)).kind,
    "conflict",
  );
  assert.equal(
    offerResponseOutcome(403, { error: "MFA_REQUIRED" }, id(7)).kind,
    "unknown",
  );
});
test("a lost acceptance survives remount and retries the exact response, never a refusal", async () => {
  const values = new Map<string, string>(),
    sent: unknown[] = [];
  const deps = {
    key: `offer.${id(10)}.${id(1)}`,
    binding: "synthetic owner/project/offer",
    storage: {
      getItem: async (k: string) => values.get(k) ?? null,
      setItem: async (k: string, v: string) => {
        values.set(k, v);
      },
      removeItem: async (k: string) => {
        values.delete(k);
      },
    },
    lock: async <T>(_key: string, fn: () => Promise<T>) => fn(),
    parse: (v: unknown) => parseOfferResponse(v, id(1)),
    send: async (c: ReturnType<typeof parseOfferResponse>) => {
      sent.push(c);
      return offerResponseOutcome(
        sent.length === 1 ? 503 : 200,
        { id: c.requestId },
        c.requestId,
      );
    },
  };
  const c = {
    action: "respond" as const,
    requestId: id(7),
    offerId: id(1),
    accepted: true,
    agreementVersionId: id(4),
  };
  const first = createPendingCommand(deps);
  await first.submit(c);
  assert.equal(first.getState().status, "pending");
  const resumed = createPendingCommand(deps);
  await resumed.load();
  await resumed.submit({
    ...c,
    requestId: id(8),
    accepted: false,
    agreementVersionId: null,
  });
  assert.equal(sent.length, 1);
  await resumed.retry();
  assert.deepEqual(sent, [c, c]);
  assert.equal(resumed.getState().status, "success");
  assert.equal(values.size, 0);
});

test("handover progress requires real accepted and received states while old reads remain compatible", () => {
  const accepted = {
    ...offer,
    status: "accepted",
    canAccept: false,
    canDecline: false,
    response: { id: id(6), accepted: true, createdAt: offer.createdAt },
  };
  const handover = {
    id: id(7),
    reference: "H-128",
    status: "open",
    receivedAt: null,
    itemCount: 2,
  };
  assert.equal(parseExternalOffer(accepted).handover, undefined);
  assert.equal(
    parseExternalOffer({ ...accepted, handover }).handover?.itemCount,
    2,
  );
  const received = {
    ...handover,
    status: "received",
    receivedAt: "2026-11-12T10:00:00Z",
  };
  assert.equal(
    parseExternalOffer({ ...accepted, handover: received }).handover?.status,
    "received",
  );
  assert.throws(() => parseExternalOffer({ ...offer, handover }));
  for (const patch of [
    { reference: "H-0" },
    { itemCount: 11 },
    { itemCount: 0 },
    { status: "on_sale" },
    { status: "received" },
    { receivedAt: offer.createdAt },
  ])
    assert.throws(() =>
      parseExternalOffer({ ...accepted, handover: { ...handover, ...patch } }),
    );
});
