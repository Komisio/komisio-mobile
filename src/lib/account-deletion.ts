import type { Locale } from "./locale.ts";
import { mobileEndpoint } from "./mobile-command-http.ts";

export type DeletionState = {
  id: string;
  status: "requested" | "processing" | "completed";
  createdAt: string;
  respondBy: string;
  updatedAt: string;
  revision: string | null;
};
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function parseDeletion(value: unknown): DeletionState | null {
  if (!value || typeof value !== "object" || !Object.hasOwn(value, "request"))
    throw new Error("INVALID_REPLY");
  const r = (value as { request: unknown }).request;
  if (r === null) return null;
  if (!r || typeof r !== "object") throw new Error("INVALID_REPLY");
  const v = r as Record<string, unknown>;
  if (
    typeof v.id !== "string" ||
    !uuid.test(v.id) ||
    !["requested", "processing", "completed"].includes(String(v.status)) ||
    !["createdAt", "respondBy", "updatedAt"].every(
      (k) =>
        typeof v[k] === "string" && Number.isFinite(Date.parse(v[k] as string)),
    ) ||
    !(
      v.revision === null ||
      (typeof v.revision === "string" && uuid.test(v.revision))
    )
  )
    throw new Error("INVALID_REPLY");
  return {
    id: v.id,
    status: v.status as DeletionState["status"],
    createdAt: v.createdAt as string,
    respondBy: v.respondBy as string,
    updatedAt: v.updatedAt as string,
    revision: v.revision as string | null,
  };
}
export function createAccountDeletion(deps: {
  portal: string | undefined;
  session: () => Promise<{ user: string; token: string } | null>;
  request: (
    url: string,
    init: RequestInit,
  ) => Promise<Pick<Response, "status" | "text">>;
}) {
  const endpoint = mobileEndpoint(deps.portal)?.replace(
    /\/seller$/,
    "/account-deletion",
  );
  async function call(user: string, command: unknown) {
    if (!endpoint) throw new Error("NOT_CONFIGURED");
    const session = await deps.session();
    if (!session || session.user !== user) throw new Error("AUTH_REQUIRED");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await deps.request(endpoint, {
        method: "POST",
        credentials: "omit",
        redirect: "error",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${session.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });
      const text = await response.text();
      if (text.length > 4096) throw new Error("INVALID_REPLY");
      const body: unknown = JSON.parse(text);
      if (response.status !== 200) throw new Error("REQUEST_FAILED");
      // Do not let an old account's late response become the new account's state.
      if ((await deps.session())?.user !== user)
        throw new Error("AUTH_REQUIRED");
      return parseDeletion(body);
    } finally {
      clearTimeout(timeout);
    }
  }
  return {
    read: (user: string) => call(user, { action: "state" }),
    async submit(user: string, requestId: string, locale: Locale) {
      if (!uuid.test(requestId)) throw new Error("INVALID_INPUT");
      const result = await call(user, {
        action: "request",
        requestId,
        locale,
        confirmed: true,
      });
      if (!result) throw new Error("INVALID_REPLY");
      return result;
    },
  };
}
