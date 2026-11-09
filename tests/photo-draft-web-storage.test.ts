import assert from "node:assert/strict";
import test from "node:test";
import { compilePreview } from "./helpers/compile-preview.ts";
import * as domain from "../src/lib/photo-draft.ts";

// IDB event/transaction boundary fake. Actual IndexedDB is also exercised in browser QA.
function fixture() {
  let data = new Map<IDBValidKey, unknown>();
  let sequence = 0,
    locks = 0;
  const failures = { abortManifest: false, open: false };
  const revoked: string[] = [];
  const db = {
    createObjectStore(name: string) {
      assert.equal(name, "draft");
    },
    transaction(name: string) {
      assert.equal(name, "draft");
      const next = new Map(data);
      const transaction: any = {};
      let abort = false;
      const request = (value: unknown) => {
        const result = { result: value };
        queueMicrotask(() => {
          if (abort) transaction.onabort?.();
          else {
            data = next;
            transaction.oncomplete?.();
          }
        });
        return result;
      };
      transaction.objectStore = () => ({
        get(key: IDBValidKey) {
          return request(next.get(key));
        },
        getAllKeys() {
          return request([...next.keys()]);
        },
        put(value: unknown, key: IDBValidKey) {
          if (key === "manifest" && failures.abortManifest) abort = true;
          next.set(key, structuredClone(value));
          return request(key);
        },
        delete(key: IDBValidKey) {
          next.delete(key);
          return request(undefined);
        },
      });
      return transaction;
    },
  };
  const indexedDB = {
    open(name: string, version: number) {
      assert.equal(name, "komisio-external-photo-draft-v1");
      assert.equal(version, 1);
      const open: any = { result: db };
      queueMicrotask(() => {
        if (failures.open) open.onerror?.();
        else {
          open.onupgradeneeded?.();
          open.onsuccess?.();
        }
      });
      return open;
    },
  };
  const storage = compilePreview(
    "lib/photo-draft-storage.ts",
    {
      "./photo-draft": domain,
      "expo-crypto": {
        randomUUID: () =>
          `00000000-0000-4000-8000-${String(++sequence).padStart(12, "0")}`,
      },
    },
    {
      indexedDB,
      navigator: {
        locks: {
          request: async (name: string, work: () => unknown) => {
            assert.equal(name, "komisio-external-photo-draft-v1");
            locks++;
            return work();
          },
        },
      },
      URL: {
        createObjectURL: (blob: Blob) => {
          assert.ok(blob instanceof Blob);
          return `blob:test/${sequence}`;
        },
        revokeObjectURL: (url: string) => revoked.push(url),
      },
    },
  );
  return {
    repo: async () =>
      storage.photoDraftRepository() as Promise<domain.PhotoDraftRepository>,
    failures,
    revoked,
    keys: () => [...data.keys()],
    locks: () => locks,
  };
}
const input = () => ({
  uri: "blob:picker",
  file: new Blob(["photo"], { type: "image/png" }),
});

test("web adapter waits for IDB commit, preserves the draft on abort and revokes removed blob URLs", async () => {
  const f = fixture(),
    repo = await f.repo();
  const saved = await repo.add([input()]);
  f.failures.abortManifest = true;
  await assert.rejects(repo.add([input()]), /DRAFT_UNAVAILABLE/);
  assert.deepEqual(await repo.read(), saved);
  assert.equal(
    f.keys().length,
    2,
    "aborted image is cleaned; manifest and saved blob remain",
  );
  f.failures.abortManifest = false;
  await repo.clear();
  assert.deepEqual(f.keys(), ["manifest"]);
  assert.ok(f.revoked.includes(saved[0].uri));
  assert.ok(f.locks() >= 4);
});
test("web adapter retries failed database opens and rejects invalid blobs without saving", async () => {
  const f = fixture();
  f.failures.open = true;
  await assert.rejects(f.repo(), /DRAFT_UNAVAILABLE/);
  f.failures.open = false;
  const repo = await f.repo();
  for (const file of [
    undefined,
    new Blob([]),
    new Blob(["not an image"], { type: "text/plain" }),
  ])
    await assert.rejects(
      repo.add([{ uri: "blob:picker", file }]),
      /PHOTO_INVALID/,
    );
  assert.deepEqual(await repo.read(), []);
});
