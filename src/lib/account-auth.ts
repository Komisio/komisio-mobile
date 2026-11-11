import type { SupabaseClient, User } from "@supabase/supabase-js";

export type AccountProvider = "apple" | "google";
type Auth = Pick<
  SupabaseClient["auth"],
  "getSession" | "getUser" | "setSession" | "refreshSession" | "mfa"
>;
type Storage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};
type Pending = {
  id: string;
  owner: string | null;
  provider: AccountProvider;
  verifier: string;
  created: number;
  redirect: string;
  binding: string;
};
export type EmailTicket = { email: string; created: number };
const pendingKey = "komisio.account-oauth.v1";
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

export function accountAuthError(error: unknown): string {
  const e = error as { code?: string; status?: number; message?: string };
  if (e?.status === 429 || e?.code === "over_email_send_rate_limit")
    return "AUTH_RATE_LIMIT";
  if (["otp_expired", "invalid_otp"].includes(e?.code ?? ""))
    return "AUTH_INVALID_CODE";
  if (
    [
      "identity_already_exists",
      "identity_already_linked",
      "email_exists",
    ].includes(e?.code ?? "")
  )
    return "AUTH_IDENTITY_USED";
  if (["ERR_REQUEST_CANCELED", "access_denied"].includes(e?.code ?? ""))
    return "AUTH_CANCELLED";
  if (
    [
      "AUTH_INVALID_EMAIL",
      "AUTH_INVALID_CODE",
      "AUTH_EXPIRED",
      "AUTH_CHANGED",
      "AUTH_BUSY",
      "AUTH_UNAVAILABLE",
      "AUTH_RATE_LIMIT",
      "AUTH_IDENTITY_USED",
      "AUTH_CANCELLED",
      "MFA_REQUIRED",
    ].includes(e?.message ?? "")
  )
    return e.message!;
  return "AUTH_FAILED";
}

