import type { SupabaseClient, User } from "@supabase/supabase-js";

type Auth = Pick<
  SupabaseClient["auth"],
  "getSession" | "getUser" | "refreshSession" | "mfa"
>;
type Options = {
  auth: Auth;
  owner: string;
  url: string;
  key: string;
  redirect: string;
  request?: typeof fetch;
};

/** Credentials are written with the captured owner's token, never a later account's session. */
export function createEmailLogin({
  auth,
  owner,
  url,
  key,
  redirect,
  request = fetch,
}: Options) {
  const endpoint = new URL("/auth/v1/", url);
  if (
    endpoint.protocol !== "https:" &&
    !["127.0.0.1", "localhost"].includes(endpoint.hostname)
  )
    throw new Error("EMAIL_UNAVAILABLE");

  async function identity() {
    const { data, error } = await auth.getSession();
    if (error || data.session?.user.id !== owner)
      throw new Error("SESSION_CHANGED");
    const token = data.session.access_token;
    const verified = await auth.getUser(token);
    if (verified.error || verified.data.user?.id !== owner)
      throw new Error("SESSION_CHANGED");
    if (!verified.data.user.phone || !verified.data.user.phone_confirmed_at)
      throw new Error("PHONE_REQUIRED");
    const assurance = await auth.mfa.getAuthenticatorAssuranceLevel();
    if (
      assurance.error ||
      (assurance.data.nextLevel === "aal2" &&
        assurance.data.currentLevel !== "aal2")
    )
      throw new Error("MFA_REQUIRED");
    const current = await auth.getSession();
    if (current.error || current.data.session?.user.id !== owner)
      throw new Error("SESSION_CHANGED");
    return { token, user: verified.data.user };
  }

  async function send(
    path: string,
    token: string,
    body?: Record<string, string>,
  ) {
    const target = new URL(path, endpoint);
    if (body?.email) target.searchParams.set("redirect_to", redirect);
    const response = await request(target.href, {
      method: body ? "PUT" : "GET",
      headers: {
        apikey: key,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      redirect: "error",
      signal: AbortSignal.timeout(20_000),
    });
    const result = response.status === 204 ? null : await response.json();
    if (!response.ok) {
      const code = result?.code ?? result?.error_code;
      throw new Error(
        [
          "email_exists",
          "email_address_invalid",
          "reauthentication_needed",
          "reauthentication_not_valid",
          "weak_password",
          "same_password",
          "over_email_send_rate_limit",
          "over_request_rate_limit",
        ].includes(code)
          ? code
          : "EMAIL_UNAVAILABLE",
      );
    }
    if (body && result?.id !== owner) throw new Error("SESSION_CHANGED");
    return result as User;
  }

  async function refresh() {
    const current = await auth.getSession();
    if (current.error || current.data.session?.user.id !== owner)
      throw new Error("SESSION_CHANGED");
    const refreshed = await auth.refreshSession();
    if (refreshed.error || refreshed.data.session?.user.id !== owner)
      throw new Error("SESSION_CHANGED");
    return (await identity()).user;
  }

  return {
    async read() {
      return (await identity()).user;
    },
    async begin(value: string) {
      const email = value.trim().toLowerCase();
      if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        throw new Error("email_address_invalid");
      const { token, user } = await identity();
      if (user.email && user.email_confirmed_at)
        throw new Error("EMAIL_ALREADY_SET");
      await send("user", token, { email });
      return refresh();
    },
    async confirm() {
      const user = await refresh();
      if (!user.email || !user.email_confirmed_at)
        throw new Error("EMAIL_NOT_CONFIRMED");
      return user;
    },
    async password(value: string, nonce?: string) {
      if (value.length < 12) throw new Error("weak_password");
      const { token, user } = await identity();
      if (!user.email || !user.email_confirmed_at)
        throw new Error("EMAIL_NOT_CONFIRMED");
      if (nonce && !/^\d{6,10}$/.test(nonce))
        throw new Error("reauthentication_not_valid");
      await send("user", token, {
        password: value,
        ...(nonce ? { nonce } : {}),
      });
      return refresh();
    },
    async reauthenticate() {
      const { token, user } = await identity();
      if (!user.email || !user.email_confirmed_at)
        throw new Error("EMAIL_NOT_CONFIRMED");
      await send("reauthenticate", token);
    },
  };
}
