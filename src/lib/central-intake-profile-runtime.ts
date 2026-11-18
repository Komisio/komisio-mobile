import { shippingTransport } from "./central-shipping-runtime";
import { createExternalIdentityRead } from "./external-offer-http";
import { createPendingCommand } from "./pending-command";
import { commandStorage } from "./command-storage";
import { commandLock } from "./command-lock";
import { sendMobileCommand } from "./mobile-command-http";
import {
  parseIntakeProfile,
  parseSaveIntakeProfile,
  intakeProfileOutcome,
} from "./central-intake-profile";
function transport(user: string) {
  const t = shippingTransport(user);
  return {
    ...t,
    endpoint: t.endpoint?.replace(/\/shipping$/, "/profile") ?? null,
  };
}
export async function readIntakeProfile(user: string) {
  return parseIntakeProfile(
    await createExternalIdentityRead(transport(user))({ action: "read" }),
  );
}
export function intakeProfileWriter(user: string, tenant: string) {
  const t = transport(user);
  return createPendingCommand({
    key: `komisio.pending.intake-profile.v1.${user}.${tenant}`,
    binding: JSON.stringify([
      user,
      tenant,
      process.env.EXPO_PUBLIC_SUPABASE_URL,
      t.endpoint,
    ]),
    storage: commandStorage,
    lock: commandLock,
    parse: (value) => parseSaveIntakeProfile(value, tenant),
    send: (command) => sendMobileCommand(command, t, intakeProfileOutcome),
  });
}
