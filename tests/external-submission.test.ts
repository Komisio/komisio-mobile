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
import { createExternalRequestApi } from "../src/lib/external-request-http.ts";
const id = (n: number) =>
  `f6200000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const ownerId = id(1),
  binding = "synthetic project and endpoint";

test("fixed-price submission survives a lost HTTP response and remains readable without resending", async () => {
  const f = fixture();
  let persisted: ExternalRequest | null = null;
  let uploads = 0;
  let submissions = 0;
  const api = createExternalRequestApi({
    ownerId,
    endpoint: "https://app.example.invalid/api/mobile/v1/external-items",
    session: async () => ({ user: ownerId, token: "synthetic-token" }),
    request: async (url, init) => {
      const reply = (body: unknown) => ({
        status: 200,
        text: async () => JSON.stringify(body),
      });
      if (url.includes("/photos?")) {
        uploads++;
        return reply({ id: new URL(url).searchParams.get("photoId") });
      }
      const command = JSON.parse(String(init.body));
      if (command.action === "list")
        return reply({
          activeCount: persisted ? 1 : 0,
          activeLimit: 30,
          hasMore: false,
          requests: persisted ? [persisted] : [],
        });
      assert.equal(command.action, "submit");
      submissions++;
      persisted = row(command);
      throw Error("lost HTTP response after commit");
    },
  });
  const controller = createExternalSubmission({ ...f.deps, api });
  const attempt = await controller.prepare(snapshot(), "SE", id(950));
  await assert.rejects(controller.resume(), /lost HTTP response/);
  assert.equal(f.read().state, "pending");
  const restarted = createExternalSubmission({ ...f.deps, api });
  const result = await restarted.resume();
  assert.equal(result.state, "complete");
  assert.equal(result.command.requestId, attempt.command.requestId);
  assert.equal(result.command.staffSelectsMethod, true);
  assert.equal((await api.list()).requests[0].staff_selects_method, true);
  assert.equal(submissions, 1);
  assert.equal(uploads, 1);
  assert.equal(f.finished.length, 1);
  assert.equal(f.finished[0].preserve, false);
  assert.equal(
    (await api.lookup(attempt.command.requestId))?.desired_price_ore,
    "30050",
  );
  assert.equal((await api.list()).requests[0].agreement_version_id, id(950));
});

test("new submissions require an amount and the displayed agreement before preparing uploads", async () => {
  const f = fixture();
  await assert.rejects(
    f.controller().prepare(snapshot(), "SE"),
    /AGREEMENT_REQUIRED/,
  );
  const incomplete = snapshot();
  delete incomplete.draft.details.saleMethod;
  const fresh = fixture();
  assert.equal(
    (await fresh.controller().prepare(incomplete, "SE", id(950))).command
      .staffSelectsMethod,
    true,
  );
  const empty = snapshot();
  empty.draft.details.desiredSellerAmount = "";
  await assert.rejects(f.controller().prepare(empty, "SE", id(950)));
  empty.draft.details.desiredSellerAmount = "299,99";
  await assert.rejects(f.controller().prepare(empty, "SE", id(950)));
  assert.equal(f.calls.length, 0);
  const prepared = await f.controller().prepare(snapshot(), "SE", id(950));
  assert.equal(prepared.command.approvalMode, "fixed");
  assert.equal(prepared.command.agreementVersionId, id(950));
});

test("AI-prepared image bytes are copied to independent submission photo IDs", async () => {
  const f = fixture();
  const jpeg = new Uint8Array([255, 216, 255, 9]);
  const proof = { id: id(970), token: "a".repeat(64) };
  const controller = createExternalSubmission({
    ...f.deps,
    preparePhoto: async () => {
      throw Error("unexpected re-encoding");
    },
    cachedPhotos: async () => [jpeg],
    guestAnalysis: async () => proof,
  });
  const attempt = await controller.prepare(snapshot(), "SE", id(950));
  assert.notEqual(attempt.command.photos[0], snapshot().photos[0].id);
  assert.deepEqual(await f.storage.photo(attempt.command.photos[0]), jpeg);
  assert.deepEqual(attempt.command.guestAnalysis, proof);
  proof.token = "b".repeat(64);
  assert.equal(attempt.command.guestAnalysis?.token, "a".repeat(64));
  await controller.resume();
  assert.equal(f.calls.filter((c) => c === "submit").length, 1);
});
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
        desiredSellerAmount: "300,50",
        saleMethod: "direct_purchase",
      },
    },
    photos: [{ id: id(3), uri: "file:///private/original.image" }],
  };
}
const row = (c: ExternalItemCommand): ExternalRequest => ({
  approval_mode: c.approvalMode ?? "offer",
  staff_selects_method: c.staffSelectsMethod,
  sale_method: c.saleMethod,
  agreement_version_id: c.agreementVersionId,
  sender_country: c.senderCountry ?? null,
  id: c.requestId,
  tenant_id: c.tenantId,
  store_name: "Synthetic store",
  description: c.description,
  brand: c.brand,
  condition: c.condition,
  notes: c.notes,
  desired_price_ore: c.desiredPriceOre,
  price_basis: c.priceBasis ?? "resale",
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
    recipient: async () => ({ id: id(4), currency: "SEK" }),
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
  const result = f.controller().prepare(draft, "SE", id(950));
  draft.draft.details.description = "Changed while preparing";
  const prepared = await result;
  assert.equal(prepared.command.description, "Jacket");
  assert.equal(prepared.command.desiredPriceOre, "30050");
  assert.equal(prepared.state, "pending");
  assert.deepEqual(f.calls, []);
  assert.equal(f.bytes.size, 1);
});
test("a lost submission response reconciles the original ID without uploading or sending again", async () => {
  const f = fixture(),
    controller = f.controller();
  const attempt = await controller.prepare(snapshot(), "SE", id(950));
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
  await f.controller().prepare(snapshot(), "SE", id(950));
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
  await f.controller().prepare(snapshot(), "SE", id(950));
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
  const attempt = await f.controller().prepare(snapshot(), "SE", id(950));
  f.setExisting({ ...row(attempt.command), description: "An earlier version" });
  assert.equal((await f.controller().resume()).preserveDraft, true);
  assert.equal(f.finished[0].preserve, true);
  assert.deepEqual(f.calls, ["lookup"]);
});
test("a confirmed refusal can be edited while retaining the request UUID", async () => {
  const f = fixture();
  const first = await f.controller().prepare(snapshot(), "SE", id(950));
  f.api.submit = async () => {
    throw Error("STORE_CHANGED");
  };
  assert.equal((await f.controller().resume()).state, "rejected");
  const changed = snapshot();
  changed.draft.revision++;
  changed.draft.details.description = "Updated jacket";
  const next = await f.controller().prepare(changed, "SE", id(950));
  assert.equal(next.command.requestId, first.command.requestId);
  assert.notDeepEqual(next.command.photos, first.command.photos);
  assert.equal(next.command.description, "Updated jacket");
  assert(f.calls.includes("discard"));
});
test("failed unused-photo cleanup prevents overwriting an old intent", async () => {
  const f = fixture();
  await f.controller().prepare(snapshot(), "SE", id(950));
  f.api.submit = async () => {
    throw Error("ACTIVE_REQUEST_LIMIT");
  };
  await f.controller().resume();
  const old = f.read();
  f.api.discardPhoto = async () => {
    throw Error("offline");
  };
  await assert.rejects(
    f.controller().prepare(snapshot(), "SE", id(950)),
    /offline/,
  );
  assert.deepEqual(f.read(), old);
});
test("changing the visible form cannot replace an uncertain frozen request", async () => {
  const f = fixture();
  const first = await f.controller().prepare(snapshot(), "SE", id(950));
  const changed = snapshot();
  changed.draft.details.description = "Other";
  assert.deepEqual(await f.controller().prepare(changed, "SE", id(950)), first);
});
test("another account or API project cannot replay the saved journal", async () => {
  const f = fixture();
  const attempt = await f.controller().prepare(snapshot(), "SE", id(950));
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
  await assert.rejects(
    f.controller().prepare(snapshot(), "SE", id(950)),
    /bad image/,
  );
  assert.equal(f.read(), null);
  assert.deepEqual(f.calls, []);
});
test("concurrent foreground retries do not dispatch the same journal twice", async () => {
  const f = fixture();
  await f.controller().prepare(snapshot(), "SE", id(950));
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
  await f.controller().prepare(snapshot(), "SE", id(950));
  await f.controller().resume();
  f.calls.length = 0;
  await f.controller().resume();
  assert.deepEqual(f.calls, []);
});

test("an interrupted journal backup must be repaired before any network dispatch", async () => {
  const f = fixture();
  await f.controller().prepare(snapshot(), "SE", id(950));
  f.storage.write = async () => {
    throw Error("backup unavailable");
  };
  await assert.rejects(f.controller().resume(), /backup unavailable/);
  assert.deepEqual(f.calls, []);
  assert.equal(f.finished.length, 0);
});

test("a late accepted attempt is reconciled before rejected photos are discarded", async () => {
  const f = fixture();
  const prior = await f.controller().prepare(snapshot(), "SE", id(950));
  f.setSaved({ ...prior, state: "rejected", rejection: "STORE_UNAVAILABLE" });
  f.setExisting(row(prior.command));
  const result = await f.controller().prepare(snapshot(), "SE", id(950));
  assert.equal(result.state, "complete");
  assert.deepEqual(f.calls, ["lookup"]);
});

test("a partial photo snapshot cannot silently submit fewer photos than the reviewed draft", async () => {
  const f = fixture(),
    draft = snapshot();
  draft.draft.photoIds.push(id(5));
  await assert.rejects(
    f.controller().prepare(draft, "SE", id(950)),
    /DRAFT_CHANGED/,
  );
  assert.deepEqual(f.calls, []);
});

test("a new submission requires explicit Swedish residence, without preparing or sending photos", async () => {
  const f = fixture();
  await assert.rejects(f.controller().prepare(snapshot()), /SWEDEN_REQUIRED/);
  assert.equal(f.bytes.size, 0);
  assert.deepEqual(f.calls, []);
});
test("a stale recipient cannot be silently replaced when preparing a submission", async () => {
  const f = fixture();
  f.deps.recipient = async () => ({ id: id(99), currency: "SEK" });
  await assert.rejects(
    f.controller().prepare(snapshot(), "SE", id(950)),
    /STORE_CHANGED/,
  );
  assert.equal(f.bytes.size, 0);
  assert.deepEqual(f.calls, []);
});
test("an accepted legacy attempt reconciles without inventing a residence declaration", async () => {
  const f = fixture();
  const attempt = await f.controller().prepare(snapshot(), "SE", id(950));
  delete attempt.command.senderCountry;
  f.setSaved(attempt);
  f.setExisting(row(attempt.command));
  const result = await f.controller().resume();
  assert.equal(result.state, "complete");
  assert.equal(result.command.senderCountry, undefined);
  assert.deepEqual(f.calls, ["lookup"]);
});
test("an unsubmitted legacy attempt is held for country confirmation without uploading", async () => {
  const f = fixture();
  const attempt = await f.controller().prepare(snapshot(), "SE", id(950));
  delete attempt.command.senderCountry;
  f.setSaved(attempt);
  const result = await f.controller().resume();
  assert.equal(result.state, "rejected");
  assert.equal(result.rejection, "SWEDEN_REQUIRED");
  assert.deepEqual(f.calls, ["lookup"]);
});
