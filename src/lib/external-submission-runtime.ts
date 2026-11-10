import { readCentralRecipient } from "./external-stores";
import { randomUUID } from "expo-crypto";
import { fetch } from "expo/fetch";
import { supabase } from "./supabase";
import { commandLock } from "./command-lock";
import {
  createExternalRequestApi,
  externalItemsEndpoint,
} from "./external-request-http";
import { createExternalSubmission } from "./external-submission";
import { externalOutboxStorage } from "./external-outbox-storage";
import { prepareExternalPhoto } from "./external-image";
import { photoDraftRepository } from "./photo-draft-storage";

const endpoint = externalItemsEndpoint(process.env.EXPO_PUBLIC_KOMISIO_WEB_URL);
const binding = JSON.stringify([
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  endpoint,
]);
export function externalRequestApi(ownerId: string) {
  return createExternalRequestApi({
    endpoint,
    ownerId,
    request: (url, init) => fetch(url, init),
    session: async () => {
      const { data, error } = await supabase.auth.getSession();
      return error || !data.session
        ? null
        : { user: data.session.user.id, token: data.session.access_token };
    },
  });
}
const controllers = new Map<
  string,
  Promise<ReturnType<typeof createExternalSubmission>>
>();
export function externalSubmission(ownerId: string) {
  if (!controllers.has(ownerId)) {
    controllers.set(
      ownerId,
      externalOutboxStorage(ownerId, binding)
        .then((storage) =>
          createExternalSubmission({
            ownerId,
            binding,
            storage,
            lock: commandLock,
            uuid: randomUUID,
            preparePhoto: prepareExternalPhoto,
            recipient: () => readCentralRecipient(supabase),
            finishDraft: async (expected, preserve) => {
              const { data, error } = await supabase.auth.getSession();
              if (error || data.session?.user.id !== ownerId)
                throw new Error("SESSION_CHANGED");
              await (
                await photoDraftRepository()
              ).finishSubmission(expected, preserve);
            },
            api: externalRequestApi(ownerId),
          }),
        )
        .catch((error) => {
          controllers.delete(ownerId);
          throw error;
        }),
    );
  }
  return controllers.get(ownerId)!;
}
