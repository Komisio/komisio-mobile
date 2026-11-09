// Run before EAS installs dependencies. Never print environment values or keys.
import { readFileSync } from "node:fs";

const env = process.env;
const fail = (message) => {
  console.error(`Production build blocked: ${message}`);
  process.exit(1);
};

if (env.EAS_BUILD_PROFILE === "android-play-internal") {
  if (env.EAS_BUILD_PLATFORM !== "android") fail("the Play profile requires Android.");
  const app = JSON.parse(readFileSync(new URL("../app.json", import.meta.url), "utf8"));
  const pkg = app.expo.android.package;
  if (pkg !== "com.inority.komisio") fail("the package must match the existing Play app.");
  let firebase;
  try {
    firebase = JSON.parse(readFileSync(env.GOOGLE_SERVICES_JSON, "utf8"));
  } catch {
    fail("set GOOGLE_SERVICES_JSON to the Firebase Android configuration file.");
  }
  if (firebase?.project_info?.project_id !== "komisio-push" ||
      !firebase.client?.some(client =>
        client.client_info?.android_client_info?.package_name === pkg &&
        client.client_info?.mobilesdk_app_id && client.api_key?.some(key => key.current_key))) {
    fail("the Firebase configuration must match Komisio Push and the Play package.");
  }
} else if (env.EAS_BUILD_PROFILE === "screenshots") {
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
  fail("unknown release build profile.");
}
if (env.EAS_BUILD_PROFILE !== "android-play-internal" &&
    env.EAS_BUILD_PLATFORM && env.EAS_BUILD_PLATFORM !== "ios") {
  fail("Android must use the internal Play build profile.");
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
  "Production environment checks passed. Key validity requires a live read-only check.",
);
