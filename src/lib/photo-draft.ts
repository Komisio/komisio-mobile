import {
  emptyItemDetails,
  parseItemDraftDetails,
  type ItemDraftDetails,
} from "./item-draft-details.ts";
import { parseExternalStore, type ExternalStore } from "./external-stores.ts";

export const MAX_DRAFT_PHOTOS = 8;
export const MAX_PHOTO_BYTES = 25 * 1024 * 1024;
const photoId =
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

export type PhotoInput = { uri: string; file?: Blob; fileSize?: number };
export type PhotoDraft = { version: 1; photoIds: string[] } | ItemPhotoDraft;
export type ItemPhotoDraft = {
  version: 2;
  draftId: string | null;
  revision: number;
  photoIds: string[];
  store: ExternalStore | null;
  details: ItemDraftDetails;
};
export type DraftRevision = Pick<ItemPhotoDraft, "draftId" | "revision">;
export type ItemDraftSnapshot = { draft: ItemPhotoDraft; photos: DraftPhoto[] };
function emptyDraft(): ItemPhotoDraft {
  return {
    version: 2,
    draftId: null,
    revision: 0,
    photoIds: [],
    store: null,
    details: emptyItemDetails(),
  };
}
export type DraftPhoto = { id: string; uri: string };
export interface PhotoDraftStorage {
  exclusive?<T>(work: () => Promise<T>): Promise<T>;
  read(): Promise<unknown>;
  write(draft: PhotoDraft): Promise<void>;
  importPhoto(id: string, input: PhotoInput): Promise<void>;
  releaseInputs?(inputs: PhotoInput[]): Promise<void>;
  uri(id: string): Promise<string>;
  cleanup(keep: string[]): Promise<void>;
}

export function parsePhotoDraft(value: unknown): ItemPhotoDraft {
  if (value === null) return emptyDraft();
  if (!value || typeof value !== "object") throw new Error("DRAFT_UNAVAILABLE");
  const draft = value as Omit<Partial<ItemPhotoDraft>, "version"> & {
    version?: number;
  };
  if (
    (draft.version !== 1 && draft.version !== 2) ||
    !Array.isArray(draft.photoIds) ||
    draft.photoIds.length > MAX_DRAFT_PHOTOS ||
    draft.photoIds.some((id) => typeof id !== "string" || !photoId.test(id)) ||
    new Set(draft.photoIds).size !== draft.photoIds.length
  )
    throw new Error("DRAFT_UNAVAILABLE");
  if (draft.version === 1)
    return { ...emptyDraft(), photoIds: [...draft.photoIds] };
  if (
    typeof draft.draftId !== "string" ||
    !photoId.test(draft.draftId) ||
    !Number.isSafeInteger(draft.revision) ||
    draft.revision! < 1 ||
    draft.revision! >= Number.MAX_SAFE_INTEGER
  )
    throw new Error("DRAFT_UNAVAILABLE");
  try {
    return {
      version: 2,
      draftId: draft.draftId,
      revision: draft.revision!,
      photoIds: [...draft.photoIds],
      store: draft.store === null ? null : parseExternalStore(draft.store),
      details: parseItemDraftDetails(draft.details),
    };
  } catch {
    throw new Error("DRAFT_UNAVAILABLE");
  }
}

/** Serializes local edits; the manifest commits only after every photo is readable. */
export class PhotoDraftRepository {
  private tail: Promise<unknown> = Promise.resolve();
  private storage: PhotoDraftStorage;
  private uuid: () => string;
  constructor(storage: PhotoDraftStorage, uuid: () => string) {
    this.storage = storage;
    this.uuid = uuid;
  }

