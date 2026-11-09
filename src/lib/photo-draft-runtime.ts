import { photoDraftRepository } from "./photo-draft-storage";
import { recoverDraftPhotos } from "./photo-draft-picker";
import type { PhotoInput } from "./photo-draft";

let pending: Promise<PhotoInput[]> | undefined;
let recovery: Promise<unknown> | undefined;
export async function readDraftPhotos() {
  const repo = await photoDraftRepository();
  pending ??= recoverDraftPhotos().catch((error) => {
    pending = undefined;
    throw error;
  });
  recovery ??= pending
    .then((photos) => (photos.length ? repo.add(photos) : undefined))
    .catch((error) => {
      // Surface a failed recovery once, then let Retry reopen the saved draft.
      // Replaying an oversized/invalid pending result would lock it indefinitely.
      pending = Promise.resolve([]);
      recovery = undefined;
      throw error;
    });
  await recovery;
  return repo.read();
}
export async function clearDraftPhotos() {
  const photos = await (await photoDraftRepository()).clear();
  pending = Promise.resolve([]);
  recovery = Promise.resolve();
  return photos;
}
