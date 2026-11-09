import { photoDraftRepository } from "./photo-draft-storage";
import { recoverDraftPhotos } from "./photo-draft-picker";

let tail: Promise<unknown> = Promise.resolve();
function serialize<T>(work: () => Promise<T>): Promise<T> {
  const result = tail.then(work, work);
  tail = result.catch(() => {});
  return result;
}
export function readDraftPhotos() {
  return serialize(async () => {
    const repo = await photoDraftRepository();
    // Expo consumes each pending result once. Do not cache an empty result:
    // Android can recreate the Activity while retaining this JS runtime.
    const photos = await recoverDraftPhotos();
    if (photos.length) await repo.add(photos);
    return repo.read();
  });
}
export function clearDraftPhotos() {
  return serialize(async () => {
    const photos = await (await photoDraftRepository()).clear();
    // Discard unread picker results only after reset commits. A failed reset
    // leaves them recoverable, and a delayed earlier recovery finishes first.
    try {
      await recoverDraftPhotos();
    } catch {
      // Expo has consumed the invalid result; the explicit reset is committed.
    }
    return photos;
  });
}
