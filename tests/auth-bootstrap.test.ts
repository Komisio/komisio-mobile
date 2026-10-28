import { test } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { createAuthBootstrap } from "../src/lib/auth-bootstrap.ts";

// The real Supabase client over an in-memory storage that can be made to
// reject, as the secure-storage adapter does when the keychain is unavailable.
function client(saved: Record<string, string> = {}) {
  const values = new Map(Object.entries(saved));
  const storage = {
    broken: false,
    async getItem(key: string) {
      if (storage.broken) throw new Error("STORAGE_UNAVAILABLE");
      return values.get(key) ?? null;
    },
    async setItem(key: string, value: string) {
      if (storage.broken) throw new Error("STORAGE_UNAVAILABLE");
      values.set(key, value);
    },
    async removeItem(key: string) {
      if (storage.broken) throw new Error("STORAGE_UNAVAILABLE");
      values.delete(key);
    },
  };
  const supabase = createClient("http://127.0.0.1:9", "synthetic-key", {
    auth: {
      storage,
      storageKey: "test-auth",
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return { supabase, storage };
}

async function settled(boot: ReturnType<typeof createAuthBootstrap>) {
  for (let i = 0; i < 100 && boot.getState().status === "loading"; i++)
    await new Promise((r) => setTimeout(r, 10));
  return boot.getState();
}

const encode = (value: object) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");

test("a rejected storage read fails closed and a retry completes start-up", async () => {
  const { supabase, storage } = client();
  // Let the client's own start-up listener read storage first; it rejects
  // unhandled on a broken store, which is the library's, not the app's.
  await supabase.auth.getSession();
  storage.broken = true;
  const boot = createAuthBootstrap(supabase.auth);
  const stop = boot.start();
  assert.deepEqual(await settled(boot), {
    status: "failed",
    session: null,
    mfaRequired: false,
  });
  storage.broken = false;
  await boot.retry();
  assert.deepEqual(boot.getState(), {
    status: "ready",
    session: null,
    mfaRequired: false,
  });
  stop();
});

test("a stored session with a verified factor waits for the code step", async () => {
  const now = Math.floor(Date.now() / 1000);
  const user = {
    id: "00000000-0000-4000-8000-000000000001",
    aud: "authenticated",
    email: "seller@example.test",
    app_metadata: {},
    user_metadata: {},
    created_at: new Date().toISOString(),
    factors: [{ id: "f1", status: "verified", factor_type: "totp" }],
  };
  const token = `${encode({ alg: "none" })}.${encode({ sub: user.id, aal: "aal1", exp: now + 3600 })}.${encode({ signature: "synthetic" })}`;
  const { supabase } = client({
    "test-auth": JSON.stringify({
      access_token: token,
      refresh_token: "synthetic",
      token_type: "bearer",
      expires_in: 3600,
      expires_at: now + 3600,
      user,
    }),
  });
  const boot = createAuthBootstrap(supabase.auth);
  const stop = boot.start();
  const state = await settled(boot);
  assert.equal(state.status, "ready");
  assert.equal(state.session?.user.id, user.id);
  assert.equal(state.mfaRequired, true);
  stop();
});
