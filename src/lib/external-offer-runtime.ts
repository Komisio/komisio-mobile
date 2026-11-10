import { fetch } from "expo/fetch";
import { supabase } from "./supabase";
import { externalItemsEndpoint } from "./external-request-http";
import { createExternalOfferApi } from "./external-offer-http";
import { createPendingCommand } from "./pending-command";
import { commandStorage } from "./command-storage";
import { commandLock } from "./command-lock";
import { externalRequestApi } from "./external-submission-runtime";
import { sendMobileCommand } from "./mobile-command-http";
import { parseOfferResponse, offerResponseOutcome } from "./external-offer";

const base = externalItemsEndpoint(process.env.EXPO_PUBLIC_KOMISIO_WEB_URL);
const endpoint = base ? `${base}/offers` : null;
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
export function externalOfferApi(user: string) {
  return createExternalOfferApi(transport(user));
}
export async function readExternalOfferItem(user: string, id: string) {
  const offer = await externalOfferApi(user).read(id);
  const received = performance.now();
  const item = await externalRequestApi(user).lookup(offer.requestId);
  if (!item || item.tenant_id !== offer.tenantId)
    throw new Error("OFFER_UNAVAILABLE");
  return { offer, item, received };
}
export function externalOfferWriter(user: string, offer: string) {
  return createPendingCommand({
    key: `komisio.pending.offer.v1.${user}.${offer}`,
    binding: JSON.stringify([
      user,
      offer,
      process.env.EXPO_PUBLIC_SUPABASE_URL,
      endpoint,
    ]),
    storage: commandStorage,
    lock: commandLock,
    parse: (value) => parseOfferResponse(value, offer),
    send: (command) =>
      sendMobileCommand(command, transport(user), offerResponseOutcome),
  });
}
