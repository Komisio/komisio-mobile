import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import {
  createAccountAuth,
  accountAuthError,
} from "../src/lib/account-auth.ts";

const first = "10000000-0000-4000-8000-000000000001",
  other = "10000000-0000-4000-8000-000000000002";
function fixture() {
  const storage = new Map<string, string>();
  let signed: Session | null = null;
  let user = {
    id: first,
    email: "seller@example.test",
    email_confirmed_at: "2026-11-11",
    app_metadata: {},
    identities: [{ provider: "google" }, { provider: "apple" }],
  } as User;
  let moment = 100000,
    id = 0,
    blockedMfa = false;
  let duringRequest: (() => void) | null = null;
  let failure: Response | null = null;
  const requests: { url: URL; init: RequestInit }[] = [];
  const writes: string[] = [];
  const session = (value: User) =>
    ({
      user: value,
      access_token: `original:${value.id}`,
      refresh_token: "original-refresh",
    }) as Session;
  const auth = {
    getSession: async () => ({ data: { session: signed }, error: null }),
    getUser: async (token: string) => ({
      data: { user: token === "issued-token" ? user : signed?.user },
      error: null,
    }),
    setSession: async () => {
      writes.push("set");
      signed = session(user);
      return { data: { session: signed }, error: null };
    },
    refreshSession: async (original: Session) => {
      writes.push(`refresh:${original.access_token}`);
      signed = session(user);
      return { data: { session: signed }, error: null };
    },
    mfa: {
      getAuthenticatorAssuranceLevel: async () => ({
        data: { currentLevel: blockedMfa ? "aal1" : "aal2", nextLevel: "aal2" },
        error: null,
      }),
    },
  } as unknown as SupabaseClient["auth"];
  const dependencies = {
    auth,
    storage: {
      getItem: async (key: string) => storage.get(key) ?? null,
      setItem: async (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: async (key: string) => {
        storage.delete(key);
      },
    },
    url: "https://auth.example.test",
    key: "public-key",
    portal: "https://app.example.test",
    redirect: "komisio://auth-callback",
    random: () => `20000000-0000-4000-8000-${String(++id).padStart(12, "0")}`,
    now: () => moment,
    challenge: async (input: string, encoding: "hex" | "base64url") =>
      createHash("sha256").update(input).digest(encoding),
    request: (async (input: string | URL | Request, init: RequestInit) => {
      const url = new URL(String(input));
      requests.push({ url, init });
      duringRequest?.();
      if (failure) return failure;
      if (url.pathname.endsWith("/otp")) return Response.json({});
      if (url.pathname.endsWith("/settings"))
        return Response.json({ external: { apple: true, google: true } });
      if (url.pathname.endsWith("/identities/authorize"))
        return Response.json({
          url: "https://accounts.google.com/o/oauth2/auth",
        });
      return Response.json({
        access_token: "issued-token",
        refresh_token: "issued-refresh",
      });
    }) as typeof fetch,
  };
  return {
    api: createAccountAuth(dependencies),
    recreate: () => createAccountAuth(dependencies),
    storage,
    requests,
    writes,
    signIn: (id = first) => {
      signed = session({ ...user, id });
    },
    changeResult: (next: Partial<User>) => {
      user = { ...user, ...next };
    },
    expire: () => {
      moment += 3600001;
    },
    blockMfa: () => {
      blockedMfa = true;
    },
    requestHook: (hook: () => void) => {
      duringRequest = hook;
    },
    reject: (response: Response) => {
      failure = response;
    },
  };
}
function callback(flow: { id: string; redirect: string }) {
  return `${flow.redirect}&code=provider-code`;
}

test("email registration is store-independent and accepts only the verified requested address", async () => {
  const f = fixture(),
    ticket = await f.api.sendEmail(" Seller@Example.Test ", "sv");
  assert.equal(ticket.email, "seller@example.test");
  assert.deepEqual(JSON.parse(String(f.requests[0].init.body)), {
    email: "seller@example.test",
    create_user: true,
    data: { product_locale: "sv" },
  });
  assert.equal(
    new URL(
      f.requests[0].url.searchParams.get("redirect_to")!,
    ).searchParams.get("mobile_code"),
    "1",
  );
  assert.deepEqual(f.writes, []);
  await f.api.verifyEmail(ticket, "12345678");
  assert.deepEqual(f.writes, ["set"]);
});
test("email codes never replace a session which changed while the request was running", async () => {
  const f = fixture(),
    ticket = await f.api.sendEmail("seller@example.test", "sv");
  f.requestHook(() => f.signIn(other));
  await assert.rejects(f.api.verifyEmail(ticket, "12345678"), /AUTH_CHANGED/);
  assert.deepEqual(f.writes, []);
});
test("invalid, expired and unverified email responses cannot sign in", async () => {
  const f = fixture();
  await assert.rejects(f.api.sendEmail("bad", "sv"), /AUTH_INVALID_EMAIL/);
  const ticket = await f.api.sendEmail("seller@example.test", "sv");
  await assert.rejects(f.api.verifyEmail(ticket, "123"), /AUTH_INVALID_CODE/);
  f.changeResult({ email_confirmed_at: undefined });
  await assert.rejects(f.api.verifyEmail(ticket, "12345678"), /AUTH_CHANGED/);
  f.expire();
  await assert.rejects(f.api.verifyEmail(ticket, "12345678"), /AUTH_EXPIRED/);
  assert.deepEqual(f.writes, []);
});
test("Google uses a persisted S256 challenge and survives a cold callback without a store", async () => {
  const f = fixture(),
    flow = await f.api.beginOAuth("google", false),
    url = new URL(flow.url);
  const p = JSON.parse([...f.storage.values()][0]);
  assert.equal(url.searchParams.get("code_challenge_method"), "s256");
  assert.equal(
    url.searchParams.get("code_challenge"),
    createHash("sha256").update(p.verifier).digest("base64url"),
  );
  assert.equal(url.searchParams.get("prompt"), "select_account");
  assert.equal(url.searchParams.get("redirect_to"), flow.redirect);
  assert.equal(await f.recreate().finishOAuth(callback(flow)), false);
  assert.equal(f.storage.size, 0);
  assert.deepEqual(f.writes, ["set"]);
});
test("callbacks with another origin, flow, fragment or duplicate code fail before exchanging credentials", async () => {
  for (const change of [
    (u: string) => u.replace("komisio:", "other:"),
    (u: string) => u.replace("flow=", "other="),
    (u: string) => u + "#access_token=untrusted",
    (u: string) => u + "&code=second",
    (u: string) => u + "&flow=second",
  ]) {
    const f = fixture(),
      flow = await f.api.beginOAuth("google", false);
    await assert.rejects(f.api.finishOAuth(change(callback(flow))));
    assert.equal(f.requests.length, 0);
    assert.deepEqual(f.writes, []);
  }
});
test("callback completion deduplicates the browser and route handlers", async () => {
  const f = fixture(),
    flow = await f.api.beginOAuth("google", false);
  await Promise.all([
    f.api.finishOAuth(callback(flow)),
    f.api.finishOAuth(
      `komisio://auth-callback?code=provider-code&flow=${flow.id}`,
    ),
  ]);
  assert.equal(f.requests.length, 1);
  assert.deepEqual(f.writes, ["set"]);
});
test("explicit Google linking retains the current identity and refreshes its original MFA session", async () => {
  const f = fixture();
  f.signIn();
  const flow = await f.api.beginOAuth("google", true);
  assert.equal(
    (f.requests[0].init.headers as Record<string, string>).Authorization,
    `Bearer original:${first}`,
  );
  assert.equal(
    f.requests[0].url.searchParams.get("skip_http_redirect"),
    "true",
  );
  assert.equal(await f.api.finishOAuth(callback(flow)), true);
  assert.deepEqual(f.writes, [`refresh:original:${first}`]);
});
test("linking never adopts a different provider account or an actor switched during authentication", async () => {
  for (const changedActor of [false, true]) {
    const f = fixture();
    f.signIn();
    const flow = await f.api.beginOAuth("google", true);
    if (changedActor) f.signIn(other);
    else f.changeResult({ id: other });
    await assert.rejects(f.api.finishOAuth(callback(flow)), /AUTH_CHANGED/);
    assert.deepEqual(f.writes, []);
  }
});
test("native Apple binds its nonce and state and links using the original bearer identity", async () => {
  const f = fixture();
  f.signIn();
  let nonceHash = "";
  await f.api.apple(true, async (nonce, state) => {
    nonceHash = nonce;
    return { token: "apple-id-token", state };
  });
  const body = JSON.parse(String(f.requests[0].init.body));
  assert.equal(body.link_identity, true);
  assert.equal(
    nonceHash,
    createHash("sha256").update(body.nonce).digest("hex"),
  );
  assert.equal(
    (f.requests[0].init.headers as Record<string, string>).Authorization,
    `Bearer original:${first}`,
  );
  assert.deepEqual(f.writes, [`refresh:original:${first}`]);
});
test("Apple cancellation, state mismatch, MFA and changed identity never submit a linking request", async () => {
  const mismatch = fixture();
  await assert.rejects(
    mismatch.api.apple(false, async () => ({ token: "token", state: "wrong" })),
    /AUTH_CHANGED/,
  );
  assert.equal(mismatch.requests.length, 0);
  const mfa = fixture();
  mfa.signIn();
  mfa.blockMfa();
  await assert.rejects(mfa.api.beginOAuth("google", true), /MFA_REQUIRED/);
  const changed = fixture();
  changed.signIn();
  await assert.rejects(
    changed.api.apple(true, async (_, state) => {
      changed.signIn(other);
      return { token: "token", state };
    }),
    /AUTH_CHANGED/,
  );
  assert.equal(changed.requests.length, 0);
  assert.equal(
    accountAuthError({ code: "ERR_REQUEST_CANCELED" }),
    "AUTH_CANCELLED",
  );
});
test("expired flows and missing provider evidence never establish a session", async () => {
  const f = fixture(),
    flow = await f.api.beginOAuth("google", false);
  f.expire();
  await assert.rejects(f.api.finishOAuth(callback(flow)), /AUTH_EXPIRED/);
  assert.equal(f.requests.length, 0);
  const wrong = fixture(),
    second = await wrong.api.beginOAuth("google", false);
  wrong.changeResult({ identities: [] });
  await assert.rejects(wrong.api.finishOAuth(callback(second)), /AUTH_CHANGED/);
  assert.deepEqual(wrong.writes, []);
});
