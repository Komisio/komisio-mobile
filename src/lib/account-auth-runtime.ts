import { Platform } from "react-native";
import * as Crypto from "expo-crypto";
import * as WebBrowser from "expo-web-browser";
import { fetch } from "expo/fetch";
import { createAccountAuth, type AccountProvider } from "./account-auth";
import { secureStorage } from "./secure-storage";
import { supabase } from "./supabase";
import { appleCredential } from "./apple-credential";

export const accountAuthRedirect =
  Platform.OS === "web" && typeof window !== "undefined"
    ? `${window.location.origin}/auth-callback`
    : "komisio://auth-callback";
export const accountAuth = createAccountAuth({
  auth: supabase.auth,
  storage: secureStorage,
  request: (url, init) => fetch(url, init),
  url: process.env.EXPO_PUBLIC_SUPABASE_URL!,
  key: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  portal: process.env.EXPO_PUBLIC_KOMISIO_WEB_URL!,
  redirect: accountAuthRedirect,
  random: Crypto.randomUUID,
  challenge: async (value, encoding) => {
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      value,
      {
        encoding:
          encoding === "hex"
            ? Crypto.CryptoEncoding.HEX
            : Crypto.CryptoEncoding.BASE64,
      },
    );
    return encoding === "hex"
      ? digest
      : digest.replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
  },
});

export async function connectAccountProvider(
  provider: AccountProvider,
  link: boolean,
) {
  if (provider === "apple" && Platform.OS === "ios") {
    await accountAuth.apple(link, appleCredential);
    return true;
  }
  const pending = await accountAuth.beginOAuth(provider, link);
  if (Platform.OS === "web") {
    window.location.assign(pending.url);
    return false;
  }
  try {
    const result = await WebBrowser.openAuthSessionAsync(
      pending.url,
      pending.redirect,
    );
    if (result.type !== "success") {
      await accountAuth.cancelOAuth(pending.id);
      return false;
    }
    await accountAuth.finishOAuth(result.url);
    return true;
  } catch (error) {
    await accountAuth.cancelOAuth(pending.id);
    throw error;
  }
}
