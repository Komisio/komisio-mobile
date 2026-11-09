import assert from "node:assert/strict";
import test from "node:test";
import { compilePreview } from "./helpers/compile-preview.ts";
import * as domain from "../src/lib/photo-draft.ts";

const root = "file:///documents/komisio-external-photo-draft-v1/";
const primary = `${root}manifest.json`;
const backup = `${root}manifest.backup.json`;
type Entry = { text: string; size: number; reportedSize?: number | null };

function fixture() {
  const files = new Map<string, Entry>();
  const failures = {
    move: false,
    backup: false,
    delete: false,
    sourceCopy: false,
  };
  let sequence = 0;
  function uri(parts: (string | { uri: string })[]) {
    return parts
      .map((p, i) =>
        (typeof p === "string" ? p : p.uri).replace(
          i === 0 ? /\/$/ : /^\/|\/$/g,
          "",
        ),
      )
      .join("/");
  }
  class File {
    uri: string;
    constructor(...parts: (string | { uri: string })[]) {
      this.uri = uri(parts);
    }
    get name() {
      return this.uri.split("/").at(-1)!;
    }
    get exists() {
      return files.has(this.uri);
    }
    get size() {
      const e = files.get(this.uri);
      return e && "reportedSize" in e ? e.reportedSize : (e?.size ?? 0);
    }
    async text() {
      const e = files.get(this.uri);
      if (!e) throw new Error("missing file");
      return e.text;
    }
    create() {
      files.set(this.uri, { text: "", size: 0 });
    }
    async write(text: string) {
      files.set(this.uri, { text, size: text.length });
    }
    async copy(destination: File) {
      if (destination.uri === backup && failures.backup)
        throw new Error("backup failed");
      if (this.uri.startsWith("content:") && failures.sourceCopy)
        throw new Error("provider unavailable");
      const e = files.get(this.uri);
      if (!e) throw new Error("missing file");
      files.set(destination.uri, { text: e.text, size: e.size });
    }
    async move(destination: File) {
      if (failures.move) {
        files.delete(destination.uri);
        throw new Error("interrupted move");
      }
      await this.copy(destination);
      files.delete(this.uri);
      this.uri = destination.uri;
    }
    delete() {
      if (failures.delete) throw new Error("delete failed");
      files.delete(this.uri);
    }
  }
  class Directory {
    uri: string;
    constructor(...parts: (string | { uri: string })[]) {
      this.uri = uri(parts);
    }
    create() {}
    list() {
      return [...files.keys()]
        .filter((p) => p.startsWith(`${this.uri}/`))
        .map((p) => new File(p));
    }
  }
  const storage = compilePreview("lib/photo-draft-storage.native.ts", {
    "./photo-draft": domain,
    "expo-crypto": {
      randomUUID: () =>
        `00000000-0000-4000-8000-${String(++sequence).padStart(12, "0")}`,
    },
    "expo-file-system": {
      File,
      Directory,
      Paths: {
        document: { uri: "file:///documents" },
        cache: { uri: "file:///cache/" },
      },
    },
  });
  function source(
    path = "file:///cache/ImagePicker/source.jpg",
    size = 100,
    reportedSize?: number | null,
  ) {
    files.set(path, {
      text: "photo",
      size,
      ...(reportedSize !== undefined ? { reportedSize } : {}),
    });
    return { uri: path };
  }
  return {
    files,
    failures,
    source,
    repo: async () =>
      storage.photoDraftRepository() as Promise<domain.PhotoDraftRepository>,
  };
}

test("native adapter falls back from missing/corrupt primary only to a complete valid backup", async () => {
  const f = fixture(),
    repo = await f.repo();
  const saved = await repo.add([f.source()]);
  for (const broken of [
    undefined,
    "{broken",
    JSON.stringify({ version: 9, photoIds: [] }),
  ]) {
    if (broken === undefined) f.files.delete(primary);
    else f.files.set(primary, { text: broken, size: broken.length });
    assert.deepEqual(await repo.read(), saved);
  }
  const oldId = saved[0].id;
  f.files.delete(`${root}${oldId}.image`);
  await assert.rejects(repo.read(), /DRAFT_UNAVAILABLE/);
});
test("backup mirrors committed removals and clear, and remains recoverable after an interrupted replacement", async () => {
  const f = fixture(),
    repo = await f.repo();
  const saved = await repo.add([f.source()]);
  f.failures.move = true;
  const next = f.source("file:///cache/ImagePicker/next.jpg");
  await assert.rejects(repo.add([next]), /interrupted move/);
  assert.deepEqual(await repo.read(), saved);
  assert.ok(
    f.files.has(next.uri),
    "failed commit retains picker cache for recovery",
  );
  f.failures.move = false;
  await repo.remove(saved[0].id);
  f.files.set(primary, { text: "{broken", size: 7 });
  assert.deepEqual(await repo.read(), []);
  await repo.add([f.source()]);
  await repo.clear();
  f.files.delete(primary);
  assert.deepEqual(await repo.read(), []);
  assert.equal(
    [...f.files.keys()].filter((p) => p.endsWith(".image")).length,
    0,
  );
});
test("unknown content-provider size is checked after copy; invalid copies never replace the draft", async () => {
  const f = fixture(),
    repo = await f.repo();
  const source = f.source("content://photos/one", 100, null);
  const saved = await repo.add([source]);
  assert.equal(saved.length, 1);
  assert.ok(f.files.has(source.uri), "never delete content-provider originals");
  for (const size of [0, domain.MAX_PHOTO_BYTES + 1]) {
    await assert.rejects(
      repo.add([f.source("content://photos/bad", size, null)]),
      /PHOTO_INVALID/,
    );
    assert.deepEqual(await repo.read(), saved);
  }
  f.failures.sourceCopy = true;
  await assert.rejects(repo.add([source]), /provider unavailable/);
  assert.deepEqual(await repo.read(), saved);
});
test("only committed app-cache sources are released; originals and traversal paths are retained", async () => {
  const f = fixture(),
    repo = await f.repo();
  const cached = f.source();
  const original = f.source("file:///library/original.jpg");
  const traversal = f.source("file:///cache/../library/private.jpg");
  const sibling = f.source("file:///cache-other/photo.jpg");
  await repo.add([cached, original, traversal, sibling]);
  assert.ok(!f.files.has(cached.uri));
  for (const kept of [original, traversal, sibling])
    assert.ok(f.files.has(kept.uri));
  f.failures.delete = true;
  assert.equal(
    (await repo.add([f.source()])).length,
    5,
    "cache cleanup cannot roll back a committed edit",
  );
});
test("corrupt primary never overwrites valid backup when replacement fails", async () => {
  const f = fixture(),
    repo = await f.repo();
  const saved = await repo.add([f.source()]);
  const goodBackup = f.files.get(backup)!.text;
  f.files.set(primary, { text: "corrupt", size: 7 });
  f.failures.move = true;
  await assert.rejects(repo.add([f.source()]), /interrupted move/);
  assert.equal(f.files.get(backup)!.text, goodBackup);
  assert.deepEqual(await repo.read(), saved);
});
