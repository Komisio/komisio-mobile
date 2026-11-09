import { randomUUID } from "expo-crypto";
import {
  MAX_PHOTO_BYTES,
  PhotoDraftRepository,
  type PhotoDraftStorage,
} from "./photo-draft";

let repository: Promise<PhotoDraftRepository> | undefined;
export function photoDraftRepository() {
  // Older installed app binaries never load this module's new native dependency
  // unless the explicitly enabled development preview actually mounts.
  return (repository ??= createRepository().catch((error) => {
    repository = undefined;
    throw error;
  }));
}
async function createRepository() {
  const { Directory, File, Paths } = await import("expo-file-system");
  const directory = new Directory(
    Paths.document,
    "komisio-external-photo-draft-v1",
  );
  directory.create({ intermediates: true, idempotent: true });
  const manifest = new File(directory, "manifest.json");
  const backup = new File(directory, "manifest.backup.json");
  const file = (id: string) => new File(directory, `${id}.image`);
  const storage: PhotoDraftStorage = {
    async read() {
      if (manifest.exists) return JSON.parse(await manifest.text());
      // Retain the previous draft if a replacement was interrupted.
      if (backup.exists) return JSON.parse(await backup.text());
      return null;
    },
    async write(draft) {
      const pending = new File(directory, "manifest.pending.json");
      pending.create({ overwrite: true });
      await pending.write(JSON.stringify(draft));
      if (manifest.exists) await manifest.copy(backup, { overwrite: true });
      try {
        await pending.move(manifest, { overwrite: true });
      } catch (error) {
        if (!manifest.exists && backup.exists) await backup.copy(manifest);
        throw error;
      }
    },
    async importPhoto(id, input) {
      if (!/^(file|content):\/\//.test(input.uri))
        throw new Error("PHOTO_INVALID");
      const source = new File(input.uri);
      if (!source.exists || source.size <= 0 || source.size > MAX_PHOTO_BYTES)
        throw new Error("PHOTO_INVALID");
      await source.copy(file(id));
    },
    async uri(id) {
      const photo = file(id);
      if (!photo.exists || photo.size <= 0)
        throw new Error("DRAFT_UNAVAILABLE");
      return photo.uri;
    },
    async cleanup(keep) {
      // Only generated files in this dedicated directory may be removed.
      for (const entry of directory.list()) {
        if (
          entry instanceof File &&
          /^[a-f0-9-]{36}\.image$/i.test(entry.name) &&
          !keep.includes(entry.name.slice(0, -6))
        )
          entry.delete();
      }
    },
  };
  return new PhotoDraftRepository(storage, randomUUID);
}
