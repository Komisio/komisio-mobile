import { randomUUID } from "expo-crypto";
import { fetch } from "expo/fetch";
import { supabase } from "./supabase";
import { commandLock } from "./command-lock";
import {
  createExternalRequestApi,
  externalItemsEndpoint,
} from "./external-request-http";
import { externalOutboxStorage } from "./external-outbox-storage";
import { prepareExternalPhoto } from "./external-image";
import {
  createPhotoAnalysis,
  type PhotoAnalysisJournal,
} from "./photo-analysis";
import { createPhotoAnalysisApi } from "./photo-analysis-http";
const endpoint = externalItemsEndpoint(process.env.EXPO_PUBLIC_KOMISIO_WEB_URL);
const binding = JSON.stringify([
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  endpoint,
  "photo-ai-v1",
]);
const controllers = new Map<
  string,
  Promise<ReturnType<typeof createPhotoAnalysis>>
>();
export function photoAnalysis(ownerId: string) {
  if (!controllers.has(ownerId)) {
    const http = {
      ownerId,
      endpoint,
      request: (url: string, init: RequestInit) => fetch(url, init),
      session: async () => {
        const { data, error } = await supabase.auth.getSession();
        return error || !data.session
          ? null
          : { user: data.session.user.id, token: data.session.access_token };
      },
    };
    controllers.set(
      ownerId,
      externalOutboxStorage<PhotoAnalysisJournal>(ownerId, binding)
        .then((storage) =>
          createPhotoAnalysis({
            ownerId,
            binding,
            storage,
            lock: commandLock,
            uuid: randomUUID,
            preparePhoto: prepareExternalPhoto,
            api: createExternalRequestApi(http),
            analyze: createPhotoAnalysisApi(http),
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
