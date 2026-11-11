import { fetch } from "expo/fetch";
import { supabase } from "./supabase";
import { externalItemsEndpoint } from "./external-request-http";
import { createExternalPhoneRead } from "./external-offer-http";
import { externalOfferApi } from "./external-offer-runtime";
import {
  parseExternalOnboarding,
  parseCompleteExternalOffer,
  externalOnboardingOutcome,
} from "./external-onboarding";
import { createPendingCommand } from "./pending-command";
import { commandStorage } from "./command-storage";
import { commandLock } from "./command-lock";
import { sendMobileCommand } from "./mobile-command-http";
const base = externalItemsEndpoint(process.env.EXPO_PUBLIC_KOMISIO_WEB_URL);
const endpoint = base ? `${base}/onboarding` : null;
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
export async function readExternalOnboarding(user: string, id: string) {
  const [data, offer] = await Promise.all([
    createExternalPhoneRead(transport(user))({ action: "read", offerId: id }),
    externalOfferApi(user).read(id),
  ]);
  const account = parseExternalOnboarding(data, id);
  if (account.tenantId !== offer.tenantId)
    throw new Error("INVALID_ONBOARDING");
  return { account, offer };
}
export function externalOnboardingWriter(user: string, offer: string) {
  return createPendingCommand({
    key: `komisio.pending.onboarding.v1.${user}.${offer}`,
    binding: JSON.stringify([
      user,
      offer,
      process.env.EXPO_PUBLIC_SUPABASE_URL,
      endpoint,
    ]),
    storage: commandStorage,
    lock: commandLock,
    parse: (value) => parseCompleteExternalOffer(value, offer),
    send: (command) =>
      sendMobileCommand(command, transport(user), externalOnboardingOutcome),
  });
}
