import assert from "node:assert/strict";
import test from "node:test";
import { compilePreview } from "./helpers/compile-preview.ts";
import type { PhotoInput } from "../src/lib/photo-draft.ts";

function fixture(failure?: string, pickerFailure = false) {
  let saved = [{ id: "saved", uri: "file:///saved" }];
  let pending: PhotoInput[] | Error = pickerFailure
    ? new Error("picker failed")
    : [{ uri: "file:///pending" }];
  let recovered = 0,
    added = 0;
  let clearFails = false;
  let wait: { started: () => void; release: Promise<void> } | undefined;
  const runtime = compilePreview("lib/photo-draft-runtime.ts", {
    "./photo-draft-storage": {
      photoDraftRepository: async () => ({
        read: async () => saved,
        add: async (photos: PhotoInput[]) => {
          added++;
          if (failure) throw new Error(failure);
          saved = [...saved, ...photos.map((p) => ({ id: p.uri, uri: p.uri }))];
          return saved;
        },
        clear: async () => {
          if (clearFails) throw new Error("disk full");
          saved = [];
          return saved;
        },
      }),
    },
    "./photo-draft-picker": {
      recoverDraftPhotos: async () => {
        recovered++;
        // Expo consumes its native pending result before reading image extras.
        const result = pending;
        pending = [];
        const gate = wait;
        wait = undefined;
        if (gate) {
          gate.started();
          await gate.release;
        }
        if (result instanceof Error) throw result;
        return result;
      },
    },
  });
  return {
    runtime,
    get saved() {
      return saved;
    },
    counts: () => ({ recovered, added }),
    failClear: () => {
      clearFails = true;
    },
    setPending: (next: PhotoInput[]) => {
      pending = next;
    },
    pauseRecovery: () => {
      let start!: () => void;
      let release!: () => void;
      const started = new Promise<void>((resolve) => {
        start = resolve;
      });
      const released = new Promise<void>((resolve) => {
        release = resolve;
      });
      wait = { started: start, release: released };
      return { started, release };
    },
  };
}

test("failed Android recovery is surfaced once and Retry reopens the saved draft", async () => {
  for (const reason of ["PHOTO_LIMIT", "PHOTO_INVALID", "disk full"]) {
    const f = fixture(reason);
    await assert.rejects(f.runtime.readDraftPhotos(), new RegExp(reason));
    assert.equal(await f.runtime.readDraftPhotos(), f.saved);
    assert.equal(await f.runtime.readDraftPhotos(), f.saved);
    assert.equal(f.counts().added, 1);
  }
});
test("consumed native result errors do not prevent reopening the existing draft", async () => {
  const f = fixture(undefined, true);
  await assert.rejects(f.runtime.readDraftPhotos(), /picker failed/);
  assert.equal(await f.runtime.readDraftPhotos(), f.saved);
  assert.equal(f.counts().added, 0);
});
test("concurrent mounts import each pending result once", async () => {
  const f = fixture();
  await Promise.all([f.runtime.readDraftPhotos(), f.runtime.readDraftPhotos()]);
  assert.equal(f.counts().added, 1);
  assert.equal(f.saved.length, 2);
});
test("a later native result is recovered after an earlier empty read", async () => {
  const f = fixture();
  f.setPending([]);
  await f.runtime.readDraftPhotos();
  f.setPending([{ uri: "file:///later-camera-photo" }]);
  await f.runtime.readDraftPhotos();
  assert.ok(
    f.saved.some((photo) => photo.uri === "file:///later-camera-photo"),
  );
  assert.equal(f.counts().added, 1);
});
test("a later native result is recovered after the previous draft was cleared", async () => {
  const f = fixture();
  await f.runtime.readDraftPhotos();
  await f.runtime.clearDraftPhotos();
  f.setPending([{ uri: "file:///next-item-photo" }]);
  assert.deepEqual(await f.runtime.readDraftPhotos(), [
    { id: "file:///next-item-photo", uri: "file:///next-item-photo" },
  ]);
});
test("clear waits for in-flight recovery; delayed photos cannot resurrect the cleared draft", async () => {
  const f = fixture();
  const gate = f.pauseRecovery();
  const read = f.runtime.readDraftPhotos();
  await gate.started;
  const clear = f.runtime.clearDraftPhotos();
  const afterClear = f.runtime.readDraftPhotos();
  gate.release();
  await Promise.all([read, clear]);
  assert.deepEqual(await afterClear, []);
  assert.deepEqual(f.saved, []);
});
test("successful clear discards an unread native result without importing it", async () => {
  const f = fixture();
  await f.runtime.clearDraftPhotos();
  assert.deepEqual(await f.runtime.readDraftPhotos(), []);
  assert.equal(f.counts().added, 0);
});
test("failed clear preserves saved photos and leaves an unread native result recoverable", async () => {
  const f = fixture();
  f.failClear();
  await assert.rejects(f.runtime.clearDraftPhotos(), /disk full/);
  assert.equal(f.saved.length, 1);
  await f.runtime.readDraftPhotos();
  assert.equal(f.saved.length, 2);
});
