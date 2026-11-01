import { fetch } from "expo/fetch";
import { supabase } from "./supabase";
import { commandStorage } from "./command-storage";
import { commandLock } from "./command-lock";
import { createPendingCommand } from "./pending-command";
import { mobileEndpoint, sendMobileCommand } from "./mobile-command-http";
import {
  parsePendingAgreement,
  agreementCommandOutcome,
  type PendingAgreement,
} from "./agreement-command";
export const agreementEndpoint = mobileEndpoint(
  process.env.EXPO_PUBLIC_KOMISIO_WEB_URL,
);
export function agreementWriter(user: string, tenant: string, seller: string) {
  return createPendingCommand<PendingAgreement>({
    key: `komisio.pending.agreement.v1.${user}.${tenant}.${seller}`,
    binding: JSON.stringify([
      user,
      tenant,
      seller,
      process.env.EXPO_PUBLIC_SUPABASE_URL,
      agreementEndpoint,
    ]),
    storage: commandStorage,
    lock: commandLock,
    parse: (value) => parsePendingAgreement(value, tenant, seller),
    send: (pending) =>
      sendMobileCommand(
        pending.command,
        {
          endpoint: agreementEndpoint,
          user,
          request: (url, init) => fetch(url, init),
          session: async () => {
            const { data, error } = await supabase.auth.getSession();
            return error || !data.session
              ? null
              : {
                  user: data.session.user.id,
                  token: data.session.access_token,
                };
          },
        },
        agreementCommandOutcome,
      ),
  });
}
