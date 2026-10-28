import { supabase } from "./supabase";
import { commandStorage } from "./command-storage";
import { commandLock } from "./command-lock";
import { createPendingCommand } from "./pending-command";
import { fetch } from "expo/fetch";
import {
  parseBankCommand,
  parseBankVersion,
  type BankCommand,
} from "./bank-account";
import { mobileEndpoint, sendBankCommand } from "./mobile-command-http";

export const bankEndpoint = mobileEndpoint(
  process.env.EXPO_PUBLIC_KOMISIO_WEB_URL,
);
export async function readBank(
  tenant: string,
  seller: string,
  signal: AbortSignal,
) {
  const result = await supabase
    .rpc("seller_bank_details", { p_tenant: tenant, p_seller: seller })
    .abortSignal(signal);
  if (result.error) throw result.error;
  return parseBankVersion(result.data);
}
export function bankWriter(user: string, tenant: string, seller: string) {
  return createPendingCommand<BankCommand>({
    key: `komisio.pending.bank.v1.${user}.${tenant}.${seller}`,
    binding: JSON.stringify([
      user,
      tenant,
      seller,
      process.env.EXPO_PUBLIC_SUPABASE_URL,
      bankEndpoint,
    ]),
    storage: commandStorage,
    lock: commandLock,
    parse: (value) => parseBankCommand(value, tenant, seller),
    send: (command) =>
      sendBankCommand(command, {
        endpoint: bankEndpoint,
        user,
        // Explicit Expo fetch retains redirect/error and credentials/omit even
        // when a host opts out of SDK 58's global fetch replacement.
        request: (url, init) => fetch(url, init),
        session: async () => {
          const { data, error } = await supabase.auth.getSession();
          return error || !data.session
            ? null
            : { user: data.session.user.id, token: data.session.access_token };
        },
      }),
  });
}
