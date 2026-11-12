import { fetch } from "expo/fetch";
import { supabase } from "./supabase";
import { externalItemsEndpoint } from "./external-request-http";
import { createExternalPhoneRead } from "./external-offer-http";
import { createPendingCommand } from "./pending-command";
import { commandStorage } from "./command-storage";
import { commandLock } from "./command-lock";
import { sendMobileCommand } from "./mobile-command-http";
import {
  parseBookParcel,
  parseShippingState,
  shippingOutcome,
} from "./central-shipping";
const base = externalItemsEndpoint(process.env.EXPO_PUBLIC_KOMISIO_WEB_URL);
const endpoint = base ? `${base}/shipping` : null;
function transport(user: string) {
  return {
    endpoint,
    user,
    request: (url: string, init: RequestInit) => fetch(url, init),
    session: async () => {
      const { data, error } = await supabase.auth.getSession();
      return error || !data.session
        ? null
        : { user: data.session.user.id, token: data.session.access_token };
    },
  };
}
export async function readShipping(user: string, offer: string) {
  return parseShippingState(
    await createExternalPhoneRead(transport(user))({
      action: "read",
      offerId: offer,
    }),
    offer,
  );
}
export function shippingWriter(user: string, offer: string) {
  return createPendingCommand({
    key: `komisio.pending.shipping.v1.${user}.${offer}`,
    binding: JSON.stringify([
      user,
      offer,
      process.env.EXPO_PUBLIC_SUPABASE_URL,
      endpoint,
    ]),
    storage: commandStorage,
    lock: commandLock,
    parse: (value) => parseBookParcel(value, offer),
    send: (command) =>
      sendMobileCommand(command, transport(user), shippingOutcome),
  });
}
