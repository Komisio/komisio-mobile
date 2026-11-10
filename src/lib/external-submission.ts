import type { ItemDraftSnapshot, DraftRevision } from "./photo-draft.ts";
import { itemDetailsErrors, requestedPriceOre } from "./item-draft-details.ts";
import type { CommandLock } from "./pending-command.ts";

export type ExternalItemCommand = {
  action: "submit";
  requestId: string;
  tenantId: string;
  description: string;
  brand: string;
  condition: "like_new" | "very_good" | "good" | "worn";
  notes: string;
  desiredPriceOre: string | null;
  currency: string;
  photos: string[];
};
export type ExternalAttempt = {
  version: 1;
  ownerId: string;
  binding: string;
  draft: DraftRevision;
  command: ExternalItemCommand;
  storeName: string;
  state: "pending" | "rejected" | "confirmed" | "complete";
  rejection: string | null;
  preserveDraft: boolean;
};
export type ExternalOutboxStorage = {
  read(): Promise<unknown>;
  write(attempt: ExternalAttempt): Promise<void>;
  putPhoto(id: string, bytes: Uint8Array): Promise<void>;
  photo(id: string): Promise<Uint8Array>;
  prune(keep: string[]): Promise<void>;
};
export type ExternalRequest = {
  id: string;
  tenant_id: string;
  store_name: string;
  description: string;
  brand: string;
  condition: ExternalItemCommand["condition"];
  notes: string;
  desired_price_ore: string | null;
  currency: string;
  photos: string[];
  created_at: string;
  status: "waiting" | "declined";
  decline_note: string | null;
};
export type ExternalRequestPage = {
  activeCount: number;
  hasMore: boolean;
  requests: ExternalRequest[];
};
export type ExternalRequestApi = {
  lookup(id: string): Promise<ExternalRequest | null>;
  upload(id: string, bytes: Uint8Array): Promise<void>;
  submit(command: ExternalItemCommand): Promise<void>;
  discardPhoto(id: string): Promise<void>;
};
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
function identifier(value: unknown): value is string {
  return typeof value === "string" && uuid.test(value);
}
function text(value: unknown, max: number): value is string {
  return typeof value === "string" && value.length <= max;
}
export function parseExternalCommand(value: unknown): ExternalItemCommand {
  const c = value as ExternalItemCommand;
  if (
    !c ||
    c.action !== "submit" ||
    !identifier(c.requestId) ||
    !identifier(c.tenantId) ||
    !text(c.description, 160) ||
    !c.description.trim() ||
    !text(c.brand, 100) ||
    !text(c.notes, 1000) ||
    !["like_new", "very_good", "good", "worn"].includes(c.condition) ||
    (c.desiredPriceOre !== null &&
      (typeof c.desiredPriceOre !== "string" ||
        !/^[1-9]\d{0,10}$/.test(c.desiredPriceOre))) ||
    typeof c.currency !== "string" ||
    !/^[A-Z]{3}$/.test(c.currency) ||
    !Array.isArray(c.photos) ||
    c.photos.length < 1 ||
    c.photos.length > 8 ||
    c.photos.some((id) => !identifier(id)) ||
    new Set(c.photos).size !== c.photos.length
  )
    throw new Error("SUBMISSION_UNAVAILABLE");
  return {
    action: "submit",
    requestId: c.requestId,
    tenantId: c.tenantId,
    description: c.description,
    brand: c.brand,
    condition: c.condition,
    notes: c.notes,
    desiredPriceOre: c.desiredPriceOre,
    currency: c.currency,
    photos: [...c.photos],
  };
}
export function parseExternalAttempt(
  value: unknown,
  ownerId: string,
  binding: string,
): ExternalAttempt | null {
  if (value === null) return null;
  const v = value as ExternalAttempt;
  if (
    !v ||
    v.version !== 1 ||
    !identifier(ownerId) ||
    v.ownerId !== ownerId ||
    v.binding !== binding ||
    !text(v.binding, 2048) ||
    !v.draft ||
    !identifier(v.draft.draftId) ||
    !Number.isSafeInteger(v.draft.revision) ||
    v.draft.revision < 1 ||
    !["pending", "rejected", "confirmed", "complete"].includes(v.state) ||
    !text(v.storeName, 200) ||
    (v.rejection !== null && !text(v.rejection, 60)) ||
    typeof v.preserveDraft !== "boolean"
  )
    throw new Error("SUBMISSION_UNAVAILABLE");
  return {
    version: 1,
    ownerId,
    binding,
    draft: { ...v.draft },
    command: parseExternalCommand(v.command),
    storeName: v.storeName,
    state: v.state,
    rejection: v.rejection,
    preserveDraft: v.preserveDraft,
  };
}
export function requestMatches(
  request: ExternalRequest,
  c: ExternalItemCommand,
) {
  return (
    request.id === c.requestId &&
    request.tenant_id === c.tenantId &&
    request.description === c.description &&
    request.brand === c.brand &&
    request.condition === c.condition &&
    request.notes === c.notes &&
    request.desired_price_ore === c.desiredPriceOre &&
    request.currency === c.currency &&
    JSON.stringify(request.photos) === JSON.stringify(c.photos)
  );
}
const refusals = new Set([
  "STORE_UNAVAILABLE",
  "STORE_CHANGED",
  "ACTIVE_REQUEST_LIMIT",
  "PHOTO_NOT_FOUND",
  "PHOTO_LIMIT",
  "PLAN_READ_ONLY",
]);

