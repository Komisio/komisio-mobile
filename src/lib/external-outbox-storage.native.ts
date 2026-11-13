import type {
  ExternalAttempt,
  ExternalOutboxStorage,
} from "./external-submission";

export async function externalOutboxStorage<T = ExternalAttempt>(
  ownerId: string,
  binding: string,
): Promise<ExternalOutboxStorage<T>> {
  if (!/^[a-f0-9-]{36}$/.test(ownerId))
    throw new Error("SUBMISSION_UNAVAILABLE");
  const { Directory, File, Paths } = await import("expo-file-system");
  const { digestStringAsync, CryptoDigestAlgorithm } =
    await import("expo-crypto");
  const scope = await digestStringAsync(CryptoDigestAlgorithm.SHA256, binding);
  const directory = new Directory(
    Paths.document,
    "komisio-external-submissions-v1",
    scope,
    ownerId,
  );
  directory.create({ intermediates: true, idempotent: true });
  const manifest = new File(directory, "attempt.json"),
    backup = new File(directory, "attempt.backup.json");
  const photo = (id: string) => {
    if (!/^[a-f0-9-]{36}$/.test(id)) throw new Error("SUBMISSION_UNAVAILABLE");
    return new File(directory, `${id}.jpg`);
  };
  const readFile = async (file: InstanceType<typeof File>) => {
    if (!file.exists || file.size <= 0 || file.size > 16000)
      throw new Error("SUBMISSION_UNAVAILABLE");
    return JSON.parse(await file.text()) as unknown;
  };
  return {
    async read() {
      if (!manifest.exists && !backup.exists) return null;
      try {
        return await readFile(manifest);
      } catch {
        return readFile(backup);
      }
    },
    async write(attempt) {
      const raw = JSON.stringify(attempt);
      if (raw.length > 16000) throw new Error("SUBMISSION_UNAVAILABLE");
      const pending = new File(directory, "attempt.pending.json");
      pending.create({ overwrite: true });
      await pending.write(raw);
      await pending.move(manifest, { overwrite: true });
      // Both copies describe this attempt before any request may be dispatched.
      await manifest.copy(backup, { overwrite: true });
    },
    async putPhoto(id, bytes) {
      if (!bytes.length || bytes.length > 3 * 1024 * 1024)
        throw new Error("PHOTO_INVALID");
      const file = photo(id);
      file.create({ overwrite: false });
      await file.write(bytes);
      if (file.size !== bytes.length) throw new Error("SUBMISSION_UNAVAILABLE");
    },
    async photo(id) {
      const file = photo(id);
      if (!file.exists || file.size <= 0 || file.size > 3 * 1024 * 1024)
        throw new Error("SUBMISSION_UNAVAILABLE");
      return file.bytes();
    },
    async prune(keep) {
      for (const entry of directory.list()) {
        if (
          !(entry instanceof File) ||
          !/^[a-f0-9-]{36}\.jpg$/.test(entry.name)
        )
          continue;
        if (!keep.includes(entry.name.slice(0, -4))) entry.delete();
      }
    },
  };
}
