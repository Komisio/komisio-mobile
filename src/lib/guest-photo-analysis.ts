import type { ItemDraftSnapshot } from "./photo-draft.ts";
import type { ExternalOutboxStorage } from "./external-submission.ts";
import type { CommandLock } from "./pending-command.ts";
import {
  parsePhotoAnalysis,
  type PhotoAnalysisResult,
} from "./photo-analysis.ts";

export type GuestAnalysisProof = { id: string; token: string };
export type GuestAnalysisCommand =
  | { action: "read"; requestId: string; token: string }
  | {
      action: "analyze";
      requestId: string;
      token: string;
      tenantId: string;
      language: string;
      startedAt: string;
      photos: { id: string; data: string }[];
    };
export type GuestAnalysisJournal = {
  version: 1;
  binding: string;
  draftId: string;
  tenantId: string;
  sourcePhotos: string[];
  photos: string[];
  requestId: string;
  token: string;
  startedAt: string;
  language: string;
  result: PhotoAnalysisResult | null;
};
const validId = (id: unknown): id is string =>
  typeof id === "string" &&
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id);
const languages = ["sv", "en", "no", "dk", "fi", "de", "es", "it"];
function validIds(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length >= 1 &&
    value.length <= 8 &&
    value.every(validId) &&
    new Set(value).size === value.length
  );
}
function matches(j: GuestAnalysisJournal, s: ItemDraftSnapshot) {
  return (
    j.draftId === s.draft.draftId &&
    j.tenantId === s.draft.store?.id &&
    JSON.stringify(j.sourcePhotos) === JSON.stringify(s.photos.map((p) => p.id))
  );
}
function base64(bytes: Uint8Array) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192)
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(binary);
}
export function createGuestPhotoAnalysis(deps: {
  binding: string;
  storage: ExternalOutboxStorage<GuestAnalysisJournal>;
  lock: CommandLock;
  uuid(): string;
  now?(): number;
  preparePhoto(uri: string): Promise<Uint8Array>;
  request(command: GuestAnalysisCommand): Promise<PhotoAnalysisResult | null>;
}) {
  const now = deps.now ?? Date.now;
  const run = <T>(work: () => Promise<T>) =>
    deps.lock(`komisio.guest-photo-ai:${deps.binding}`, work);
  const read = async () => {
    const value = await deps.storage.read();
    if (value === null) return null;
    const j = value as GuestAnalysisJournal;
    if (
      !j ||
      j.version !== 1 ||
      j.binding !== deps.binding ||
      !validId(j.draftId) ||
      !validId(j.tenantId) ||
      !validId(j.requestId) ||
      !validIds(j.sourcePhotos) ||
      !validIds(j.photos) ||
      j.photos.length !== j.sourcePhotos.length ||
      typeof j.token !== "string" ||
      !/^[a-f0-9]{64}$/.test(j.token) ||
      typeof j.startedAt !== "string" ||
      !Number.isFinite(Date.parse(j.startedAt)) ||
      !languages.includes(j.language)
    )
      throw new Error("ASSISTANCE_UNAVAILABLE");
    const result = parsePhotoAnalysis(j.result);
    if (result && !resultMatches(j, result))
      throw new Error("ASSISTANCE_UNAVAILABLE");
    return j;
  };
  const resultMatches = (j: GuestAnalysisJournal, r: PhotoAnalysisResult) =>
    r.id === j.requestId &&
    r.tenantId === j.tenantId &&
    r.language === j.language &&
    JSON.stringify(r.photos) === JSON.stringify(j.photos);
  return {
    prepare: (
      snapshot: ItemDraftSnapshot,
      language: string,
      progress: (done: number, total: number) => void,
    ) => {
      const s = {
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
          !validId(s.draft.draftId) ||
          !s.draft.store ||
          !validId(s.draft.store.id) ||
          !validIds(s.photos.map((p) => p.id)) ||
          JSON.stringify(s.draft.photoIds) !==
            JSON.stringify(s.photos.map((p) => p.id)) ||
          !languages.includes(language)
        )
          throw new Error("DRAFT_CHANGED");
        let j = await read();
        if (!j || !matches(j, s) || j.language !== language) {
          const photos = s.photos.map(() => deps.uuid());
          for (let i = 0; i < photos.length; i++) {
            const bytes = await deps.preparePhoto(s.photos[i].uri);
            if (!bytes.length || bytes.length > 262144)
              throw new Error("PHOTO_INVALID");
            await deps.storage.putPhoto(photos[i], bytes);
            progress(i + 1, photos.length);
          }
          j = {
            version: 1,
            binding: deps.binding,
            draftId: s.draft.draftId,
            tenantId: s.draft.store.id,
            sourcePhotos: s.photos.map((p) => p.id),
            photos,
            requestId: deps.uuid(),
            token: j?.token ?? (deps.uuid() + deps.uuid()).replaceAll("-", ""),
            startedAt: new Date(now()).toISOString(),
            language,
            result: null,
          };
          await deps.storage.write(j);
          await deps.storage.prune(photos);
        }
        // Repair both native journal copies before dispatching any request.
        await deps.storage.write(j);
        progress(j.photos.length, j.photos.length);
      });
    },
    analyze: (s: ItemDraftSnapshot, language: string) =>
      run(async () => {
        const j = await read();
        if (!j || !matches(j, s) || j.language !== language)
          throw new Error("DRAFT_CHANGED");
        if (j.result && j.result.status !== "pending") return j.result;
        let result = await deps.request({
          action: "read",
          requestId: j.requestId,
          token: j.token,
        });
        if (!result) {
          if (now() - Date.parse(j.startedAt) >= 86400000)
            throw new Error("GUEST_ANALYSIS_EXPIRED");
          const photos = [];
          for (const id of j.photos) {
            const bytes = await deps.storage.photo(id);
            if (!bytes.length || bytes.length > 262144)
              throw new Error("PHOTO_INVALID");
            photos.push({ id, data: base64(bytes) });
          }
          result = await deps.request({
            action: "analyze",
            requestId: j.requestId,
            token: j.token,
            tenantId: j.tenantId,
            language: j.language,
            startedAt: j.startedAt,
            photos,
          });
        }
        if (!result || !resultMatches(j, result))
          throw new Error("ASSISTANCE_UNAVAILABLE");
        await deps.storage.write({ ...j, result });
        return result;
      }),
    cachedPhotos: (s: ItemDraftSnapshot) =>
      run(async () => {
        const j = await read();
        if (!j || !matches(j, s)) return null;
        return Promise.all(j.photos.map((id) => deps.storage.photo(id)));
      }),
    proof: (s: ItemDraftSnapshot) =>
      run(async () => {
        const j = await read();
        return j &&
          matches(j, s) &&
          j.result?.status === "ready" &&
          now() - Date.parse(j.startedAt) < 86400000
          ? { id: j.requestId, token: j.token }
          : null;
      }),
  };
}
