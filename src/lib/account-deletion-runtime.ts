import { fetch } from "expo/fetch";
import { supabase } from "./supabase";
import { createAccountDeletion } from "./account-deletion";

export const accountDeletion = createAccountDeletion({
  portal: process.env.EXPO_PUBLIC_KOMISIO_WEB_URL,
  request: (url, init) => fetch(url, init),
  session: async () => {
    const { data, error } = await supabase.auth.getSession();
    return error || !data.session
      ? null
      : { user: data.session.user.id, token: data.session.access_token };
  },
});
