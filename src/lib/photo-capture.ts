import {
  MAX_DRAFT_PHOTOS,
  type DraftPhoto,
  type ItemDraftSnapshot,
  type PhotoDraftRepository,
  type PhotoInput,
} from "./photo-draft.ts";

type State = {
  photos: DraftPhoto[];
  busy: boolean;
  error: string | null;
  retrySave: boolean;
};
/** One shutter operation owns capture and durable save; retries reuse the shot. */
export function createPhotoCapture(
  deps: {
    repository(): Promise<Pick<PhotoDraftRepository, "snapshot" | "add">>;
  },
  photos: DraftPhoto[],
) {
  let state: State = { photos, busy: false, error: null, retrySave: false };
  let pending: { input: PhotoInput; snapshot: ItemDraftSnapshot } | null = null;
  let closed = false;
  let generation = 0;
  const listeners = new Set<() => void>();
  function publish(next: Partial<State>) {
    if (closed) return;
    state = { ...state, ...next };
    listeners.forEach((listener) => listener());
  }
  return {
    getState: () => state,
    open() {
      closed = false;
      publish({ busy: false, error: null, retrySave: false });
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    close() {
      closed = true;
      generation++;
      pending = null;
    },
    async take(
      capturePhoto: () => Promise<PhotoInput>,
      onSaved: (photos: DraftPhoto[]) => void,
    ) {
      if (closed || state.busy) return;
      const started = generation;
      const current = () => !closed && started === generation;
      publish({ busy: true, error: null });
      try {
        const repository = await deps.repository();
        if (!current()) return;
        if (!pending) {
          const snapshot = await repository.snapshot();
          if (!current()) return;
          if (snapshot.photos.length >= MAX_DRAFT_PHOTOS)
            throw new Error("PHOTO_LIMIT");
          const input = await capturePhoto();
          if (!current()) return;
          pending = { input, snapshot };
        }
        if (!current()) return;
        const saved = await repository.add(
          [pending.input],
          pending.snapshot.draft,
        );
        if (!current()) return;
        pending = null;
        onSaved(saved);
        publish({ photos: saved, retrySave: false });
      } catch (e) {
        if (!current()) return;
        const error = e instanceof Error ? e.message : "CAMERA_FAILED";
        if (error === "DRAFT_CHANGED" || error === "PHOTO_LIMIT")
          pending = null;
        publish({ error, retrySave: pending !== null });
      } finally {
        if (current()) publish({ busy: false });
      }
    },
  };
}
