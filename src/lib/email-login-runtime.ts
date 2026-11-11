import { fetch } from "expo/fetch";
import { supabase } from "./supabase";
import { createEmailLogin } from "./email-login";

export const emailLogin = (owner: string) =>
  createEmailLogin({
    owner,
    auth: supabase.auth,
    url: process.env.EXPO_PUBLIC_SUPABASE_URL!,
    key: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    redirect: new URL(
      "/auth/callback?next=/account",
      process.env.EXPO_PUBLIC_KOMISIO_WEB_URL!,
    ).href,
    request: (input, init) => fetch(input, init),
  });
