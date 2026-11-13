import {
  parsePhotoAnalysis,
  type PhotoAnalysisCommand,
} from "./photo-analysis.ts";
const errors = new Set([
  "PHONE_VERIFICATION_REQUIRED",
  "AUTH_REQUIRED",
  "MFA_REQUIRED",
  "PASSWORD_UPDATE_REQUIRED",
  "ASSISTANCE_DISABLED",
  "ASSISTANCE_LIMIT",
  "AI_CREDITS_EXHAUSTED",
  "AI_CAP_REACHED",
  "USAGE_QUOTA_EXCEEDED",
  "PHOTO_NOT_FOUND",
  "STORE_UNAVAILABLE",
  "STORE_CHANGED",
  "REQUEST_CONFLICT",
  "PLAN_READ_ONLY",
  "NOT_FOUND",
]);
export function createPhotoAnalysisApi(deps: {
  endpoint: string | null;
  ownerId: string;
  session(): Promise<{ user: string; token: string } | null>;
  request(
    url: string,
    init: RequestInit,
  ): Promise<Pick<Response, "status" | "text">>;
}) {
  return async (command: PhotoAnalysisCommand) => {
    if (!deps.endpoint) throw new Error("ASSISTANCE_UNAVAILABLE");
    const session = await deps.session();
    if (!session || session.user !== deps.ownerId)
      throw new Error("SESSION_CHANGED");
    const controller = new AbortController(),
      timeout = setTimeout(() => controller.abort(), 55000);
    try {
      const response = await deps.request(deps.endpoint + "/assistance", {
        method: "POST",
        redirect: "error",
        credentials: "omit",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${session.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });
      const text = await response.text();
      if (text.length > 10000) throw new Error("ASSISTANCE_UNAVAILABLE");
      if ((await deps.session())?.user !== deps.ownerId)
        throw new Error("SESSION_CHANGED");
      const raw = JSON.parse(text);
      if (response.status !== 200)
        throw new Error(
          errors.has(raw?.error) ? raw.error : "ASSISTANCE_UNAVAILABLE",
        );
      const result = parsePhotoAnalysis(raw?.result);
      if (result && result.id !== command.requestId)
        throw new Error("ASSISTANCE_UNAVAILABLE");
      return result;
    } finally {
      clearTimeout(timeout);
    }
  };
}
