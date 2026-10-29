import type { CommandOutcome } from "./pending-command.ts";
import type { BankCommand } from "./bank-account.ts";

export type CommandTransport = {
  endpoint: string | null;
  user: string;
  session: () => Promise<{ user: string; token: string } | null>;
  request: (
    url: string,
    init: RequestInit,
  ) => Promise<Pick<Response, "status" | "text">>;
};

export function sendBankCommand(command: BankCommand, deps: CommandTransport) {
  return sendMobileCommand(command, deps, bankCommandOutcome);
}

export async function sendMobileCommand<C extends { requestId: string }>(
  command: C,
  deps: CommandTransport,
  outcome: (status: number, body: unknown, requestId: string) => CommandOutcome,
): Promise<CommandOutcome> {
  const unknown: CommandOutcome = { kind: "unknown", code: "UNKNOWN" };
  if (!deps.endpoint) return { kind: "rejected", code: "NOT_CONFIGURED" };
  const session = await deps.session();
  if (!session || session.user !== deps.user)
    return { kind: "unknown", code: "AUTH_REQUIRED" };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await deps.request(deps.endpoint, {
      method: "POST",
      redirect: "error",
      credentials: "omit",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`,
      },
      body: JSON.stringify(command),
    });
    const text = await response.text();
    if (text.length > 4096) return unknown;
    const body: unknown = JSON.parse(text);
    return (
      commandRefusal(response.status, body) ??
      outcome(response.status, body, command.requestId)
    );
  } catch {
    return unknown;
  } finally {
    clearTimeout(timeout);
  }
}

/** Only explicit API refusals, never generic proxy responses or 5xx errors.
 * The journal controller only settles these on the first attempt. */
export function commandRefusal(
  status: number,
  body: unknown,
): CommandOutcome | null {
  const code = (body as { error?: unknown } | null)?.error;
  if (
    ([400, 413, 415].includes(status) && code === "INVALID_INPUT") ||
    (status === 403 && code === "FORBIDDEN") ||
    (status === 404 && code === "NOT_FOUND") ||
    (status === 409 && code === "SELLER_CLOSED")
  )
    return { kind: "rejected", code: String(code) };
  return null;
}

export function mobileEndpoint(value: string | undefined): string | null {
  if (!value || /[\s\\]/.test(value)) return null;
  try {
    const url = new URL(value);
    if (
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== "/" ||
      (url.protocol !== "https:" &&
        !(
          url.protocol === "http:" &&
          ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
        ))
    )
      return null;
    return `${url.origin}/api/mobile/v1/seller`;
  } catch {
    return null;
  }
}
export function bankCommandOutcome(
  status: number,
  body: unknown,
  requestId: string,
): CommandOutcome {
  const value = body as { ok?: unknown; id?: unknown; error?: unknown } | null;
  if (status === 200 && value?.ok === true && value.id === requestId)
    return { kind: "success", id: requestId };
  // This engine check follows request replay, so it proves this command was not saved.
  if (status === 409 && value?.error === "BANK_DETAILS_CHANGED")
    return { kind: "conflict", code: "BANK_DETAILS_CHANGED" };
  // An auth/validation failure on retry cannot disprove an earlier committed write.
  const code = [
    "AUTH_REQUIRED",
    "MFA_REQUIRED",
    "PASSWORD_UPDATE_REQUIRED",
  ].includes(String(value?.error))
    ? String(value!.error)
    : "UNKNOWN";
  return { kind: "unknown", code };
}