  private run<T>(work: () => Promise<T>): Promise<T> {
    const execute = () =>
      this.storage.exclusive ? this.storage.exclusive(work) : work();
    const result = this.tail.then(execute, execute);
    this.tail = result.catch(() => {});
    return result;
  }
  private async photos(draft: PhotoDraft): Promise<DraftPhoto[]> {
    return Promise.all(
      draft.photoIds.map(async (id) => ({
        id,
        uri: await this.storage.uri(id),
      })),
    );
  }
  private async cleanup(ids: string[]) {
    // A failed cleanup must not turn a committed edit into a reported failed save.
    try {
      await this.storage.cleanup(ids);
    } catch {
      /* Retry on the next edit. */
    }
  }
  read() {
    return this.run(async () =>
      this.photos(parsePhotoDraft(await this.storage.read())),
    );
  }
  snapshot(): Promise<ItemDraftSnapshot> {
    return this.run(async () => {
      const draft = parsePhotoDraft(await this.storage.read());
      return { draft, photos: await this.photos(draft) };
    });
  }
  private next(current: ItemPhotoDraft): ItemPhotoDraft {
    return {
      ...current,
      draftId: current.draftId ?? this.uuid(),
      revision: current.revision + 1,
    };
  }
  private checkRevision(current: ItemPhotoDraft, expected: DraftRevision) {
    if (
      current.draftId !== expected.draftId ||
      current.revision !== expected.revision ||
      !current.photoIds.length
    )
      throw new Error("DRAFT_CHANGED");
  }
  saveDetails(
    details: ItemDraftDetails,
    expected: DraftRevision,
  ): Promise<ItemDraftSnapshot> {
    return this.run(async () => {
      const current = parsePhotoDraft(await this.storage.read());
      this.checkRevision(current, expected);
      const next = {
        ...this.next(current),
        details: parseItemDraftDetails(details),
      };
      const photos = await this.photos(next);
      await this.storage.write(next);
      await this.cleanup(next.photoIds);
      return { draft: next, photos };
    });
  }
  selectStore(
    store: ExternalStore,
    expected: DraftRevision,
    clearPrice = false,
  ): Promise<ItemDraftSnapshot> {
    return this.run(async () => {
      const current = parsePhotoDraft(await this.storage.read());
      this.checkRevision(current, expected);
      const selected = parseExternalStore(store);
      const currencyChanged =
        current.store && current.store.currency !== selected.currency;
      if (currencyChanged && current.details.desiredPrice.trim() && !clearPrice)
        throw new Error("PRICE_CURRENCY_CHANGED");
      const next = {
        ...this.next(current),
        store: selected,
        details: currencyChanged
          ? { ...current.details, desiredPrice: "" }
          : current.details,
      };
      const photos = await this.photos(next);
      await this.storage.write(next);
      await this.cleanup(next.photoIds);
      return { draft: next, photos };
    });
  }
  add(inputs: PhotoInput[]) {
    return this.run(async () => {
      const current = parsePhotoDraft(await this.storage.read());
      if (inputs.length + current.photoIds.length > MAX_DRAFT_PHOTOS)
        throw new Error("PHOTO_LIMIT");
      if (
        inputs.some(
          (p) =>
            !p.uri ||
            (p.fileSize !== undefined &&
              (!Number.isFinite(p.fileSize) ||
                p.fileSize <= 0 ||
                p.fileSize > MAX_PHOTO_BYTES)),
        )
      )
        throw new Error("PHOTO_INVALID");
      if (!inputs.length) return this.photos(current);
      const ids = inputs.map(() => this.uuid());
      const next = parsePhotoDraft({
        ...this.next(current),
        photoIds: [...current.photoIds, ...ids],
      });
      let photos: DraftPhoto[];
      try {
        for (let i = 0; i < inputs.length; i++)
          await this.storage.importPhoto(ids[i], inputs[i]);
        photos = await this.photos(next);
        await this.storage.write(next);
      } catch (error) {
        await this.cleanup(current.photoIds);
        throw error;
      }
      try {
        await this.storage.releaseInputs?.(inputs);
      } catch {
        // The draft has committed. The OS may reclaim remaining picker cache.
      }
      await this.cleanup(next.photoIds);
      return photos;
    });
  }
  remove(id: string) {
    return this.run(async () => {
      const current = parsePhotoDraft(await this.storage.read());
      const next: ItemPhotoDraft = {
        ...this.next(current),
        photoIds: current.photoIds.filter((p) => p !== id),
      };
      const photos = await this.photos(next);
      await this.storage.write(next);
      await this.cleanup(next.photoIds);
      return photos;
    });
  }
  clear() {
    return this.run(async () => {
      // Explicit reset remains possible when the old manifest is unreadable.
      await this.storage.write({
        ...emptyDraft(),
        draftId: this.uuid(),
        revision: 1,
      });
      await this.cleanup([]);
      return [] as DraftPhoto[];
    });
  }
  finishSubmission(expected: DraftRevision, preserve = false) {
    return this.run(async () => {
      const current = parsePhotoDraft(await this.storage.read());
      if (current.draftId !== expected.draftId) return;
      if (preserve || current.revision !== expected.revision) {
        // A changed draft is a new local intent; keep its photos and edits.
        await this.storage.write({
          ...this.next(current),
          draftId: this.uuid(),
        });
        return;
      }
      await this.storage.write({
        ...emptyDraft(),
        draftId: this.uuid(),
        revision: 1,
      });
      await this.cleanup([]);
    });
  }
}
