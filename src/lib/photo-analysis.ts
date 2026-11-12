import type { ItemDraftSnapshot } from "./photo-draft.ts";
import type {
  ExternalOutboxStorage,
  ExternalRequestApi,
} from "./external-submission.ts";
import type { CommandLock } from "./pending-command.ts";
import type { ItemDraftDetails } from "./item-draft-details.ts";

export type PhotoSuggestion = {
  description: string;
  brand: string | null;
  condition: "like_new" | "very_good" | "good" | "worn" | null;
  notes: string;
};
export type PhotoAnalysisResult = {
  id: string;
  tenantId: string;
  photos: string[];
  language: string;
  status: "pending" | "ready" | "failed";
  output: PhotoSuggestion | null;
};
export type PhotoAnalysisJournal = {
  version: 1;
  ownerId: string;
  binding: string;
  draftId: string;
  tenantId: string;
  sourcePhotos: string[];
  photos: string[];
  requestId: string;
  language: string;
  uploaded: number;
};
export type PhotoAnalysisCommand =
  | {
      action: "analyze";
      requestId: string;
      tenantId: string;
      photos: string[];
      language: string;
    }
  | { action: "read"; requestId: string };
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const id = (v: unknown): v is string => typeof v === "string" && uuid.test(v);
const ids = (v: unknown): v is string[] =>
  Array.isArray(v) &&
  v.length >= 1 &&
  v.length <= 8 &&
  v.every(id) &&
  new Set(v).size === v.length;
