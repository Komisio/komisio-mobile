import assert from "node:assert/strict";
import test from "node:test";
import {
  PhotoDraftRepository,
  MAX_DRAFT_PHOTOS,
  MAX_PHOTO_BYTES,
  parsePhotoDraft,
  type PhotoDraft,
  type PhotoDraftStorage,
} from "../src/lib/photo-draft.ts";
import { canPreviewExternalIntake } from "../src/lib/external-intake-preview.ts";
import { pickedDraftPhotos } from "../src/lib/photo-draft-picker-result.ts";
import { photoDraftCopy } from "../src/lib/photo-draft-copy.ts";
import { locales } from "../src/lib/locale.ts";

function fixture() {
  let value: unknown = null;
  let sequence = 0;
  const files = new Set<string>();
  const failures = { write: false, copy: false, cleanup: false };
  const storage: PhotoDraftStorage = {
    async read() {
      return structuredClone(value);
    },
    async write(draft) {
      if (failures.write) throw new Error("disk full");
      value = structuredClone(draft);
    },
    async importPhoto(id) {
      files.add(id);
      if (failures.copy) throw new Error("copy failed");
    },
    async uri(id) {
      if (!files.has(id)) throw new Error("missing photo");
      return `file:///private/${id}`;
    },
    async cleanup(keep) {
      if (failures.cleanup) throw new Error("delete failed");
      for (const id of files) if (!keep.includes(id)) files.delete(id);
    },
  };
  const repo = new PhotoDraftRepository(
    storage,
    () => `00000000-0000-4000-8000-${String(++sequence).padStart(12, "0")}`,
  );
  return {
    repo,
    storage,
    failures,
    files,
    set: (draft: unknown) => {
      value = draft;
    },
  };
}
const input = () => ({ uri: "file:///camera/photo.jpg", fileSize: 100 });

test("preview requires development and explicit opt-in, even for direct links", () => {
  for (const flag of [undefined, "", "false", "true"])
    assert.equal(canPreviewExternalIntake(false, flag), false);
  assert.equal(canPreviewExternalIntake(true), false);
  assert.equal(canPreviewExternalIntake(true, "true"), true);
});
test("picker cancellation, non-images and interrupted Android results are handled explicitly", () => {
  assert.deepEqual(pickedDraftPhotos(null), []);
  assert.deepEqual(pickedDraftPhotos({ canceled: true, assets: null }), []);
  assert.throws(
    () =>
      pickedDraftPhotos({
        code: "picker_failed",
        message: "private native detail",
      }),
    /PHOTO_INVALID/,
  );
  assert.throws(
    () =>
      pickedDraftPhotos({
        canceled: false,
        assets: [{ uri: "file:///clip", width: 20, height: 20, type: "video" }],
      }),
    /PHOTO_INVALID/,
  );
  const photo = {
    uri: "file:///photo",
    width: 20,
    height: 20,
    type: "image" as const,
    fileSize: 100,
  };
  assert.equal(
    pickedDraftPhotos({ canceled: false, assets: [photo] })[0].uri,
    photo.uri,
  );
});
test("all app languages explain the local draft and preserve photo counters", () => {
  const keys = Object.keys(photoDraftCopy("sv"));
  for (const locale of locales) {
    const copy = photoDraftCopy(locale);
    assert.deepEqual(Object.keys(copy), keys);
    assert.ok(Object.values(copy).every((value) => value.length > 0));
    assert.match(copy.count, /\{count\}/);
    assert.match(copy.remove, /\{count\}/);
    assert.equal(copy.photo.replace("{count}", "3").includes("3"), true);
    assert.ok(copy.count.includes(String(MAX_DRAFT_PHOTOS)));
    assert.ok(copy.limit.includes(String(MAX_DRAFT_PHOTOS)));
    assert.ok(copy.invalid.includes(String(MAX_PHOTO_BYTES / 1024 / 1024)));
    assert.doesNotMatch(JSON.stringify(copy), /\{maxPhotos\}|\{maxMB\}/);
  }
});
test("draft accepts 1–8 photos, appends in order and reopens persisted files", async () => {
  const { repo } = fixture();
  assert.deepEqual(await repo.read(), []);
  const first = await repo.add([input(), input()]);
  const all = await repo.add(Array.from({ length: 6 }, input));
  assert.deepEqual(all.slice(0, 2), first);
  assert.deepEqual(await repo.read(), all);
  await assert.rejects(repo.add([input()]), /PHOTO_LIMIT/);
  assert.deepEqual(await repo.read(), all);
  assert.equal((await repo.remove(first[0].id)).length, 7);
  assert.equal((await repo.add([input()])).length, 8);
});
test("cancel and concurrent selections preserve existing photos and the eight-photo limit", async () => {
  const { repo } = fixture();
  const existing = await repo.add(Array.from({ length: 7 }, input));
  assert.deepEqual(await repo.add([]), existing);
  const results = await Promise.allSettled([
    repo.add([input()]),
    repo.add([input()]),
  ]);
  assert.deepEqual(
    results.map((r) => r.status),
    ["fulfilled", "rejected"],
  );
  assert.equal((await repo.read()).length, 8);
});
test("copy and manifest-write failures preserve the saved draft and allow retry", async () => {
  const { repo, failures, files } = fixture();
  const saved = await repo.add([input()]);
  for (const failure of ["copy", "write"] as const) {
    failures[failure] = true;
    await assert.rejects(repo.add([input()]));
    assert.deepEqual(await repo.read(), saved);
    assert.equal(files.size, 1);
    failures[failure] = false;
  }
  assert.equal((await repo.add([input()])).length, 2);
});
test("failed removal or reset retains saved files; cleanup failure cannot undo a committed change", async () => {
  const { repo, failures, files } = fixture();
  const saved = await repo.add([input()]);
  failures.write = true;
  await assert.rejects(repo.remove(saved[0].id));
  await assert.rejects(repo.clear());
  assert.deepEqual(await repo.read(), saved);
  failures.write = false;
  failures.cleanup = true;
  assert.deepEqual(await repo.clear(), []);
  assert.equal(files.size, 1);
  failures.cleanup = false;
  await repo.clear();
  assert.equal(files.size, 0);
});
test("corrupt manifests and missing files are errors, not empty drafts to overwrite", async () => {
  const { repo, set, files } = fixture();
  for (const value of [
    { version: 2, photoIds: [] },
    { version: 1, photoIds: ["../../auth"] },
  ]) {
    set(value);
    await assert.rejects(repo.read(), /DRAFT_UNAVAILABLE/);
    await assert.rejects(repo.add([input()]), /DRAFT_UNAVAILABLE/);
  }
  await repo.clear();
  await repo.add([input()]);
  files.clear();
  await assert.rejects(repo.read(), /missing photo/);
  await repo.clear();
  assert.deepEqual(await repo.read(), []);
});
test("invalid and oversized images leave the draft unchanged", async () => {
  const { repo } = fixture();
  for (const fileSize of [0, -1, NaN, Infinity, 26 * 1024 * 1024])
    await assert.rejects(
      repo.add([{ uri: "file:///photo", fileSize }]),
      /PHOTO_INVALID/,
    );
  assert.deepEqual(await repo.read(), []);
  const id = "00000000-0000-4000-8000-000000000001";
  assert.throws(() =>
    parsePhotoDraft({ version: 1, photoIds: [id, id] } as PhotoDraft),
  );
});
