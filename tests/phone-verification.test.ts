import { test } from "node:test";
import assert from "node:assert/strict";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import {
  beginPhoneVerification,
  finishPhoneVerification,
  normalizedPhone,
  phoneError,
} from "../src/lib/phone-verification.ts";

const phone = "+46700000001";
const makeSession = (id: string, token = "original-aal2") =>
  ({
    access_token: token,
    refresh_token: "refresh-" + token,
    user: { id, phone: phone.slice(1), phone_confirmed_at: "2026-11-10" },
  }) as Session;
function fixture(initial: Session | null) {
  let current = initial;
  const calls: { name: string; value?: unknown }[] = [];
  const auth = {
    async getSession() {
      return { data: { session: current }, error: null };
    },
    async getUser() {
      return { data: { user: current?.user ?? null }, error: null };
    },
    async updateUser(value: unknown) {
      calls.push({ name: "update", value });
      return { error: null };
    },
    async signInWithOtp(value: unknown) {
      calls.push({ name: "sms", value });
      return { error: null };
    },
    async refreshSession(value: Session) {
      calls.push({ name: "refresh", value });
      return { data: { session: current }, error: null };
    },
    async setSession(value: unknown) {
      calls.push({ name: "install", value });
      current = makeSession("new", "phone-aal1");
      return { data: { session: current }, error: null };
    },
  } as unknown as SupabaseClient["auth"];
  return {
    auth,
    calls,
    change: (next: Session | null) => {
      current = next;
    },
  };
}
test("normalizes presentation characters without inventing a country", () => {
  assert.equal(normalizedPhone(" +46 (70) 000-00-01 "), phone);
  for (const input of [
    "0700000001",
    "+046700000001",
    "+46abc",
    "+123",
    "+1234567890123456",
  ])
    assert.throws(() => normalizedPhone(input), /PHONE_INVALID/);
});
test("guest requests an SMS without establishing a session", async () => {
  const f = fixture(null);
  assert.deepEqual(await beginPhoneVerification(f.auth, phone), {
    phone,
    userId: null,
  });
  assert.deepEqual(
    f.calls.map((c) => c.name),
    ["sms"],
  );
  assert.equal((await f.auth.getSession()).data.session, null);
});
test("existing seller adds a phone without switching identity", async () => {
  const f = fixture(makeSession("seller"));
  assert.deepEqual(await beginPhoneVerification(f.auth, phone), {
    phone,
    userId: "seller",
  });
  assert.deepEqual(f.calls, [{ name: "update", value: { phone } }]);
});
test("a phone-change aal1 result never replaces the original MFA session", async () => {
  const original = makeSession("seller");
  const f = fixture(original);
  const id = await finishPhoneVerification(
    f.auth,
    async (input) => {
      assert.deepEqual(input, {
        phone,
        token: "123456",
        type: "phone_change",
        accessToken: original.access_token,
      });
      return makeSession("seller", "temporary-aal1");
    },
    { phone, userId: "seller" },
    "123456",
  );
  assert.equal(id, "seller");
  assert.deepEqual(f.calls, [{ name: "refresh", value: original }]);
  assert.equal(
    (await f.auth.getSession()).data.session?.access_token,
    "original-aal2",
  );
});
test("guest installs only the verified phone session", async () => {
  const f = fixture(null);
  assert.equal(
    await finishPhoneVerification(
      f.auth,
      async (input) => {
        assert.equal(input.type, "sms");
        assert.equal(input.accessToken, undefined);
        return makeSession("new", "phone-aal1");
      },
      { phone, userId: null },
      "123456",
    ),
    "new",
  );
  assert.equal(f.calls[0].name, "install");
});
test("a different verified identity cannot replace an existing account", async () => {
  const f = fixture(makeSession("seller"));
  await assert.rejects(
    finishPhoneVerification(
      f.auth,
      async () => makeSession("other"),
      { phone, userId: "seller" },
      "123456",
    ),
    /SESSION_CHANGED/,
  );
  assert.deepEqual(f.calls, []);
});
test("a login in another tab while the code is verifying is preserved", async () => {
  const f = fixture(null);
  await assert.rejects(
    finishPhoneVerification(
      f.auth,
      async () => {
        f.change(makeSession("other"));
        return makeSession("new");
      },
      { phone, userId: null },
      "123456",
    ),
    /SESSION_CHANGED/,
  );
  assert.deepEqual(f.calls, []);
  assert.equal((await f.auth.getSession()).data.session?.user.id, "other");
});
test("logout before verification stops the old account operation", async () => {
  const f = fixture(null);
  await assert.rejects(
    finishPhoneVerification(
      f.auth,
      async () => {
        throw Error("must not verify");
      },
      { phone, userId: "seller" },
      "123456",
    ),
    /SESSION_CHANGED/,
  );
});
test("invalid codes and wrong verified phones cannot install sessions", async () => {
  const f = fixture(null);
  await assert.rejects(
    finishPhoneVerification(
      f.auth,
      async () => makeSession("new"),
      { phone, userId: null },
      "12345",
    ),
    /PHONE_CODE_INVALID/,
  );
  const wrong = makeSession("new");
  wrong.user.phone = "46700000002";
  await assert.rejects(
    finishPhoneVerification(
      f.auth,
      async () => wrong,
      { phone, userId: null },
      "123456",
    ),
    /PHONE_UNAVAILABLE/,
  );
  assert.deepEqual(f.calls, []);
});
test("provider failure preserves the original account and exposes no provider message", async () => {
  const f = fixture(makeSession("seller"));
  f.auth.updateUser = async () =>
    ({
      data: { user: null },
      error: { code: "phone_exists", message: "private provider details" },
    }) as never;
  await assert.rejects(
    beginPhoneVerification(f.auth, phone),
    /PHONE_ALREADY_USED/,
  );
  assert.equal((await f.auth.getSession()).data.session?.user.id, "seller");
  assert.equal(
    phoneError({ message: "private provider details" }).message,
    "PHONE_UNAVAILABLE",
  );
  assert.equal(phoneError({ status: 429 }).message, "PHONE_RATE_LIMIT");
});