const languages = ["sv", "en", "no", "dk", "fi", "de", "es", "it"];
export function parsePhotoAnalysis(value: unknown): PhotoAnalysisResult | null {
  if (value === null) return null;
  const v = value as PhotoAnalysisResult;
  if (
    !v ||
    !id(v.id) ||
    !id(v.tenantId) ||
    !ids(v.photos) ||
    !languages.includes(v.language) ||
    !["pending", "ready", "failed"].includes(v.status)
  )
    throw new Error("ASSISTANCE_UNAVAILABLE");
  const o = v.output;
  const string = (s: unknown, max: number) =>
    typeof s === "string" && s.length <= max;
  if (
    (v.status !== "ready" && o !== null) ||
    (v.status === "ready" &&
      (!o ||
        !string(o.description, 160) ||
        !o.description.trim() ||
        (o.brand !== null && (!string(o.brand, 100) || !o.brand.trim())) ||
        (o.condition !== null &&
          !["like_new", "very_good", "good", "worn"].includes(o.condition)) ||
        !string(o.notes, 1000)))
  )
    throw new Error("ASSISTANCE_UNAVAILABLE");
  return v;
}
export function applyPhotoSuggestion(
  values: ItemDraftDetails,
  output: PhotoSuggestion,
): ItemDraftDetails {
  return {
    ...values,
    description: values.description.trim()
      ? values.description
      : output.description,
    brand: values.brand.trim() ? values.brand : (output.brand ?? ""),
    condition: values.condition ?? output.condition,
    notes: values.notes.trim() ? values.notes : output.notes,
  };
}
export function createPhotoAnalysis(deps: {
  ownerId: string;
  binding: string;
  storage: ExternalOutboxStorage<PhotoAnalysisJournal>;
  lock: CommandLock;
  uuid(): string;
  preparePhoto(uri: string): Promise<Uint8Array>;
  api: Pick<ExternalRequestApi, "upload" | "discardPhoto">;
  analyze(command: PhotoAnalysisCommand): Promise<PhotoAnalysisResult | null>;
}) {
  const run = <T>(work: () => Promise<T>) =>
    deps.lock(`komisio.photo-analysis:${deps.binding}:${deps.ownerId}`, work);
  async function read() {
    const raw = await deps.storage.read();
    if (raw === null) return null;
    const v = raw as PhotoAnalysisJournal;
    if (
      !v ||
      v.version !== 1 ||
      v.ownerId !== deps.ownerId ||
      v.binding !== deps.binding ||
      !id(v.draftId) ||
      !id(v.tenantId) ||
      !id(v.requestId) ||
      !ids(v.photos) ||
      !ids(v.sourcePhotos) ||
      v.photos.length !== v.sourcePhotos.length ||
      !languages.includes(v.language) ||
      !Number.isInteger(v.uploaded) ||
      v.uploaded < 0 ||
      v.uploaded > v.photos.length
    )
      throw new Error("ASSISTANCE_UNAVAILABLE");
    return v;
  }
  function matches(v: PhotoAnalysisJournal, s: ItemDraftSnapshot) {
    return (
      v.draftId === s.draft.draftId &&
      v.tenantId === s.draft.store?.id &&
      JSON.stringify(s.draft.photoIds) ===
        JSON.stringify(s.photos.map((p) => p.id)) &&
      JSON.stringify(v.sourcePhotos) ===
        JSON.stringify(s.photos.map((p) => p.id))
    );
  }
  return {
    upload(
      snapshot: ItemDraftSnapshot,
      language: string,
      progress: (done: number, total: number) => void,
    ) {
      const frozen = {
        ...snapshot,
        draft: {
          ...snapshot.draft,
          photoIds: [...snapshot.draft.photoIds],
          store: snapshot.draft.store ? { ...snapshot.draft.store } : null,
        },
        photos: snapshot.photos.map((p) => ({ ...p })),
      };
      return run(async () => {
        if (
          !frozen.draft.store ||
          !id(frozen.draft.draftId) ||
          !ids(frozen.photos.map((p) => p.id)) ||
          JSON.stringify(frozen.draft.photoIds) !==
            JSON.stringify(frozen.photos.map((p) => p.id)) ||
          !languages.includes(language)
        )
          throw new Error("DRAFT_CHANGED");
        let journal = await read();
        if (
          !journal ||
          !matches(journal, frozen) ||
          journal.language !== language
        ) {
          if (journal)
            for (const photo of journal.photos) {
              try {
                await deps.api.discardPhoto(photo);
              } catch (e) {
                if (!(e instanceof Error) || e.message !== "PHOTO_IN_USE")
                  throw e;
              }
            }
          const photos = frozen.photos.map(() => deps.uuid());
          for (let i = 0; i < photos.length; i++)
            await deps.storage.putPhoto(
              photos[i],
              await deps.preparePhoto(frozen.photos[i].uri),
            );
          journal = {
            version: 1,
            ownerId: deps.ownerId,
            binding: deps.binding,
            draftId: frozen.draft.draftId,
            tenantId: frozen.draft.store.id,
            sourcePhotos: frozen.photos.map((p) => p.id),
            photos,
            requestId: deps.uuid(),
            language,
            uploaded: 0,
          };
          await deps.storage.write(journal);
          await deps.storage.prune(photos);
        }
        // Repair both native journal copies before a request can reach the server.
        await deps.storage.write(journal);
        progress(journal.uploaded, journal.photos.length);
        for (let i = journal.uploaded; i < journal.photos.length; i++) {
          await deps.api.upload(
            journal.photos[i],
            await deps.storage.photo(journal.photos[i]),
          );
          journal = { ...journal, uploaded: i + 1 };
          await deps.storage.write(journal);
          progress(journal.uploaded, journal.photos.length);
        }
        return journal;
      });
    },
    analyze: (snapshot: ItemDraftSnapshot, language: string) =>
      run(async () => {
        const j = await read();
        if (
          !j ||
          !matches(j, snapshot) ||
          j.language !== language ||
          j.uploaded !== j.photos.length
        )
          throw new Error("PHOTOS_NOT_UPLOADED");
        const prior = await deps.analyze({
          action: "read",
          requestId: j.requestId,
        });
        const result =
          prior ??
          (await deps.analyze({
            action: "analyze",
            requestId: j.requestId,
            tenantId: j.tenantId,
            photos: j.photos,
            language: j.language,
          }));
        if (
          !result ||
          result.id !== j.requestId ||
          result.tenantId !== j.tenantId ||
          result.language !== j.language ||
          JSON.stringify(result.photos) !== JSON.stringify(j.photos)
        )
          throw new Error("ASSISTANCE_UNAVAILABLE");
        return result;
      }),
    cachedPhotos: (snapshot: ItemDraftSnapshot) =>
      run(async () => {
        const j = await read();
        if (!j || !matches(j, snapshot) || j.uploaded !== j.photos.length)
          return null;
        return Promise.all(j.photos.map((id) => deps.storage.photo(id)));
      }),
  };
}
