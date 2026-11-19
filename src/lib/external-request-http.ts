import { mobileEndpoint } from "./mobile-command-http.ts";
import {
  parseExternalCommand,
  type ExternalItemCommand,
  type ExternalRequestApi,
  type ExternalRequestPage,
} from "./external-submission.ts";

export function externalItemsEndpoint(value: string | undefined) {
  return mobileEndpoint(value)?.replace(/\/seller$/, "/external-items") ?? null;
}
const safeErrors = new Set([
  "PRICE_REQUIRED",
  "AGREEMENT_REQUIRED",
  "AGREEMENT_CHANGED",
  "ACCOUNT_REQUIRED",
  "AUTH_REQUIRED",
  "MFA_REQUIRED",
  "PASSWORD_UPDATE_REQUIRED",
  "FORBIDDEN",
  "SUPPORT_READ_ONLY",
  "STORE_UNAVAILABLE",
  "STORE_CHANGED",
  "SWEDEN_REQUIRED",
  "ACTIVE_REQUEST_LIMIT",
  "PHOTO_NOT_FOUND",
  "PHOTO_LIMIT",
  "PHOTO_IN_USE",
  "PLAN_READ_ONLY",
  "REQUEST_CONFLICT",
  "REQUEST_CHANGED",
  "REQUEST_NOT_FOUND",
  "INVALID_INPUT",
  "INVALID_IMAGE",
  "PHOTO_TOO_LARGE",
  "ASSISTANCE_IMAGE_TOO_LARGE",
  "NOT_FOUND",
]);
export function parseExternalPage(value: unknown): ExternalRequestPage {
  const page = value as ExternalRequestPage;
  if (
    !page ||
    !Number.isInteger(page.activeCount) ||
    page.activeCount < 0 ||
    page.activeCount > 30 ||
    (page.activeLimit !== undefined && page.activeLimit !== 30) ||
    (page.historyCount !== undefined &&
      (!Number.isSafeInteger(page.historyCount) || page.historyCount < 0)) ||
    typeof page.hasMore !== "boolean" ||
    !Array.isArray(page.requests) ||
    page.requests.length > 25
  )
    throw new Error("SUBMISSION_UNAVAILABLE");
  const requests = page.requests.map((row) => {
    if (!row || typeof row !== "object")
      throw new Error("SUBMISSION_UNAVAILABLE");
    const command = parseExternalCommand({
      senderCountry: row.sender_country ?? undefined,
      ...(row.price_basis === "seller_amount"
        ? { priceBasis: "seller_amount" }
        : {}),
      ...(row.approval_mode === "fixed"
        ? {
            approvalMode: "fixed",
            saleMethod: row.sale_method,
            agreementVersionId: row.agreement_version_id,
          }
        : {}),
      action: "submit",
      requestId: row.id,
      tenantId: row.tenant_id,
      description: row.description,
      brand: row.brand,
      condition: row.condition,
      notes: row.notes,
      desiredPriceOre: row.desired_price_ore,
      currency: row.currency,
      photos: row.photos,
    });
    if (
      (row.lifecycleStatus !== undefined &&
        ![
          "waiting",
          "offered",
          "accepted",
          "open",
          "received",
          "registered",
          "expired",
          "rejected",
          "declined",
          "cancelled",
          "withdrawn",
          "sold",
          "acquired",
          "ended",
        ].includes(row.lifecycleStatus)) ||
      (row.active !== undefined && typeof row.active !== "boolean") ||
      (row.canWithdraw !== undefined &&
        (typeof row.canWithdraw !== "boolean" ||
          (row.canWithdraw &&
            (row.lifecycleStatus !== "waiting" || row.active !== true)))) ||
      typeof row.store_name !== "string" ||
      (row.sale_method !== undefined &&
        row.sale_method !== "consignment" &&
        !(
          row.sale_method === "direct_purchase" && row.approval_mode === "fixed"
        )) ||
      (row.approval_mode !== undefined &&
        !["offer", "fixed"].includes(row.approval_mode)) ||
      (row.price_basis !== undefined &&
        !["resale", "seller_amount"].includes(row.price_basis)) ||
      row.store_name.length > 200 ||
      typeof row.created_at !== "string" ||
      !Number.isFinite(Date.parse(row.created_at)) ||
      !["waiting", "declined"].includes(row.status) ||
      (row.decline_note !== null &&
        (typeof row.decline_note !== "string" ||
          row.decline_note.length > 1000))
    )
      throw new Error("SUBMISSION_UNAVAILABLE");
    return {
      sender_country: command.senderCountry ?? null,
      id: command.requestId,
      tenant_id: command.tenantId,
      store_name: row.store_name,
      description: command.description,
      brand: command.brand,
      condition: command.condition,
      notes: command.notes,
      ...(row.staff_selects_method === true
        ? { staff_selects_method: true }
        : {}),
      ...(row.sale_method ? { sale_method: row.sale_method } : {}),
      desired_price_ore: command.desiredPriceOre,
      ...(row.price_basis ? { price_basis: row.price_basis } : {}),
      ...(row.approval_mode
        ? {
            approval_mode: row.approval_mode,
            agreement_version_id: row.agreement_version_id,
          }
        : {}),
      currency: command.currency,
      photos: command.photos,
      created_at: row.created_at,
      status: row.status,
      decline_note: row.decline_note,
      ...(row.lifecycleStatus ? { lifecycleStatus: row.lifecycleStatus } : {}),
      ...(row.active !== undefined ? { active: row.active } : {}),
      ...(row.canWithdraw !== undefined
        ? { canWithdraw: row.canWithdraw }
        : {}),
    };
  });
  return {
    activeCount: page.activeCount,
    hasMore: page.hasMore,
    requests,
    ...(page.activeLimit !== undefined
      ? { activeLimit: page.activeLimit }
      : {}),
    ...(page.historyCount !== undefined
      ? { historyCount: page.historyCount }
      : {}),
  };
}
export function createExternalRequestApi(deps: {
  endpoint: string | null;
  ownerId: string;
  session(): Promise<{ user: string; token: string } | null>;
  request(
    url: string,
    init: RequestInit,
  ): Promise<Pick<Response, "status" | "text">>;
}): ExternalRequestApi & {
  list(
    offset?: number,
    group?: "all" | "active" | "history",
  ): Promise<ExternalRequestPage>;
  withdraw(id: string): Promise<void>;
} {
  async function call(
    body: unknown,
    photo?: { id: string; bytes: Uint8Array },
  ) {
    if (!deps.endpoint) throw new Error("SUBMISSION_UNAVAILABLE");
    const session = await deps.session();
    if (!session || session.user !== deps.ownerId)
      throw new Error("SESSION_CHANGED");
    const controller = new AbortController(),
      timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await deps.request(
        deps.endpoint +
          (photo ? `/photos?photoId=${encodeURIComponent(photo.id)}` : ""),
        {
          method: "POST",
          redirect: "error",
          credentials: "omit",
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${session.token}`,
            "Content-Type": photo ? "image/jpeg" : "application/json",
          },
          body: photo ? new Uint8Array(photo.bytes) : JSON.stringify(body),
        },
      );
      const raw = await response.text();
      if (raw.length > 131072) throw new Error("SUBMISSION_UNAVAILABLE");
      let result: unknown;
      try {
        result = JSON.parse(raw);
      } catch {
        throw new Error("SUBMISSION_UNAVAILABLE");
      }
      if (response.status !== 200) {
        const code = (result as { error?: unknown } | null)?.error;
        throw new Error(
          typeof code === "string" &&
            safeErrors.has(code) &&
            response.status < 500
            ? code
            : "SUBMISSION_UNAVAILABLE",
        );
      }
      return result;
    } finally {
      clearTimeout(timeout);
    }
  }
  async function confirmed(
    body: unknown,
    id: string,
    photo?: { id: string; bytes: Uint8Array },
  ) {
    const result = (await call(body, photo)) as { id?: unknown } | null;
    if (result?.id !== id) throw new Error("SUBMISSION_UNAVAILABLE");
  }
  return {
    async lookup(id) {
      const page = parseExternalPage(
        await call({ action: "list", requestId: id, protocol: 2 }),
      );
      if (
        page.hasMore ||
        page.requests.length > 1 ||
        page.requests.some((r) => r.id !== id)
      )
        throw new Error("SUBMISSION_UNAVAILABLE");
      return page.requests[0] ?? null;
    },
    async list(offset = 0, group = "all") {
      return parseExternalPage(
        await call({ action: "list", offset, group, protocol: 2 }),
      );
    },
    async withdraw(id) {
      // One irreversible withdrawal per immutable request; retries, including
      // after a restart, reuse its identifier instead of creating a new intent.
      await confirmed(
        { action: "withdraw", requestId: id, operationId: id },
        id,
      );
    },
    async upload(id, bytes) {
      if (!bytes.length || bytes.length > 3 * 1024 * 1024)
        throw new Error("PHOTO_INVALID");
      await confirmed(null, id, { id, bytes });
    },
    async submit(command: ExternalItemCommand) {
      const parsed = parseExternalCommand(command);
      await confirmed(parsed, parsed.requestId);
    },
    async discardPhoto(id) {
      await confirmed({ action: "discardPhoto", photoId: id }, id);
    },
  };
}
