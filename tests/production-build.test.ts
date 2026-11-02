import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const script = new URL(
  "../scripts/verify-production-build.mjs",
  import.meta.url,
);
const production = {
  EAS_BUILD_PROFILE: "production",
  EAS_BUILD_PLATFORM: "ios",
  EXPO_NO_DOTENV: "1",
  EXPO_PUBLIC_SUPABASE_URL: "https://vpjpnqpkdejwzwpjjoon.supabase.co",
  EXPO_PUBLIC_KOMISIO_WEB_URL: "https://app.komisio.com",
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    "sb_publishable_synthetic_test_key_only_123",
};
const run = (overrides: Record<string, string> = {}) =>
  spawnSync(process.execPath, [fileURLToPath(script)], {
    env: { ...process.env, ...production, ...overrides },
    encoding: "utf8",
  });
const jwt = (role: string, ref: string) =>
  `header.${Buffer.from(JSON.stringify({ role, ref })).toString("base64url")}.signature`;

test("production preflight accepts public key formats without claiming validity", () => {
  assert.equal(run().status, 0);
  const result = run({
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: jwt("anon", "vpjpnqpkdejwzwpjjoon"),
  });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /validity requires a live read-only check/);
});

test("simulator capture profile retains production URL and client-key checks", () => {
  assert.equal(run({ EAS_BUILD_PROFILE: "screenshots" }).status, 0);
  const cases: Record<string, string>[] = [
    { EXPO_PUBLIC_SUPABASE_URL: "https://staging.supabase.co" },
    { EXPO_PUBLIC_KOMISIO_WEB_URL: "https://komisio-staging.vercel.app" },
    {
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: jwt(
        "service_role",
        "vpjpnqpkdejwzwpjjoon",
      ),
    },
    { EAS_BUILD_PLATFORM: "android" },
  ];
  for (const overrides of cases) {
    assert.equal(
      run({ EAS_BUILD_PROFILE: "screenshots", ...overrides }).status,
      1,
    );
  }
});

test("production preflight rejects wrong environments and unconfigured platforms", () => {
  const cases: Record<string, string>[] = [
    { EAS_BUILD_PROFILE: "preview" },
    { EAS_BUILD_PLATFORM: "android" },
    { EXPO_NO_DOTENV: "" },
    { EXPO_PUBLIC_SUPABASE_URL: "https://staging.supabase.co" },
    { EXPO_PUBLIC_KOMISIO_WEB_URL: "https://komisio-staging.vercel.app" },
    { EXPO_PUBLIC_KOMISIO_WEB_URL: "http://localhost:3000" },
  ];
  for (const overrides of cases) {
    assert.equal(run(overrides).status, 1);
  }
});

test("production preflight rejects missing, secret and foreign keys without leaking them", () => {
  for (const key of [
    "",
    "malformed",
    "sb_secret_synthetic_sensitive_value",
    jwt("service_role", "vpjpnqpkdejwzwpjjoon"),
    jwt("anon", "another-project"),
    "header.bnVsbA.signature",
  ]) {
    const result = run({ EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key });
    assert.equal(result.status, 1);
    if (key) assert.ok(!`${result.stdout}${result.stderr}`.includes(key));
  }
});
