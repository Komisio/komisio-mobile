import { fetch } from "expo/fetch";
import { supabase } from "./supabase";
import { mobileEndpoint } from "./mobile-command-http";
import {
  deviceReply,
  parseDeviceState,
  type DeviceIdentity,
  type PushCommand,
} from "./push-contract";

const endpoint =
  mobileEndpoint(process.env.EXPO_PUBLIC_KOMISIO_WEB_URL)?.replace(
    /\/seller$/,
    "/push",
  ) ?? null;
async function call(user: string, command: unknown): Promise<unknown> {
  if (!endpoint) throw new Error("NOT_CONFIGURED");
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session || data.session.user.id !== user)
    throw new Error("AUTH_REQUIRED");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const r = await fetch(endpoint, {
      method: "POST",
      credentials: "omit",
      redirect: "error",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${data.session.access_token}`,
      },
      body: JSON.stringify(command),
    });
    const text = await r.text();
    if (text.length > 4096) throw new Error("INVALID_REPLY");
    const body: unknown = JSON.parse(text);
    if (r.status !== 200) {
      const code = (body as { error?: unknown } | null)?.error;
      const known = [
        "AUTH_REQUIRED",
        "FORBIDDEN",
        "MFA_REQUIRED",
        "PASSWORD_UPDATE_REQUIRED",
        "NOT_FOUND",
        "INVALID_INPUT",
        "REQUEST_CONFLICT",
        "PUSH_DEVICE_CHANGED",
        "PUSH_DEVICE_LIMIT",
        "PUSH_DEVICE_IN_USE",
      ];
      throw new Error(
        r.status < 500 && typeof code === "string" && known.includes(code)
          ? code
          : "REQUEST_FAILED",
      );
    }
    return body;
  } finally {
    clearTimeout(timeout);
  }
}
export async function readPushDevice(user: string, device: DeviceIdentity) {
  return parseDeviceState(
    await call(user, {
      action: "state",
      deviceId: device.deviceId,
      deviceSecret: device.deviceSecret,
    }),
  );
}
export async function writePushDevice(user: string, command: PushCommand) {
  return deviceReply(await call(user, command), command);
}
