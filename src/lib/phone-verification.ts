import type { Session, SupabaseClient } from "@supabase/supabase-js";

type Auth = Pick<
  SupabaseClient["auth"],
  | "getSession"
  | "getUser"
  | "signInWithOtp"
  | "updateUser"
  | "setSession"
  | "refreshSession"
>;
export type PhoneTicket = { phone: string; userId: string | null };
export type VerifyPhoneCode = (input: {
  phone: string;
  token: string;
  type: "sms" | "phone_change";
  accessToken?: string;
}) => Promise<Session>;

export function normalizedPhone(input: string) {
  const phone = input.trim().replace(/[\s()-]/g, "");
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) throw new Error("PHONE_INVALID");
  return phone;
}

export function phoneError(error: unknown): Error {
  const code = (error as { code?: string } | null)?.code;
  const status = (error as { status?: number } | null)?.status;
  if (status === 429 || code === "over_sms_send_rate_limit")
    return new Error("PHONE_RATE_LIMIT");
  if (["otp_expired", "invalid_otp"].includes(code ?? ""))
    return new Error("PHONE_CODE_INVALID");
  if (["phone_exists", "user_already_exists"].includes(code ?? ""))
    return new Error("PHONE_ALREADY_USED");
  if (code === "insufficient_aal") return new Error("MFA_REQUIRED");
  return new Error("PHONE_UNAVAILABLE");
}

async function session(auth: Auth) {
  const result = await auth.getSession();
  if (result.error) throw new Error("PHONE_UNAVAILABLE");
  return result.data.session;
}
function sameIdentity(current: Session | null, expected: string | null) {
  if ((current?.user.id ?? null) !== expected)
    throw new Error("SESSION_CHANGED");
}
function verifiedPhone(current: Session, phone: string) {
  return Boolean(
    current.user.phone_confirmed_at && current.user.phone === phone.slice(1),
  );
}

/** A logged-in seller adds a phone to the same identity; this never signs them in again. */
export async function beginPhoneVerification(
  auth: Auth,
  input: string,
): Promise<PhoneTicket> {
  const phone = normalizedPhone(input);
  const current = await session(auth);
  const result = current
    ? await auth.updateUser({ phone })
    : await auth.signInWithOtp({ phone, options: { shouldCreateUser: true } });
  if (result.error) throw phoneError(result.error);
  sameIdentity(await session(auth), current?.user.id ?? null);
  return { phone, userId: current?.user.id ?? null };
}

/** Phone-change verification can issue aal1. Keep that session isolated and
 * refresh the original session instead, preserving its identity and MFA level. */
export async function finishPhoneVerification(
  auth: Auth,
  verify: VerifyPhoneCode,
  ticket: PhoneTicket,
  token: string,
) {
  if (!/^\d{6}$/.test(token)) throw new Error("PHONE_CODE_INVALID");
  const phone = normalizedPhone(ticket.phone);
  const before = await session(auth);
  sameIdentity(before, ticket.userId);
  const confirmed = await verify({
    phone,
    token,
    type: ticket.userId ? "phone_change" : "sms",
    ...(before ? { accessToken: before.access_token } : {}),
  });
  if (!verifiedPhone(confirmed, phone)) throw new Error("PHONE_UNAVAILABLE");
  if (ticket.userId && confirmed.user.id !== ticket.userId)
    throw new Error("SESSION_CHANGED");
  const current = await session(auth);
  sameIdentity(current, ticket.userId);
  const result = current
    ? await auth.refreshSession(current)
    : await auth.setSession({
        access_token: confirmed.access_token,
        refresh_token: confirmed.refresh_token,
      });
  if (result.error || !result.data.session)
    throw new Error("PHONE_UNAVAILABLE");
  if (result.data.session.user.id !== confirmed.user.id)
    throw new Error("SESSION_CHANGED");
  // Read the actual Auth record, not user-editable metadata or stale local claims.
  const user = await auth.getUser(result.data.session.access_token);
  if (user.error || !user.data.user || user.data.user.id !== confirmed.user.id)
    throw new Error("PHONE_UNAVAILABLE");
  if (!verifiedPhone({ ...result.data.session, user: user.data.user }, phone))
    throw new Error("PHONE_UNAVAILABLE");
  return user.data.user.id;
}
