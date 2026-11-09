import assert from "node:assert/strict";
import test from "node:test";
import { compilePreview } from "./helpers/compile-preview.ts";

function fixture(failure?: string, pickerFailure = false) {
  let saved = [{ id: "saved", uri: "file:///saved" }];
  let recovered = 0,
    added = 0;
  let clearFails = false;
  const runtime = compilePreview("lib/photo-draft-runtime.ts", {
    "./photo-draft-storage": {
      photoDraftRepository: async () => ({
        read: async () => saved,
        add: async () => {
          added++;
          if (failure) throw new Error(failure);
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
        if (pickerFailure) throw new Error("picker failed");
        return [{ uri: "file:///pending" }];
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
  };
}

test("failed Android recovery is surfaced once and Retry reopens the saved draft", async () => {
  for (const reason of ["PHOTO_LIMIT", "PHOTO_INVALID", "disk full"]) {
    const f = fixture(reason);
    await assert.rejects(f.runtime.readDraftPhotos(), new RegExp(reason));
    assert.equal(await f.runtime.readDraftPhotos(), f.saved);
    assert.equal(await f.runtime.readDraftPhotos(), f.saved);
    assert.deepEqual(f.counts(), { recovered: 1, added: 1 });
  }
});
test("native pending-result errors cannot prevent access to the existing draft", async () => {
  const f = fixture(undefined, true);
  await assert.rejects(f.runtime.readDraftPhotos(), /picker failed/);
  assert.equal(await f.runtime.readDraftPhotos(), f.saved);
  assert.deepEqual(f.counts(), { recovered: 1, added: 0 });
});
test("concurrent mounts recover once; failed clear preserves the draft and successful clear cannot replay pending photos", async () => {
  const f = fixture();
  await Promise.all([f.runtime.readDraftPhotos(), f.runtime.readDraftPhotos()]);
  assert.deepEqual(f.counts(), { recovered: 1, added: 1 });
  await f.runtime.clearDraftPhotos();
  await f.runtime.readDraftPhotos();
  assert.deepEqual(f.counts(), { recovered: 1, added: 1 });
  f.failClear();
  await assert.rejects(f.runtime.clearDraftPhotos(), /disk full/);
  assert.equal(await f.runtime.readDraftPhotos(), f.saved);
});
