import { randomUUID } from "expo-crypto";
import { fetch } from "expo/fetch";
import { commandLock } from "./command-lock";
import { externalItemsEndpoint } from "./external-request-http";
import { externalOutboxStorage } from "./external-outbox-storage";
import { prepareGuestPhoto } from "./external-image";
import {
  createGuestPhotoAnalysis,
  type GuestAnalysisJournal,
} from "./guest-photo-analysis";
import { parsePhotoAnalysis } from "./photo-analysis";

const endpoint = externalItemsEndpoint(process.env.EXPO_PUBLIC_KOMISIO_WEB_URL);
const binding = JSON.stringify([
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  endpoint,
  "guest-photo-ai-v1",
]);
let controller: Promise<ReturnType<typeof createGuestPhotoAnalysis>> | null =
  null;
const errors = new Set([
  "ASSISTANCE_DISABLED",
  "ASSISTANCE_LIMIT",
  "AI_CREDITS_EXHAUSTED",
  "AI_CAP_REACHED",
  "USAGE_QUOTA_EXCEEDED",
  "STORE_UNAVAILABLE",
  "REQUEST_CONFLICT",
  "PLAN_READ_ONLY",
  "NOT_FOUND",
  "GUEST_ANALYSIS_EXPIRED",
]);
export function guestPhotoAnalysis() {
  if (!controller)
    controller = externalOutboxStorage<GuestAnalysisJournal>(
      "00000000-0000-4000-8000-000000000000",
      binding,
    )
      .then((storage) =>
        createGuestPhotoAnalysis({
          binding,
          storage,
          lock: commandLock,
          uuid: randomUUID,
          preparePhoto: prepareGuestPhoto,
          request: async (command) => {
            if (!endpoint) throw new Error("ASSISTANCE_UNAVAILABLE");
            const response = await fetch(endpoint + "/guest-assistance", {
              method: "POST",
              redirect: "error",
              credentials: "omit",
              signal: AbortSignal.timeout(55000),
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(command),
            });
            const text = await response.text();
            if (text.length > 10000) throw new Error("ASSISTANCE_UNAVAILABLE");
            const raw = JSON.parse(text);
            if (response.status !== 200)
              throw new Error(
                errors.has(raw?.error) ? raw.error : "ASSISTANCE_UNAVAILABLE",
              );
            return parsePhotoAnalysis(raw?.result);
          },
        }),
      )
      .catch((error) => {
        controller = null;
        throw error;
      });
  return controller;
}
