import * as Notifications from "expo-notifications";
import { AndroidImportance, IosAuthorizationStatus } from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import type { PushPermission } from "./push-controller";

let names = { registered: "Registered items", sold: "Sold items" };
let rotatedToken: Notifications.DevicePushToken | undefined;
export function configurePushChannels(registered: string, sold: string) {
  names = { registered, sold };
}
async function channels() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("komisio-registered-v1", {
    name: names.registered,
    importance: AndroidImportance.DEFAULT,
    sound: "registeredstore.wav",
  });
  await Notifications.setNotificationChannelAsync("komisio-sold-v1", {
    name: names.sold,
    importance: AndroidImportance.DEFAULT,
    sound: "sale.wav",
  });
  await Notifications.setNotificationChannelAsync("komisio-requests-v1", {
    name: "Komisio",
    importance: AndroidImportance.DEFAULT,
    sound: "default",
  });
}
export async function pushPermission(
  request: boolean,
): Promise<PushPermission> {
  if (!Device.isDevice || Constants.appOwnership === "expo")
    return "unavailable";
  if (request) await channels();
  let p = await Notifications.getPermissionsAsync();
  if (request && p.canAskAgain && !p.granted)
    p = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowSound: true, allowBadge: false },
    });
  if (p.granted || p.ios?.status === IosAuthorizationStatus.PROVISIONAL)
    return "granted";
  return p.status === "undetermined" ? "undetermined" : "denied";
}
export async function pushToken(): Promise<string> {
  await channels();
  const projectId =
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId;
  if (typeof projectId !== "string" || !projectId)
    throw new Error("NOT_CONFIGURED");
  // A native token rotation callback must not recursively request another native
  // token. Forward the callback's token to Expo explicitly when it is available.
  return (
    await Notifications.getExpoPushTokenAsync({
      projectId,
      ...(rotatedToken ? { devicePushToken: rotatedToken } : {}),
    })
  ).data;
}
export async function dismissPush() {
  await Notifications.dismissAllNotificationsAsync();
  clearPushResponse();
}
export function clearPushResponse() {
  Notifications.clearLastNotificationResponse();
}
export function observePush(
  response: (data: unknown) => void,
  rotated: () => void,
  visible: (data: unknown) => boolean,
): () => void {
  if (Constants.appOwnership === "expo") return () => {};
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const show = visible(notification.request.content.data);
      return {
        shouldShowBanner: show,
        shouldShowList: show,
        shouldPlaySound: show,
        shouldSetBadge: false,
      };
    },
  });
  const receive = Notifications.addNotificationResponseReceivedListener(
    (value) => {
      if (value.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER)
        response(value.notification.request.content.data);
    },
  );
  const rotate = Notifications.addPushTokenListener((value) => {
    rotatedToken = value;
    rotated();
  });
  const last = Notifications.getLastNotificationResponse();
  if (last?.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER)
    response(last.notification.request.content.data);
  return () => {
    receive.remove();
    rotate.remove();
    Notifications.setNotificationHandler(null);
  };
}
