import assert from "node:assert/strict";
import test from "node:test";
import { compilePreview } from "./helpers/compile-preview.ts";

function fixture() {
  const qualities: number[] = [],
    removed: string[] = [],
    files = new Map<string, number>();
  let decode: any;
  const image = {
    width: 1024,
    height: 768,
    release() {},
    saveAsync: async ({ compress }: { compress: number }) => {
      qualities.push(compress);
      const uri = `file:///cache/copy-${qualities.length}.jpg`;
      files.set(uri, compress === 0.8 ? 400000 : 180000);
      return { uri };
    },
  };
  const mod = compilePreview("lib/external-image.native.ts", {
    "expo-image-manipulator": {
      SaveFormat: { JPEG: "jpeg" },
      ImageManipulator: {
        manipulate: (_uri: string, options: any) => {
          decode = options;
          return { renderAsync: async () => image, resize() {}, release() {} };
        },
      },
    },
    "expo-file-system": {
      Paths: { cache: { uri: "file:///cache/" } },
      File: class {
        uri: string;
        constructor(uri: string) {
          this.uri = uri;
        }
        get exists() {
          return files.has(this.uri);
        }
        get size() {
          return files.get(this.uri)!;
        }
        async bytes() {
          return new Uint8Array(this.size);
        }
        delete() {
          removed.push(this.uri);
          files.delete(this.uri);
        }
      },
    },
  });
  return { mod, qualities, removed, decode: () => decode };
}
test("guest native photos fit the eight-image request budget and delete only temporary copies", async () => {
  const f = fixture();
  const bytes = await f.mod.prepareGuestPhoto(
    "file:///documents/original.heic",
  );
  assert.equal(bytes.length, 180000);
  assert.deepEqual(f.qualities, [0.8, 0.65]);
  assert.equal(f.decode().maxWidth, 1024);
  assert.deepEqual(f.removed, [
    "file:///cache/copy-1.jpg",
    "file:///cache/copy-2.jpg",
  ]);
});
test("ordinary authenticated image uploads retain their original size and quality settings", async () => {
  const f = fixture();
  assert.equal(
    (await f.mod.prepareExternalPhoto("file:///documents/original.heic"))
      .length,
    400000,
  );
  assert.deepEqual(f.qualities, [0.8]);
  assert.equal(f.decode().maxWidth, 1536);
});
