import { randomUUID } from "expo-crypto";
import {
  MAX_PHOTO_BYTES,
  PhotoDraftRepository,
  parsePhotoDraft,
  type PhotoDraftStorage,
} from "./photo-draft";

let repository: Promise<PhotoDraftRepository> | undefined;
export function photoDraftRepository() {
  // Keep preview storage lazy; the existing native file-system module is retained.
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
  const readablePhoto = (photo: InstanceType<typeof File>) =>
    photo.exists &&
    Number.isFinite(photo.size) &&
    photo.size > 0 &&
    photo.size <= MAX_PHOTO_BYTES;
  async function readManifest(source: InstanceType<typeof File>) {
    const draft = parsePhotoDraft(JSON.parse(await source.text()));
    if (draft.photoIds.some((id) => !readablePhoto(file(id))))
      throw new Error("DRAFT_UNAVAILABLE");
    return draft;
  }
  const storage: PhotoDraftStorage = {
    async read() {
      if (!manifest.exists && !backup.exists) return null;
      try {
        return await readManifest(manifest);
      } catch {
        // A backup is useful only when its schema and all private photos are intact.
        return readManifest(backup);
      }
    },
    async write(draft) {
      const pending = new File(directory, "manifest.pending.json");
      pending.create({ overwrite: true });
      await pending.write(JSON.stringify(draft));
      let validCurrent = false;
      try {
        await readManifest(manifest);
        validCurrent = true;
      } catch {
        // Never replace a usable backup with a corrupt primary manifest.
      }
      if (validCurrent) await manifest.copy(backup, { overwrite: true });
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
      if (
        (input.uri.startsWith("file://") && !source.exists) ||
        (typeof source.size === "number" && source.size > MAX_PHOTO_BYTES)
      )
        throw new Error("PHOTO_INVALID");
      const destination = file(id);
      await source.copy(destination);
      // content:// providers can report null/zero size; validate the private copy.
      if (!readablePhoto(destination)) throw new Error("PHOTO_INVALID");
    },
    async releaseInputs(inputs) {
      const cache = new URL(Paths.cache.uri);
      const base = decodeURIComponent(cache.pathname).replace(/\/?$/, "/");
      for (const input of inputs) {
        const source = new URL(input.uri);
        const path = decodeURIComponent(source.pathname);
        if (
          source.protocol !== "file:" ||
          source.host !== cache.host ||
          !path.startsWith(base) ||
          path.includes("\\") ||
          path
            .slice(base.length)
            .split("/")
            .some((part) => part === "..")
        )
          continue;
        // Only picker results in this app's cache, and only after draft commit.
        const cached = new File(input.uri);
        if (cached.exists) cached.delete();
      }
    },
    async uri(id) {
      const photo = file(id);
      if (!readablePhoto(photo)) throw new Error("DRAFT_UNAVAILABLE");
      return photo.uri;
    },
    async cleanup(keep) {
      // Mirror the committed draft before removing files, so a fallback cannot
      // resurrect a deleted photo or refer to files that cleanup has removed.
      await readManifest(manifest);
      await manifest.copy(backup, { overwrite: true });
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
