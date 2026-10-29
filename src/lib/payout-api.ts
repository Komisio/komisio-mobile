import { fetch } from "expo/fetch";
import { supabase } from "./supabase";
import { commandStorage } from "./command-storage";
import { commandLock } from "./command-lock";
import { createPendingCommand } from "./pending-command";
import { mobileEndpoint, sendMobileCommand } from "./mobile-command-http";
import {
  parsePendingPayout,
  parsePayoutPage,
  payoutCommandOutcome,
  type PendingPayout,
} from "./seller-payouts";
export const payoutEndpoint = mobileEndpoint(
  process.env.EXPO_PUBLIC_KOMISIO_WEB_URL,
);
export async function readPayouts(
  tenant: string,
  seller: string,
  offset: number,
  signal: AbortSignal,
) {
  const { data, error } = await supabase
    .rpc("my_seller_payouts_page", {
      p_tenant: tenant,
      p_seller: seller,
      p_offset: offset,
    })
    .abortSignal(signal);
  if (error) throw error;
  return parsePayoutPage(data, tenant, seller, offset);
}
export function payoutWriter(user: string, tenant: string, seller: string) {
  return createPendingCommand<PendingPayout>({
    key: `komisio.pending.payout.v1.${user}.${tenant}.${seller}`,
    binding: JSON.stringify([
      user,
      tenant,
      seller,
      process.env.EXPO_PUBLIC_SUPABASE_URL,
      payoutEndpoint,
    ]),
    storage: commandStorage,
    lock: commandLock,
    parse: (value) => parsePendingPayout(value, tenant, seller),
    send: (pending) =>
      sendMobileCommand(
        pending.command,
        {
          endpoint: payoutEndpoint,
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
        payoutCommandOutcome,
      ),
  });
}
