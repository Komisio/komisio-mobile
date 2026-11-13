import { shippingTransport } from "./central-shipping-runtime";
import { createExternalPhoneRead } from "./external-offer-http";
import { createPendingCommand } from "./pending-command";
import { commandStorage } from "./command-storage";
import { commandLock } from "./command-lock";
import { sendMobileCommand } from "./mobile-command-http";
import {
  parseShippingAccount,
  parseSaveShippingAddress,
  shippingAddressOutcome,
} from "./central-shipping-address";
export async function readShippingAccount(user: string) {
  return parseShippingAccount(
    await createExternalPhoneRead(shippingTransport(user, "/address"))({
      action: "read",
    }),
  );
}
export function shippingAddressWriter(
  user: string,
  tenant: string,
  seller: string,
) {
  const transport = shippingTransport(user, "/address");
  return createPendingCommand({
    key: `komisio.pending.shipping-address.v1.${user}.${tenant}.${seller}`,
    binding: JSON.stringify([
      user,
      tenant,
      seller,
      process.env.EXPO_PUBLIC_SUPABASE_URL,
      transport.endpoint,
    ]),
    storage: commandStorage,
    lock: commandLock,
    parse: (value) => parseSaveShippingAddress(value, tenant, seller),
    send: (command) =>
      sendMobileCommand(command, transport, shippingAddressOutcome),
  });
}