/** Provider replies never write the app session until the initiating identity is checked. */
export function createAccountAuth(deps: {
  auth: Auth;
  storage: Storage;
  request: typeof fetch;
  url: string;
  key: string;
  portal: string;
  redirect: string;
  random: () => string;
  challenge: (value: string, encoding: "base64url" | "hex") => Promise<string>;
  now?: () => number;
}) {
  const now = deps.now ?? Date.now;
  const binding = deps.url;
  let working = false;
  let completion: { url: string; promise: Promise<boolean> } | null = null;
  async function exclusive<T>(work: () => Promise<T>): Promise<T> {
    if (working) throw new Error("AUTH_BUSY");
    working = true;
    try {
      return await work();
    } finally {
      working = false;
    }
  }
  async function current() {
    const r = await deps.auth.getSession();
    if (r.error) throw new Error("AUTH_FAILED");
    return r.data.session;
  }
  async function same(owner: string | null) {
    const session = await current();
    if ((session?.user.id ?? null) !== owner) throw new Error("AUTH_CHANGED");
    return session;
  }
  async function initiating(link: boolean) {
    const session = await current();
    if (link !== Boolean(session)) throw new Error("AUTH_CHANGED");
    if (session) {
      const user = await deps.auth.getUser(session.access_token);
      if (
        user.error ||
        user.data.user?.id !== session.user.id ||
        user.data.user.app_metadata?.komisio_password_recovery_pending === true
      )
        throw new Error("AUTH_CHANGED");
      const assurance = await deps.auth.mfa.getAuthenticatorAssuranceLevel(
        session.access_token,
      );
      if (assurance.error || !assurance.data) throw new Error("AUTH_FAILED");
      if (
        assurance.data.nextLevel === "aal2" &&
        assurance.data.currentLevel !== "aal2"
      )
        throw new Error("MFA_REQUIRED");
    }
    return session;
  }
  async function api(path: string, body?: object, token?: string) {
    const r = await deps.request(`${deps.url}/auth/v1/${path}`, {
      method: body ? "POST" : "GET",
      redirect: "error",
      headers: {
        apikey: deps.key,
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(25000),
    });
    const text = await r.text();
    if (text.length > 131072) throw new Error("AUTH_FAILED");
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("AUTH_FAILED");
    }
    if (!r.ok)
      throw Object.assign(new Error("AUTH_FAILED"), {
        status: r.status,
        code: data.error_code ?? data.code,
      });
    return data;
  }
  async function accept(
    data: Record<string, unknown>,
    owner: string | null,
    match: (user: User) => boolean,
  ) {
    if (
      typeof data.access_token !== "string" ||
      typeof data.refresh_token !== "string"
    )
      throw new Error("AUTH_FAILED");
    const verified = await deps.auth.getUser(data.access_token);
    const user = verified.data.user;
    if (verified.error || !user || !match(user) || (owner && user.id !== owner))
      throw new Error("AUTH_CHANGED");
    const original = await same(owner);
    if (original) {
      // Linking may issue aal1. Refresh the original session instead of replacing its MFA assurance.
      const result = await deps.auth.refreshSession(original);
      if (result.error || result.data.session?.user.id !== owner)
        throw new Error("AUTH_CHANGED");
    } else {
      const result = await deps.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      if (result.error || result.data.session?.user.id !== user.id)
        throw new Error("AUTH_FAILED");
    }
  }
  function email(value: string) {
    const address = value.trim().toLowerCase();
    if (address.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address))
      throw new Error("AUTH_INVALID_EMAIL");
    return address;
  }
  async function pending(): Promise<Pending> {
    const raw = await deps.storage.getItem(pendingKey);
    let p: Pending;
    try {
      p = JSON.parse(raw ?? "null");
    } catch {
      throw new Error("AUTH_EXPIRED");
    }
    if (
      !p ||
      !uuid.test(p.id) ||
      (p.owner !== null && !uuid.test(p.owner)) ||
      !["apple", "google"].includes(p.provider) ||
      !/^[a-f0-9]{64}$/.test(p.verifier) ||
      p.binding !== binding ||
      p.redirect !== deps.redirect ||
      !Number.isFinite(p.created) ||
      now() < p.created ||
      now() - p.created > 600000
    )
      throw new Error("AUTH_EXPIRED");
    return p;
  }
  return {
    async providers() {
      const result = await api("settings");
      const external = result.external as Record<string, unknown> | undefined;
      return {
        apple: external?.apple === true,
        google: external?.google === true,
      };
    },
    sendEmail(value: string, locale: string) {
      return exclusive(async () => {
        await initiating(false);
        const address = email(value);
        const redirect = new URL("/auth/callback", deps.portal);
        redirect.searchParams.set("mobile_code", "1");
        redirect.searchParams.set("locale", locale === "da" ? "dk" : locale);
        await api(`otp?redirect_to=${encodeURIComponent(redirect.href)}`, {
          email: address,
          create_user: true,
          data: { product_locale: locale === "da" ? "dk" : locale },
        });
        await same(null);
        return { email: address, created: now() };
      });
    },
    verifyEmail(ticket: EmailTicket, code: string) {
      return exclusive(async () => {
        await same(null);
        if (now() - ticket.created > 3600000 || now() < ticket.created)
          throw new Error("AUTH_EXPIRED");
        if (!/^\d{6,10}$/.test(code)) throw new Error("AUTH_INVALID_CODE");
        const address = email(ticket.email);
        const data = await api("verify", {
          email: address,
          token: code,
          type: "email",
        });
        await accept(
          data,
          null,
          (user) =>
            Boolean(user.email_confirmed_at) &&
            user.email?.toLowerCase() === address,
        );
      });
    },
    apple(
      link: boolean,
      credential: (
        nonceHash: string,
        state: string,
      ) => Promise<{ token: string; state: string | null }>,
    ) {
      return exclusive(async () => {
        const original = await initiating(link),
          owner = original?.user.id ?? null;
        const nonce =
          deps.random().replaceAll("-", "") + deps.random().replaceAll("-", "");
        const state = deps.random();
        const result = await credential(
          await deps.challenge(nonce, "hex"),
          state,
        );
        if (result.state !== state || !result.token)
          throw new Error("AUTH_CHANGED");
        await same(owner);
        const data = await api(
          "token?grant_type=id_token",
          {
            provider: "apple",
            id_token: result.token,
            nonce,
            ...(owner ? { link_identity: true } : {}),
          },
          original?.access_token,
        );
        await accept(data, owner, (user) =>
          Boolean(user.identities?.some((i) => i.provider === "apple")),
        );
      });
    },
    beginOAuth(provider: AccountProvider, link: boolean) {
      return exclusive(async () => {
        const original = await initiating(link),
          owner = original?.user.id ?? null;
        const verifier =
          deps.random().replaceAll("-", "") + deps.random().replaceAll("-", "");
        const id = deps.random();
        const redirect = new URL(deps.redirect);
        redirect.searchParams.set("flow", id);
        const params = new URLSearchParams({
          provider,
          redirect_to: redirect.href,
          code_challenge: await deps.challenge(verifier, "base64url"),
          code_challenge_method: "s256",
        });
        if (provider === "google") params.set("prompt", "select_account");
        await same(owner);
        let url = `${deps.url}/auth/v1/authorize?${params}`;
        if (original) {
          const result = await api(
            `user/identities/authorize?${params}&skip_http_redirect=true`,
            undefined,
            original.access_token,
          );
          if (
            typeof result.url !== "string" ||
            new URL(result.url).protocol !== "https:"
          )
            throw new Error("AUTH_FAILED");
          url = result.url;
        }
        await same(owner);
        await deps.storage.setItem(
          pendingKey,
          JSON.stringify({
            id,
            owner,
            provider,
            verifier,
            created: now(),
            redirect: deps.redirect,
            binding,
          } satisfies Pending),
        );
        completion = null;
        return { id, url, redirect: redirect.href };
      });
    },
    finishOAuth(url: string): Promise<boolean> {
      // The OS browser and Router may order callback parameters differently.
      // Both must share one exchange because the authorization code is single-use.
      let canonical: string;
      try {
        const parsed = new URL(url);
        parsed.searchParams.sort();
        canonical = parsed.href;
      } catch {
        return Promise.reject(new Error("AUTH_EXPIRED"));
      }
      if (completion?.url === canonical) return completion.promise;
      const promise = exclusive(async () => {
        const p = await pending();
        const callback = new URL(url),
          expected = new URL(p.redirect);
        if (
          callback.protocol !== expected.protocol ||
          callback.host !== expected.host ||
          callback.pathname !== expected.pathname ||
          callback.searchParams.get("flow") !== p.id ||
          callback.searchParams.getAll("flow").length !== 1 ||
          callback.hash
        )
          throw new Error("AUTH_CHANGED");
        await same(p.owner);
        if (callback.searchParams.has("error")) {
          await deps.storage.removeItem(pendingKey);
          throw new Error("AUTH_CANCELLED");
        }
        const code = callback.searchParams.get("code");
        if (
          !code ||
          code.length > 2048 ||
          callback.searchParams.getAll("code").length !== 1
        )
          throw new Error("AUTH_EXPIRED");
        const data = await api("token?grant_type=pkce", {
          auth_code: code,
          code_verifier: p.verifier,
        });
        await accept(data, p.owner, (user) =>
          Boolean(user.identities?.some((i) => i.provider === p.provider)),
        );
        await deps.storage.removeItem(pendingKey);
        return p.owner !== null;
      });
      completion = { url: canonical, promise };
      return promise;
    },
    async cancelOAuth(id: string) {
      const p = await pending().catch(() => null);
      if (p?.id === id) await deps.storage.removeItem(pendingKey);
    },
  };
}
