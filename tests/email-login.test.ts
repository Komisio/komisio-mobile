import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createEmailLogin } from "../src/lib/email-login.ts";

function fixture() {
  let owner = "phone-owner";
  let user = {
    id: owner,
    phone: "46700000000",
    phone_confirmed_at: "2026-11-11",
  } as User;
  let mfa = false;
  let beforeUser: (() => void) | undefined;
  let onRequest: (() => void) | undefined;
  let response: Response | undefined;
  const requests: { url: string; init: RequestInit }[] = [];
  const session = () => ({
    data: { session: { user: { id: owner }, access_token: `token:${owner}` } },
    error: null,
  });
  const auth = {
    getSession: async () => session(),
    getUser: async () => {
      beforeUser?.();
      return { data: { user }, error: null };
    },
    refreshSession: async () => session(),
    mfa: {
      getAuthenticatorAssuranceLevel: async () => ({
        data: { currentLevel: "aal1", nextLevel: mfa ? "aal2" : "aal1" },
        error: null,
      }),
    },
  } as unknown as SupabaseClient["auth"];
  const api = createEmailLogin({
    auth,
    owner,
    url: "https://auth.example.test",
    key: "public-key",
    redirect: "https://app.example.test/auth/callback",
    request: async (input, init) => {
      requests.push({ url: String(input), init: init! });
      onRequest?.();
      return response ?? Response.json(user);
    },
  });
  return {
    api,
    requests,
    verifyEmail() {
      user = {
        ...user,
        email: "seller@example.test",
        email_confirmed_at: "2026-11-11",
      };
    },
    switchOwner() {
      owner = "different-owner";
    },
    needMfa() {
      mfa = true;
    },
    duringIdentity(fn: () => void) {
      beforeUser = fn;
    },
    duringRequest(fn: () => void) {
      onRequest = fn;
    },
    respond(r: Response) {
      response = r;
    },
  };
}

test("adds an email to the verified phone owner without creating or matching accounts", async () => {
  const f = fixture();
  await f.api.begin(" Seller@Example.test ");
  assert.equal(f.requests.length, 1);
  const { url, init } = f.requests[0];
  assert.equal(new URL(url).pathname, "/auth/v1/user");
  assert.equal(
    new URL(url).searchParams.get("redirect_to"),
    "https://app.example.test/auth/callback",
  );
  assert.equal(init.method, "PUT");
  assert.equal(
    new Headers(init.headers).get("Authorization"),
    "Bearer token:phone-owner",
  );
  assert.deepEqual(JSON.parse(String(init.body)), {
    email: "seller@example.test",
  });
});

test("password is unavailable until the email is verified", async () => {
  const f = fixture();
  await assert.rejects(f.api.confirm(), /EMAIL_NOT_CONFIRMED/);
  await assert.rejects(
    f.api.password("long-enough-password"),
    /EMAIL_NOT_CONFIRMED/,
  );
  assert.equal(f.requests.length, 0);
  f.verifyEmail();
  await f.api.password("long-enough-password");
  assert.deepEqual(JSON.parse(String(f.requests[0].init.body)), {
    password: "long-enough-password",
  });
  await assert.rejects(
    f.api.begin("another@example.test"),
    /EMAIL_ALREADY_SET/,
  );
});

test("account changes and outstanding MFA fail closed before credential writes", async () => {
  for (const trigger of ["before", "during", "mfa"] as const) {
    const f = fixture();
    if (trigger === "before") f.switchOwner();
    if (trigger === "during") f.duringIdentity(f.switchOwner);
    if (trigger === "mfa") f.needMfa();
    await assert.rejects(
      f.api.begin("seller@example.test"),
      /SESSION_CHANGED|MFA_REQUIRED/,
    );
    assert.equal(f.requests.length, 0);
  }
});

test("a late account change cannot redirect a credential write to the next user", async () => {
  const f = fixture();
  f.duringRequest(f.switchOwner);
  await assert.rejects(f.api.begin("seller@example.test"), /SESSION_CHANGED/);
  assert.equal(
    new Headers(f.requests[0].init.headers).get("Authorization"),
    "Bearer token:phone-owner",
  );
});

test("address conflicts remain explicit and never trigger signup or linking", async () => {
  const f = fixture();
  f.respond(Response.json({ code: "email_exists" }, { status: 422 }));
  await assert.rejects(f.api.begin("used@example.test"), /email_exists/);
  assert.equal(f.requests.length, 1);
});

test("secure password change supports an email reauthentication code and empty success response", async () => {
  const f = fixture();
  f.verifyEmail();
  f.respond(new Response(null, { status: 204 }));
  await f.api.reauthenticate();
  assert.equal(new URL(f.requests[0].url).pathname, "/auth/v1/reauthenticate");
  assert.equal(f.requests[0].init.method, "GET");
  await assert.rejects(
    f.api.password("long-enough-password", "not-a-code"),
    /reauthentication_not_valid/,
  );
  assert.equal(f.requests.length, 1);
});
