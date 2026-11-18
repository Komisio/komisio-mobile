import assert from "node:assert/strict";
import test from "node:test";
import { createGuestPhotoAnalysis } from "../src/lib/guest-photo-analysis.ts";
import type { ItemDraftSnapshot } from "../src/lib/photo-draft.ts";
import { emptyItemDetails } from "../src/lib/item-draft-details.ts";

const uuid = (n: number) =>
  `a9800000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const snapshot = (): ItemDraftSnapshot => ({
  draft: {
    version: 2,
    draftId: uuid(1),
    revision: 1,
    photoIds: [uuid(2)],
    store: {
      id: uuid(3),
      name: "Komisio",
      slug: "komisio",
      city: "Karlstad",
      country: "SE",
      currency: "SEK",
    },
    details: emptyItemDetails(),
  },
  photos: [{ id: uuid(2), uri: "file://synthetic" }],
});
function fixture(options: { lostReply?: boolean; wrongResult?: boolean } = {}) {
  let journal: any = null,
    next = 100,
    calls = 0;
  let currentTime = Date.parse("2026-11-18T21:00:00.000Z");
  let serverResult: any = null;
  const bytes = new Map<string, Uint8Array>();
  const requests: any[] = [];
  const storage = {
    read: async () => journal,
    write: async (v: any) => {
      journal = structuredClone(v);
    },
    putPhoto: async (id: string, b: Uint8Array) => {
      bytes.set(id, b);
    },
    photo: async (id: string) => bytes.get(id)!,
    prune: async () => {},
  };
  const controller = createGuestPhotoAnalysis({
    binding: "synthetic",
    storage,
    lock: async (_key, work) => work(),
    uuid: () => uuid(next++),
    now: () => currentTime,
    preparePhoto: async () => new Uint8Array([1, 2, 3]),
    request: async (c) => {
      requests.push(c);
      if (c.action === "read") return serverResult;
      calls++;
      serverResult = {
        id: options.wrongResult ? uuid(999) : c.requestId,
        tenantId: c.tenantId,
        photos: c.photos.map((p) => p.id),
        language: c.language,
        status: "ready",
        output: {
          description: "Dress",
          brand: null,
          condition: "good",
          notes: "",
        },
      };
      if (options.lostReply) throw new Error("NETWORK_LOST");
      return serverResult;
    },
  });
  return {
    controller,
    requests,
    storage,
    calls: () => calls,
    advance: (ms: number) => {
      currentTime += ms;
    },
  };
}
test("guest suggestions require no session and survive revisits without another model request", async () => {
  const f = fixture(),
    s = snapshot();
  await f.controller.prepare(s, "sv", () => {});
  assert.equal(
    (await f.controller.analyze(s, "sv")).output?.description,
    "Dress",
  );
  await f.controller.prepare(
    {
      ...s,
      draft: {
        ...s.draft,
        revision: 2,
        details: { ...s.draft.details, description: "My edit" },
      },
    },
    "sv",
    () => {},
  );
  await f.controller.analyze(s, "sv");
  assert.equal(f.calls(), 1);
  assert.equal((await f.controller.cachedPhotos(s))?.length, 1);
  assert.ok((await f.controller.proof(s))?.token.match(/^[a-f0-9]{64}$/));
});
test("image changes and another backend cannot reuse a guest capability result as the current draft", async () => {
  const f = fixture(),
    s = snapshot();
  await f.controller.prepare(s, "sv", () => {});
  await f.controller.analyze(s, "sv");
  const changed = {
    ...s,
    photos: [{ id: uuid(9), uri: "file://different" }],
    draft: { ...s.draft, photoIds: [uuid(9)] },
  };
  assert.equal(await f.controller.cachedPhotos(changed), null);
  assert.equal(await f.controller.proof(changed), null);
  await assert.rejects(f.controller.analyze(changed, "sv"), /DRAFT_CHANGED/);
  const stored = await f.storage.read();
  await f.storage.write({ ...stored, binding: "other-backend" });
  await assert.rejects(f.controller.analyze(s, "sv"), /ASSISTANCE_UNAVAILABLE/);
});

test("a lost response is recovered with a read and no second analysis", async () => {
  const f = fixture({ lostReply: true }),
    s = snapshot();
  await f.controller.prepare(s, "sv", () => {});
  await assert.rejects(f.controller.analyze(s, "sv"), /NETWORK_LOST/);
  assert.equal((await f.controller.analyze(s, "sv")).status, "ready");
  assert.equal(f.calls(), 1);
  assert.ok(await f.controller.proof(s));
});

test("expired guest operations cannot silently run again or be adopted", async () => {
  const f = fixture(),
    s = snapshot();
  await f.controller.prepare(s, "sv", () => {});
  f.advance(86400001);
  await assert.rejects(f.controller.analyze(s, "sv"), /GUEST_ANALYSIS_EXPIRED/);
  assert.equal(f.calls(), 0);
  assert.equal(await f.controller.proof(s), null);
  const ready = fixture();
  await ready.controller.prepare(s, "sv", () => {});
  await ready.controller.analyze(s, "sv");
  ready.advance(86400001);
  assert.equal(await ready.controller.proof(s), null);
  // Already shown suggestions remain locally editable, without another call.
  assert.equal((await ready.controller.analyze(s, "sv")).status, "ready");
  assert.equal(ready.calls(), 1);
});

test("a response for another operation is never applied or adopted", async () => {
  const f = fixture({ wrongResult: true }),
    s = snapshot();
  await f.controller.prepare(s, "sv", () => {});
  await assert.rejects(f.controller.analyze(s, "sv"), /ASSISTANCE_UNAVAILABLE/);
  assert.equal(await f.controller.proof(s), null);
});
