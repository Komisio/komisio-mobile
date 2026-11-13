import test from "node:test";
import assert from "node:assert/strict";
import { createPhotoCapture as createController } from "../src/lib/photo-capture.ts";
import {
  PhotoDraftRepository,
  type PhotoDraftStorage,
  type DraftPhoto,
  type PhotoInput,
} from "../src/lib/photo-draft.ts";

function createPhotoCapture(
  deps: {
    repository(): Promise<PhotoDraftRepository>;
    capture(): Promise<PhotoInput>;
    saved(photos: DraftPhoto[]): void;
  },
  photos: DraftPhoto[],
) {
  const controller = createController(deps, photos);
  return {
    ...controller,
    take: () => controller.take(deps.capture, deps.saved),
  };
}

function fixture() {
  let manifest: unknown = null,
    sequence = 0,
    shots = 0,
    failSave = false;
  const storage: PhotoDraftStorage = {
    async read() {
      return manifest;
    },
    async write(value) {
      if (failSave) throw new Error("disk full");
      manifest = value;
    },
    async importPhoto() {},
    async uri(id) {
      return `file:///${id}`;
    },
    async cleanup() {},
  };
  const repo = new PhotoDraftRepository(
    storage,
    () => `00000000-0000-4000-8000-${String(++sequence).padStart(12, "0")}`,
  );
  const capture = createPhotoCapture(
    {
      repository: async () => repo,
      capture: async () => {
        shots++;
        return { uri: "file:///shot.jpg" };
      },
      saved() {},
    },
    [],
  );
  return {
    repo,
    capture,
    shots: () => shots,
    fail: (value: boolean) => {
      failSave = value;
    },
  };
}
test("consecutive shots commit individually and stop before taking a ninth", async () => {
  const f = fixture();
  for (let i = 1; i <= 8; i++) {
    await f.capture.take();
    assert.equal((await f.repo.snapshot()).photos.length, i);
  }
  await f.capture.take();
  assert.equal(f.shots(), 8);
  assert.equal(f.capture.getState().error, "PHOTO_LIMIT");
});
test("rapid shutter presses cannot start concurrent captures", async () => {
  const f = fixture();
  await Promise.all([f.capture.take(), f.capture.take(), f.capture.take()]);
  assert.equal(f.shots(), 1);
  assert.equal(f.capture.getState().photos.length, 1);
});
test("a failed save retains that shot and retries saving without another capture", async () => {
  const f = fixture();
  await f.capture.take();
  f.fail(true);
  await f.capture.take();
  assert.equal(f.capture.getState().retrySave, true);
  assert.equal((await f.repo.snapshot()).photos.length, 1);
  f.fail(false);
  await f.capture.take();
  assert.equal(f.shots(), 2);
  assert.equal((await f.repo.snapshot()).photos.length, 2);
  assert.equal(f.capture.getState().retrySave, false);
});
test("closing during native capture does not append the late photo", async () => {
  const f = fixture();
  let release!: (value: { uri: string }) => void;
  let entered!: () => void;
  const started = new Promise<void>((resolve) => {
    entered = resolve;
  });
  const capture = createPhotoCapture(
    {
      repository: async () => f.repo,
      capture: () => {
        entered();
        return new Promise((resolve) => {
          release = resolve;
        });
      },
      saved() {
        assert.fail("closed capture updated UI");
      },
    },
    [],
  );
  const work = capture.take();
  await started;
  capture.close();
  release({ uri: "file:///late.jpg" });
  await work;
  assert.equal((await f.repo.snapshot()).photos.length, 0);
});
test("capture failure retains saved photos and allows the next attempt", async () => {
  const f = fixture();
  await f.capture.take();
  let fail = true;
  const capture = createPhotoCapture(
    {
      repository: async () => f.repo,
      capture: async () => {
        if (fail) throw new Error("CAMERA_FAILED");
        return { uri: "file:///next.jpg" };
      },
      saved() {},
    },
    f.capture.getState().photos,
  );
  await capture.take();
  assert.equal(capture.getState().photos.length, 1);
  assert.equal(capture.getState().retrySave, false);
  fail = false;
  await capture.take();
  assert.equal(capture.getState().photos.length, 2);
});

test("reopening does not allow a late capture from the previous session to overwrite photos", async () => {
  const f = fixture();
  let release!: (value: PhotoInput) => void;
  let entered!: () => void;
  const started = new Promise<void>((resolve) => {
    entered = resolve;
  });
  const capture = createController({ repository: async () => f.repo }, []);
  const old = capture.take(
    () => {
      entered();
      return new Promise((resolve) => {
        release = resolve;
      });
    },
    () => assert.fail("old capture updated the reopened camera"),
  );
  await started;
  capture.close();
  capture.open();
  await capture.take(
    async () => ({ uri: "file:///current.jpg" }),
    () => {},
  );
  const saved = await f.repo.snapshot();
  release({ uri: "file:///old.jpg" });
  await old;
  assert.deepEqual(await f.repo.snapshot(), saved);
  assert.equal(capture.getState().photos.length, 1);
  assert.equal(capture.getState().busy, false);
});
