import { isId } from "./catalogue.ts";

export type SellerPushData = {
  v: 1;
  notificationId: string;
  kind: "item_registered" | "item_sold";
  tenantId: string;
  sellerId: string;
  itemId: string;
};
export type ExternalPushData = {
  v: 2;
  notificationId: string;
  kind: "external_item_offered" | "external_item_declined";
  tenantId: string;
  ownerId: string;
  requestId: string;
  offerId: string | null;
};
export type PushData = SellerPushData | ExternalPushData;
export function parsePushData(input: unknown): PushData | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const d = input as Record<string, unknown>;
  if (d.v === 2) {
    if (
      ![d.notificationId, d.tenantId, d.ownerId, d.requestId].every(isId) ||
      !["external_item_offered", "external_item_declined"].includes(
        String(d.kind),
      ) ||
      (d.kind === "external_item_offered"
        ? !isId(d.offerId)
        : d.offerId !== null)
    )
      return null;
    return {
      v: 2,
      notificationId: String(d.notificationId),
      tenantId: String(d.tenantId),
      ownerId: String(d.ownerId),
      requestId: String(d.requestId),
      offerId: d.offerId as string | null,
      kind: d.kind as ExternalPushData["kind"],
    };
  }
  if (
    d.v !== 1 ||
    !["item_registered", "item_sold"].includes(String(d.kind)) ||
    ![d.notificationId, d.tenantId, d.sellerId, d.itemId].every(
      (id) => typeof id === "string" && isId(id),
    )
  )
    return null;
  return {
    v: 1,
    notificationId: String(d.notificationId),
    kind: d.kind as SellerPushData["kind"],
    tenantId: String(d.tenantId),
    sellerId: String(d.sellerId),
    itemId: String(d.itemId),
  };
}
export type DeviceState = {
  revision: number;
  enabled: boolean;
  requestId: string | null;
};
export type PushCommand = {
  action: "set";
  deviceId: string;
  deviceSecret: string;
  requestId: string;
  expectedRevision: number;
  token: string | null;
  platform: "ios" | "android";
  locale: string;
  enabled: boolean;
};
export type DeviceIdentity = { deviceId: string; deviceSecret: string };
export function validIdentity(v: unknown): v is DeviceIdentity {
  const d = v as DeviceIdentity | null;
  return (
    !!d &&
    isId(d.deviceId) &&
    typeof d.deviceSecret === "string" &&
    /^[0-9a-f]{64}$/.test(d.deviceSecret)
  );
}
export function parseDeviceState(value: unknown): DeviceState {
  const d = value as (DeviceState & { ok?: unknown }) | null;
  if (
    !d ||
    d.ok !== true ||
    !Number.isInteger(d.revision) ||
    d.revision < 0 ||
    typeof d.enabled !== "boolean" ||
    (d.requestId !== null && !isId(d.requestId))
  )
    throw new Error("INVALID_REPLY");
  return { revision: d.revision, enabled: d.enabled, requestId: d.requestId };
}
export function validPushCommand(value: unknown): value is PushCommand {
  const c = value as PushCommand | null;
  return (
    validIdentity(c) &&
    c.action === "set" &&
    isId(c.requestId) &&
    Number.isInteger(c.expectedRevision) &&
    c.expectedRevision >= 0 &&
    ["ios", "android"].includes(c.platform) &&
    ["sv", "en", "no", "dk", "fi", "de", "es", "it"].includes(c.locale) &&
    typeof c.enabled === "boolean" &&
    (c.enabled
      ? typeof c.token === "string" &&
        /^Expo(nent)?PushToken\[[A-Za-z0-9_-]{1,200}\]$/.test(c.token)
      : c.token === null)
  );
}
export function deviceReply(value: unknown, c: PushCommand): DeviceState {
  const d = value as {
    ok?: unknown;
    id?: unknown;
    deviceId?: unknown;
    revision?: unknown;
    enabled?: unknown;
  } | null;
  if (
    !d ||
    d.ok !== true ||
    d.id !== c.requestId ||
    d.deviceId !== c.deviceId ||
    !Number.isInteger(d.revision) ||
    Number(d.revision) <= c.expectedRevision ||
    d.enabled !== c.enabled
  )
    throw new Error("INVALID_REPLY");
  return {
    revision: Number(d.revision),
    enabled: c.enabled,
    requestId: c.requestId,
  };
}
