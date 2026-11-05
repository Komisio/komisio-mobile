import type { PushPermission } from "./push-controller";
export function configurePushChannels(_registered: string, _sold: string) {}
export async function pushPermission(
  _request: boolean,
): Promise<PushPermission> {
  return "unavailable";
}
export async function pushToken(): Promise<string> {
  throw new Error("UNAVAILABLE");
}
export async function dismissPush() {}
export function clearPushResponse() {}
export function observePush(
  _response: (data: unknown) => void,
  _rotated: () => void,
  _visible: (data: unknown) => boolean,
): () => void {
  return () => {};
}
