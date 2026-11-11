import { createClient } from "@supabase/supabase-js";
import { phoneError, type VerifyPhoneCode } from "./phone-verification";

export const verifyPhoneCode: VerifyPhoneCode = async ({
  accessToken,
  ...input
}) => {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("PHONE_UNAVAILABLE");
  const client = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    ...(accessToken
      ? { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
      : {}),
  });
  const result = await client.auth.verifyOtp(input);
  if (result.error) throw phoneError(result.error);
  if (!result.data.session) throw new Error("PHONE_UNAVAILABLE");
  return result.data.session;
};
