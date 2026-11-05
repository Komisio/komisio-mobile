import { Platform } from "react-native";
import { randomUUID } from "expo-crypto";
import { commandStorage } from "./command-storage";
import { createPushController } from "./push-controller";
import { dismissPush, pushPermission, pushToken } from "./push-native";
import { readPushDevice, writePushDevice } from "./push-api";

export const sellerPush = createPushController({
  storage: commandStorage,
  storageKey: `komisio.push.v1.${(process.env.EXPO_PUBLIC_SUPABASE_URL ?? "unconfigured").replace(/[^A-Za-z0-9.-]/g, "_").slice(0, 160)}`,
  platform:
    Platform.OS === "ios" || Platform.OS === "android" ? Platform.OS : "web",
  randomId: randomUUID,
  permission: pushPermission,
  token: pushToken,
  read: readPushDevice,
  write: writePushDevice,
  dismiss: dismissPush,
});
