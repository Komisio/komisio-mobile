import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createExternalSubmission,
  parseExternalAttempt,
  type ExternalAttempt,
  type ExternalRequest,
  type ExternalItemCommand,
  type ExternalRequestApi,
  type ExternalOutboxStorage,
} from "../src/lib/external-submission.ts";
import type { ItemDraftSnapshot } from "../src/lib/photo-draft.ts";
const id = (n: number) =>
  `f6200000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const ownerId = id(1),
  binding = "synthetic project and endpoint";
function snapshot(): ItemDraftSnapshot {
  return {
    draft: {
      version: 2,
      draftId: id(2),
      revision: 3,
      photoIds: [id(3)],
      store: {
        id: id(4),
        name: "Synthetic store",
        slug: "synthetic",
        city: null,
        country: null,
        currency: "SEK",
      },
      details: {
        description: "Jacket",
        brand: "Test",
        condition: "good",
        notes: "",
        desiredPrice: "100,50",
      },
    },
    photos: [{ id: id(3), uri: "file:///private/original.image" }],
  };
}
const row = (c: ExternalItemCommand): ExternalRequest => ({
  id: c.requestId,
  tenant_id: c.tenantId,
  store_name: "Synthetic store",
  description: c.description,
  brand: c.brand,
  condition: c.condition,
  notes: c.notes,
  desired_price_ore: c.desiredPriceOre,
  currency: c.currency,
  photos: c.photos,
  created_at: "2026-11-10T00:00:00Z",
  status: "waiting",
  decline_note: null,
});
function fixture() {
  let saved: ExternalAttempt | null = null,
    seq = 10,
    existing: ExternalRequest | null = null;
  const bytes = new Map<string, Uint8Array>(),
    calls: string[] = [],
    finished: { expected: unknown; preserve: boolean }[] = [];
  let held = false;
  const storage: ExternalOutboxStorage = {
    async read() {
      return saved ? structuredClone(saved) : null;
    },
    async write(attempt) {
      saved = structuredClone(attempt);
    },
    async putPhoto(id, value) {
      bytes.set(id, value);
    },
    async photo(id) {
      const value = bytes.get(id);
      if (!value) throw Error("missing bytes");
      return value;
    },
    async prune(keep) {
      for (const id of bytes.keys()) if (!keep.includes(id)) bytes.delete(id);
    },
  };
  const api: ExternalRequestApi = {
    async lookup() {
      calls.push("lookup");
      return existing;
    },
    async upload() {
      calls.push("upload");
    },
    async submit(c) {
      calls.push("submit");
      existing = row(c);
    },
    async discardPhoto() {
      calls.push("discard");
    },
  };
  const deps = {
    ownerId,
    binding,
    storage,
    api,
    uuid: () => id(++seq),
    preparePhoto: async () => new Uint8Array([255, 216, 255, 1]),
    finishDraft: async (expected: unknown, preserve: boolean) => {
      finished.push({ expected, preserve });
    },
    lock: async <T>(_key: string, work: () => Promise<T>) => {
      if (held) throw Error("BUSY");
      held = true;
      try {
        return await work();
      } finally {
        held = false;
      }
    },
  };
  return {
    deps,
    storage,
    api,
    bytes,
    calls,
    finished,
    controller: () => createExternalSubmission(deps),
    read: () => saved!,
    setSaved: (a: ExternalAttempt) => {
      saved = a;
    },
    setExisting: (r: ExternalRequest | null) => {
      existing = r;
    },
  };
}
test("preparation freezes the displayed draft and exact ore before yielding", async () => {
  const f = fixture(),
    draft = snapshot();
  const result = f.controller().prepare(draft);
  draft.draft.details.description = "Changed while preparing";
  const prepared = await result;
  assert.equal(prepared.command.description, "Jacket");
  assert.equal(prepared.command.desiredPriceOre, "10050");
  assert.equal(prepared.state, "pending");
  assert.deepEqual(f.calls, []);
  assert.equal(f.bytes.size, 1);
});
test("a lost submission response reconciles the original ID without uploading or sending again", async () => {
  const f = fixture(),
    controller = f.controller();
  const attempt = await controller.prepare(snapshot());
  f.api.submit = async (c) => {
    f.calls.push("submit");
    f.setExisting(row(c));
    throw Error("lost response");
  };
  await assert.rejects(controller.resume(), /lost response/);
  assert.equal(f.read().state, "pending");
  f.calls.length = 0;
  const result = await f.controller().resume();
  assert.equal(result.command.requestId, attempt.command.requestId);
  assert.equal(result.state, "complete");
  assert.deepEqual(f.calls, ["lookup"]);
  assert.equal(f.finished.length, 1);
  assert.equal(f.bytes.size, 0);
});
test("server confirmation is durable before local draft cleanup", async () => {
  const f = fixture();
  await f.controller().prepare(snapshot());
  f.deps.finishDraft = async () => {
    throw Error("disk unavailable");
  };
  await assert.rejects(f.controller().resume(), /disk unavailable/);
  assert.equal(f.read().state, "confirmed");
  f.calls.length = 0;
  f.deps.finishDraft = async () => {};
  assert.equal((await f.controller().resume()).state, "complete");
  assert.deepEqual(f.calls, []);
});
test("failure to persist confirmation never clears the original draft", async () => {
  const f = fixture();
  await f.controller().prepare(snapshot());
  const write = f.storage.write;
  f.storage.write = async (a) => {
    if (a.state === "confirmed") throw Error("disk full");
    await write(a);
  };
  await assert.rejects(f.controller().resume(), /disk full/);
  assert.equal(f.finished.length, 0);
  assert.equal(f.read().state, "pending");
  f.storage.write = write;
  f.calls.length = 0;
  await f.controller().resume();
  assert.deepEqual(f.calls, ["lookup"]);
});
test("a prior saved version is recognized but newer local edits are preserved", async () => {
  const f = fixture();
  const attempt = await f.controller().prepare(snapshot());
  f.setExisting({ ...row(attempt.command), description: "An earlier version" });
  assert.equal((await f.controller().resume()).preserveDraft, true);
  assert.equal(f.finished[0].preserve, true);
  assert.deepEqual(f.calls, ["lookup"]);
});
test("a confirmed refusal can be edited while retaining the request UUID", async () => {
  const f = fixture();
  const first = await f.controller().prepare(snapshot());
  f.api.submit = async () => {
    throw Error("STORE_CHANGED");
  };
  assert.equal((await f.controller().resume()).state, "rejected");
  const changed = snapshot();
  changed.draft.revision++;
  changed.draft.details.description = "Updated jacket";
  const next = await f.controller().prepare(changed);
  assert.equal(next.command.requestId, first.command.requestId);
  assert.notDeepEqual(next.command.photos, first.command.photos);
  assert.equal(next.command.description, "Updated jacket");
  assert(f.calls.includes("discard"));
});
test("failed unused-photo cleanup prevents overwriting an old intent", async () => {
  const f = fixture();
  await f.controller().prepare(snapshot());
  f.api.submit = async () => {
    throw Error("ACTIVE_REQUEST_LIMIT");
  };
  await f.controller().resume();
  const old = f.read();
  f.api.discardPhoto = async () => {
    throw Error("offline");
  };
  await assert.rejects(f.controller().prepare(snapshot()), /offline/);
  assert.deepEqual(f.read(), old);
});
test("changing the visible form cannot replace an uncertain frozen request", async () => {
  const f = fixture();
  const first = await f.controller().prepare(snapshot());
  const changed = snapshot();
  changed.draft.details.description = "Other";
  assert.deepEqual(await f.controller().prepare(changed), first);
});
test("another account or API project cannot replay the saved journal", async () => {
  const f = fixture();
  const attempt = await f.controller().prepare(snapshot());
  assert.throws(
    () => parseExternalAttempt(attempt, id(99), binding),
    /SUBMISSION_UNAVAILABLE/,
  );
  assert.throws(
    () => parseExternalAttempt(attempt, ownerId, "different project"),
    /SUBMISSION_UNAVAILABLE/,
  );
  f.setSaved({ ...attempt, ownerId: id(99) });
  await assert.rejects(f.controller().resume(), /SUBMISSION_UNAVAILABLE/);
  assert.deepEqual(f.calls, []);
});
test("failed image preparation never creates a server operation or committed journal", async () => {
  const f = fixture();
  f.deps.preparePhoto = async () => {
    throw Error("bad image");
  };
  await assert.rejects(f.controller().prepare(snapshot()), /bad image/);
  assert.equal(f.read(), null);
  assert.deepEqual(f.calls, []);
});
test("concurrent foreground retries do not dispatch the same journal twice", async () => {
  const f = fixture();
  await f.controller().prepare(snapshot());
  let release!: () => void;
  f.api.lookup = () =>
    new Promise((resolve) => {
      release = () => resolve(null);
    });
  const first = f.controller().resume();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await assert.rejects(f.controller().resume(), /BUSY/);
  release();
  await first;
  assert.equal(f.calls.filter((c) => c === "submit").length, 1);
});
test("a completed journal never causes a new dispatch", async () => {
  const f = fixture();
  await f.controller().prepare(snapshot());
  await f.controller().resume();
  f.calls.length = 0;
  await f.controller().resume();
  assert.deepEqual(f.calls, []);
});

test("an interrupted journal backup must be repaired before any network dispatch", async () => {
  const f = fixture();
  await f.controller().prepare(snapshot());
  f.storage.write = async () => {
    throw Error("backup unavailable");
  };
  await assert.rejects(f.controller().resume(), /backup unavailable/);
  assert.deepEqual(f.calls, []);
  assert.equal(f.finished.length, 0);
});

test("a late accepted attempt is reconciled before rejected photos are discarded", async () => {
  const f = fixture();
  const prior = await f.controller().prepare(snapshot());
  f.setSaved({ ...prior, state: "rejected", rejection: "STORE_UNAVAILABLE" });
  f.setExisting(row(prior.command));
  const result = await f.controller().prepare(snapshot());
  assert.equal(result.state, "complete");
  assert.deepEqual(f.calls, ["lookup"]);
});

test("a partial photo snapshot cannot silently submit fewer photos than the reviewed draft", async () => {
  const f = fixture(),
    draft = snapshot();
  draft.draft.photoIds.push(id(5));
  await assert.rejects(f.controller().prepare(draft), /DRAFT_CHANGED/);
  assert.deepEqual(f.calls, []);
});