/** One durable foreground operation per person. No background sender or financial journal. */
export function createExternalSubmission(deps: {
  ownerId: string;
  binding: string;
  storage: ExternalOutboxStorage;
  lock: CommandLock;
  uuid(): string;
  preparePhoto(uri: string): Promise<Uint8Array>;
  finishDraft(expected: DraftRevision, preserve: boolean): Promise<void>;
  api: ExternalRequestApi;
}) {
  const run = <T>(work: () => Promise<T>) =>
    deps.lock(
      `komisio.external-submission:${deps.binding}:${deps.ownerId}`,
      work,
    );
  const read = async () =>
    parseExternalAttempt(await deps.storage.read(), deps.ownerId, deps.binding);
  async function finish(attempt: ExternalAttempt) {
    // Persist confirmation before clearing any original. Interrupted cleanup
    // resumes here and never sends the request a second time.
    const confirmed: ExternalAttempt = {
      ...attempt,
      state: "confirmed",
      rejection: null,
    };
    await deps.storage.write(confirmed);
    await deps.finishDraft(confirmed.draft, confirmed.preserveDraft);
    const complete: ExternalAttempt = { ...confirmed, state: "complete" };
    await deps.storage.write(complete);
    try {
      await deps.storage.prune([]);
    } catch {
      /* Completed evidence stays in the journal. */
    }
    return complete;
  }
  async function cleanupRejected(attempt: ExternalAttempt) {
    for (const id of attempt.command.photos) await deps.api.discardPhoto(id);
  }
  return {
    load: () => run(read),
    prepare: (snapshot: ItemDraftSnapshot) => {
      // Capture before asynchronous image preparation or a cross-tab lock yields.
      const frozen: ItemDraftSnapshot = {
        draft: {
          ...snapshot.draft,
          photoIds: [...snapshot.draft.photoIds],
          details: { ...snapshot.draft.details },
          store: snapshot.draft.store ? { ...snapshot.draft.store } : null,
        },
        photos: snapshot.photos.map((photo) => ({ ...photo })),
      };
      return run(async () => {
        const prior = await read();
        if (
          prior &&
          (prior.state === "pending" ||
            prior.state === "confirmed" ||
            (prior.state === "complete" &&
              prior.draft.draftId === frozen.draft.draftId))
        )
          return prior;
        if (prior?.state === "rejected") {
          const existing = await deps.api.lookup(prior.command.requestId);
          if (existing)
            return finish({
              ...prior,
              preserveDraft: !requestMatches(existing, prior.command),
            });
          await cleanupRejected(prior);
        }
        const { draft, photos } = frozen;
        if (
          !draft.store ||
          !draft.draftId ||
          photos.length < 1 ||
          photos.length > 8 ||
          JSON.stringify(photos.map((p) => p.id)) !==
            JSON.stringify(draft.photoIds) ||
          itemDetailsErrors(draft.details).length
        )
          throw new Error("DRAFT_CHANGED");
        const command = parseExternalCommand({
          action: "submit",
          requestId:
            prior?.draft.draftId === draft.draftId
              ? prior.command.requestId
              : deps.uuid(),
          tenantId: draft.store.id,
          description: draft.details.description.trim(),
          brand: draft.details.brand.trim(),
          condition: draft.details.condition,
          notes: draft.details.notes.trim(),
          desiredPriceOre: requestedPriceOre(draft.details.desiredPrice),
          currency: draft.store.currency,
          photos: photos.map(() => deps.uuid()),
        });
        const next: ExternalAttempt = {
          version: 1,
          ownerId: deps.ownerId,
          binding: deps.binding,
          draft: { draftId: draft.draftId, revision: draft.revision },
          command,
          storeName: draft.store.name,
          state: "pending",
          rejection: null,
          preserveDraft: false,
        };
        for (let i = 0; i < photos.length; i++)
          await deps.storage.putPhoto(
            command.photos[i],
            await deps.preparePhoto(photos[i].uri),
          );
        await deps.storage.write(next);
        try {
          await deps.storage.prune(command.photos);
        } catch {
          /* Private orphans can be pruned on the next successful prepare. */
        }
        return next;
      });
    },
    resume: (progress?: (done: number, total: number) => void) =>
      run(async () => {
        const attempt = await read();
        if (!attempt) throw new Error("SUBMISSION_UNAVAILABLE");
        if (attempt.state === "complete") return attempt;
        if (attempt.state === "confirmed") return finish(attempt);
        // Repair both native journal copies after an interrupted local write,
        // before any network dispatch can make this attempt observable.
        await deps.storage.write(attempt);
        const existing = await deps.api.lookup(attempt.command.requestId);
        if (existing)
          return finish({
            ...attempt,
            preserveDraft: !requestMatches(existing, attempt.command),
          });
        try {
          for (let i = 0; i < attempt.command.photos.length; i++) {
            const id = attempt.command.photos[i];
            progress?.(i, attempt.command.photos.length);
            await deps.api.upload(id, await deps.storage.photo(id));
          }
          progress?.(
            attempt.command.photos.length,
            attempt.command.photos.length,
          );
          await deps.api.submit(attempt.command);
        } catch (error) {
          const code = error instanceof Error ? error.message : "";
          if (refusals.has(code)) {
            const rejected: ExternalAttempt = {
              ...attempt,
              state: "rejected",
              rejection: code,
            };
            await deps.storage.write(rejected);
            return rejected;
          }
          throw error;
        }
        return finish(attempt);
      }),
  };
}
