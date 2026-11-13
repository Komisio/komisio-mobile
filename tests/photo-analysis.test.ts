import test from "node:test";
import assert from "node:assert/strict";
import {
  createPhotoAnalysis,
  applyPhotoSuggestion,
  parsePhotoAnalysis,
  type PhotoAnalysisJournal,
  type PhotoAnalysisResult,
  type PhotoAnalysisCommand,
} from "../src/lib/photo-analysis.ts";
import { createPhotoAnalysisApi } from "../src/lib/photo-analysis-http.ts";
import { emptyItemDetails } from "../src/lib/item-draft-details.ts";
import type { ItemDraftSnapshot } from "../src/lib/photo-draft.ts";
const id = (n: number) =>
  `f4780000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const snapshot = (): ItemDraftSnapshot => ({
  draft: {
    version: 2,
    draftId: id(2),
    revision: 3,
    photoIds: [id(3), id(4)],
    store: {
      id: id(5),
      name: "Synthetic",
      slug: "synthetic",
      city: null,
      country: "SE",
      currency: "SEK",
    },
    details: emptyItemDetails(),
  },
  photos: [
    { id: id(3), uri: "file:///first.jpg" },
    { id: id(4), uri: "file:///second.jpg" },
  ],
});
const proposal = {
  description: "Dress",
  brand: "Synthetic",
  condition: "good" as const,
  notes: "Visible pockets",
};
function fixture() {
  let journal: PhotoAnalysisJournal | null = null,
    sequence = 100,
    failUpload = 0,
    server: PhotoAnalysisResult | null = null;
  const files = new Map<string, Uint8Array>(),
    uploads: string[] = [],
    calls: PhotoAnalysisCommand[] = [],
    discards: string[] = [];
  const deps = {
    ownerId: id(1),
    binding: "synthetic",
    uuid: () => id(++sequence),
    lock: async <T>(_key: string, work: () => Promise<T>) => work(),
    preparePhoto: async () => new Uint8Array([255, 216, 255]),
    storage: {
      read: async () => structuredClone(journal),
      write: async (v: PhotoAnalysisJournal) => {
        journal = structuredClone(v);
      },
      putPhoto: async (key: string, bytes: Uint8Array) => {
        files.set(key, bytes);
      },
      photo: async (key: string) => {
        const bytes = files.get(key);
        if (!bytes) throw Error("missing");
        return bytes;
      },
      prune: async (keep: string[]) => {
        for (const key of files.keys())
          if (!keep.includes(key)) files.delete(key);
      },
    },
    api: {
      upload: async (key: string) => {
        uploads.push(key);
        if (failUpload === uploads.length) throw Error("lost upload reply");
      },
      discardPhoto: async (key: string) => {
        discards.push(key);
      },
    },
    analyze: async (c: PhotoAnalysisCommand) => {
      calls.push(c);
      if (c.action === "read") return server;
      server = {
        id: c.requestId,
        tenantId: c.tenantId,
        photos: c.photos,
        language: c.language,
        status: "ready",
        output: proposal,
      };
      return server;
    },
  };
  return {
    deps,
    controller: createPhotoAnalysis(deps),
    uploads,
    calls,
    discards,
    journal: () => journal!,
    fail: (n: number) => {
      failUpload = n;
    },
    pending: () => {
      server = {
        id: journal!.requestId,
        tenantId: id(5),
        photos: journal!.photos,
        language: "sv",
        status: "pending",
        output: null,
      };
    },
  };
}
test("uploading all photos never invokes AI; explicit analysis makes one request", async () => {
  const f = fixture(),
    s = snapshot(),
    progress: number[] = [];
  await f.controller.upload(s, "sv", (n) => progress.push(n));
  assert.deepEqual(progress, [0, 1, 2]);
  assert.equal(f.calls.length, 0);
  assert.equal((await f.controller.analyze(s, "sv")).status, "ready");
  await f.controller.analyze(s, "sv");
  assert.equal(f.calls.filter((c) => c.action === "analyze").length, 1);
});
test("an incomplete upload cannot invoke AI and retries retain the same image IDs", async () => {
  const f = fixture(),
    s = snapshot();
  f.fail(2);
  await assert.rejects(f.controller.upload(s, "sv", () => {}));
  const before = f.journal();
  assert.equal(before.uploaded, 1);
  await assert.rejects(f.controller.analyze(s, "sv"), /PHOTOS_NOT_UPLOADED/);
  assert.equal(f.calls.length, 0);
  f.fail(0);
  await f.controller.upload(s, "sv", () => {});
  assert.deepEqual(f.uploads, [
    before.photos[0],
    before.photos[1],
    before.photos[1],
  ]);
  assert.equal(f.journal().requestId, before.requestId);
});
test("a pending analysis is reconciled rather than restarted after a lost reply", async () => {
  const f = fixture(),
    s = snapshot();
  await f.controller.upload(s, "sv", () => {});
  f.pending();
  assert.equal((await f.controller.analyze(s, "sv")).status, "pending");
  assert.deepEqual(
    f.calls.map((c) => c.action),
    ["read"],
  );
});
test("changed photos cannot reuse a previous result or prepared bytes", async () => {
  const f = fixture(),
    s = snapshot();
  await f.controller.upload(s, "sv", () => {});
  s.photos[0].id = id(6);
  s.draft.photoIds[0] = id(6);
  assert.equal(await f.controller.cachedPhotos(s), null);
  await assert.rejects(f.controller.analyze(s, "sv"), /PHOTOS_NOT_UPLOADED/);
  await f.controller.upload(s, "sv", () => {});
  assert.equal(f.discards.length, 2);
});
test("another identity cannot use the private analysis journal", async () => {
  const f = fixture();
  await f.controller.upload(snapshot(), "sv", () => {});
  const other = createPhotoAnalysis({ ...f.deps, ownerId: id(7) });
  await assert.rejects(
    other.analyze(snapshot(), "sv"),
    /ASSISTANCE_UNAVAILABLE/,
  );
});
test("suggestions fill empty details and preserve manual edits and the desired compensation", () => {
  const own = {
    ...emptyItemDetails(),
    brand: "My brand",
    notes: "My note",
    desiredSellerAmount: "400",
  };
  const value = applyPhotoSuggestion(own, proposal);
  assert.equal(value.description, "Dress");
  assert.equal(value.condition, "good");
  assert.equal(value.brand, "My brand");
  assert.equal(value.notes, "My note");
  assert.equal(value.desiredSellerAmount, "400");
  assert.equal(
    applyPhotoSuggestion(emptyItemDetails(), { ...proposal, condition: null })
      .condition,
    null,
  );
});
test("invalid AI fields and a status/output mismatch fail closed", () => {
  const result = {
    id: id(8),
    tenantId: id(5),
    photos: [id(3)],
    language: "sv",
    status: "ready",
    output: proposal,
  };
  assert.throws(() =>
    parsePhotoAnalysis({
      ...result,
      output: { ...proposal, condition: "perfect" },
    }),
  );
  assert.throws(() => parsePhotoAnalysis({ ...result, status: "pending" }));
});
test("the API checks account identity before dispatch and after receiving a response", async () => {
  let user = id(1),
    sent = 0;
  const api = createPhotoAnalysisApi({
    ownerId: id(1),
    endpoint: "https://example.test/external-items",
    session: async () => ({ user, token: "synthetic" }),
    request: async () => {
      sent++;
      user = id(9);
      return {
        status: 200,
        text: async () => JSON.stringify({ result: null }),
      };
    },
  });
  await assert.rejects(
    api({ action: "read", requestId: id(8) }),
    /SESSION_CHANGED/,
  );
  assert.equal(sent, 1);
  await assert.rejects(
    api({ action: "read", requestId: id(8) }),
    /SESSION_CHANGED/,
  );
  assert.equal(sent, 1);
});
