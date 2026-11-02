// Run before EAS installs dependencies. Never print environment values or keys.
import { readFileSync } from "node:fs";

const env = process.env;
const fail = (message) => {
  console.error(`Production build blocked: ${message}`);
  process.exit(1);
};

if (env.EAS_BUILD_PROFILE === "screenshots") {
  const config = JSON.parse(
    readFileSync(new URL("../eas.json", import.meta.url), "utf8"),
  );
  const profile = config.build?.screenshots;
  if (
    profile?.ios?.simulator !== true ||
    profile?.distribution !== "internal" ||
    profile?.autoIncrement !== false
  ) {
    fail(
      "screenshots must remain an internal simulator build without version increments.",
    );
  }
} else if (env.EAS_BUILD_PROFILE !== "production") {
  fail("only production and the screenshots simulator profile are configured.");
}
if (env.EAS_BUILD_PLATFORM && env.EAS_BUILD_PLATFORM !== "ios") {
  fail("Android store identity and signing have not been configured yet.");
}
if (env.EXPO_NO_DOTENV !== "1") {
  fail("EXPO_NO_DOTENV must be 1 to exclude local environment overrides.");
}
if (
  env.EXPO_PUBLIC_SUPABASE_URL !== "https://vpjpnqpkdejwzwpjjoon.supabase.co"
) {
  fail("EXPO_PUBLIC_SUPABASE_URL must match the verified production project.");
}
if (env.EXPO_PUBLIC_KOMISIO_WEB_URL !== "https://app.komisio.com") {
  fail("EXPO_PUBLIC_KOMISIO_WEB_URL must match the production portal.");
}

const key = env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
if (!/^sb_publishable_[A-Za-z0-9_-]{20,}$/.test(key)) {
  // Older Supabase anon keys are JWTs. Reject service-role and foreign-project
  // keys without mistaking payload inspection for cryptographic verification.
  let payload;
  try {
    const parts = key.split(".");
    if (parts.length !== 3 || parts.some((part) => !part)) throw new Error();
    payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    fail(
      "set a production publishable or anon key in the EAS production environment.",
    );
  }
  if (payload?.role !== "anon" || payload?.ref !== "vpjpnqpkdejwzwpjjoon") {
    fail("the client key must be anon and belong to the production project.");
  }
}

console.log(
  "Production iOS environment checks passed. Key validity requires a live read-only check.",
);
