import type { ExternalOutboxStorage } from "./external-submission";

export async function externalOutboxStorage(
  ownerId: string,
  binding: string,
): Promise<ExternalOutboxStorage> {
  if (typeof indexedDB === "undefined")
    throw new Error("SUBMISSION_UNAVAILABLE");
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const open = indexedDB.open("komisio-external-submissions-v1", 1);
    open.onupgradeneeded = () => open.result.createObjectStore("outbox");
    open.onerror = open.onblocked = () =>
      reject(new Error("SUBMISSION_UNAVAILABLE"));
    open.onsuccess = () => resolve(open.result);
  });
  const prefix = JSON.stringify([binding, ownerId]) + ":";
  const request = <T>(
    mode: IDBTransactionMode,
    work: (store: IDBObjectStore) => IDBRequest<T>,
  ) =>
    new Promise<T>((resolve, reject) => {
      const transaction = db.transaction("outbox", mode),
        result = work(transaction.objectStore("outbox"));
      transaction.oncomplete = () => resolve(result.result);
      transaction.onabort = transaction.onerror = () =>
        reject(new Error("SUBMISSION_UNAVAILABLE"));
    });
  return {
    async read() {
      return (
        (await request("readonly", (s) => s.get(prefix + "attempt"))) ?? null
      );
    },
    async write(attempt) {
      await request("readwrite", (s) => s.put(attempt, prefix + "attempt"));
    },
    async putPhoto(id, bytes) {
      if (!bytes.length || bytes.length > 3 * 1024 * 1024)
        throw new Error("PHOTO_INVALID");
      await request("readwrite", (s) =>
        s.put(
          new Blob([new Uint8Array(bytes)], { type: "image/jpeg" }),
          prefix + id,
        ),
      );
    },
    async photo(id) {
      const blob = await request("readonly", (s) => s.get(prefix + id));
      if (
        !(blob instanceof Blob) ||
        blob.size <= 0 ||
        blob.size > 3 * 1024 * 1024
      )
        throw new Error("SUBMISSION_UNAVAILABLE");
      return new Uint8Array(await blob.arrayBuffer());
    },
    async prune(keep) {
      const keys = await request("readonly", (s) => s.getAllKeys());
      for (const key of keys) {
        if (
          typeof key !== "string" ||
          !key.startsWith(prefix) ||
          key === prefix + "attempt" ||
          keep.includes(key.slice(prefix.length))
        )
          continue;
        await request("readwrite", (s) => s.delete(key));
      }
    },
  };
}
