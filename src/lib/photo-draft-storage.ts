import { randomUUID } from "expo-crypto";
import {
  MAX_PHOTO_BYTES,
  PhotoDraftRepository,
  type PhotoDraftStorage,
} from "./photo-draft";

let repository: Promise<PhotoDraftRepository> | undefined;
export function photoDraftRepository() {
  return (repository ??= createRepository().catch((error) => {
    repository = undefined;
    throw error;
  }));
}
async function createRepository() {
  if (typeof indexedDB === "undefined") throw new Error("DRAFT_UNAVAILABLE");
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const open = indexedDB.open("komisio-external-photo-draft-v1", 1);
    open.onupgradeneeded = () => open.result.createObjectStore("draft");
    open.onerror = () => reject(new Error("DRAFT_UNAVAILABLE"));
    open.onblocked = () => reject(new Error("DRAFT_UNAVAILABLE"));
    open.onsuccess = () => resolve(open.result);
  });
  function request<T>(
    mode: IDBTransactionMode,
    action: (store: IDBObjectStore) => IDBRequest<T>,
  ) {
    return new Promise<T>((resolve, reject) => {
      const transaction = db.transaction("draft", mode);
      const result = action(transaction.objectStore("draft"));
      transaction.oncomplete = () => resolve(result.result);
      transaction.onabort = transaction.onerror = () =>
        reject(new Error("DRAFT_UNAVAILABLE"));
    });
  }
  const urls = new Map<string, string>();
  const storage: PhotoDraftStorage = {
    exclusive(work) {
      if (!navigator.locks)
        return Promise.reject(new Error("DRAFT_UNAVAILABLE"));
      return navigator.locks.request("komisio-external-photo-draft-v1", work);
    },
    async read() {
      return (await request("readonly", (s) => s.get("manifest"))) ?? null;
    },
    async write(draft) {
      await request("readwrite", (s) => s.put(draft, "manifest"));
    },
    async importPhoto(id, input) {
      if (
        !(input.file instanceof Blob) ||
        !input.file.type.startsWith("image/") ||
        input.file.size <= 0 ||
        input.file.size > MAX_PHOTO_BYTES
      )
        throw new Error("PHOTO_INVALID");
      await request("readwrite", (s) => s.put(input.file, id));
    },
    async uri(id) {
      if (urls.has(id)) return urls.get(id)!;
      const blob = await request("readonly", (s) => s.get(id));
      if (!(blob instanceof Blob)) throw new Error("DRAFT_UNAVAILABLE");
      const uri = URL.createObjectURL(blob);
      urls.set(id, uri);
      return uri;
    },
    async cleanup(keep) {
      const keys = await request("readonly", (s) => s.getAllKeys());
      for (const key of keys) {
        if (typeof key !== "string" || key === "manifest" || keep.includes(key))
          continue;
        await request("readwrite", (s) => s.delete(key));
        const uri = urls.get(key);
        if (uri) URL.revokeObjectURL(uri);
        urls.delete(key);
      }
    },
  };
  return new PhotoDraftRepository(storage, randomUUID);
}
