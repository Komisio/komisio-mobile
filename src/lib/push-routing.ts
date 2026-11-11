import {
  parsePushData,
  type PushData,
  type ExternalPushData,
} from "./push-contract.ts";

export type PushAccount = { tenantId: string; sellerId: string };
export type PushStore = { id: string; name: string; slug: string };
export function ownsPush(data: unknown, accounts: PushAccount[]): boolean {
  const p = parsePushData(data);
  return (
    p !== null &&
    p.v === 1 &&
    accounts.some((a) => a.tenantId === p.tenantId && a.sellerId === p.sellerId)
  );
}
export function pushDestination(
  p: PushData,
  accounts: PushAccount[],
  stores: PushStore[],
): PushStore | null {
  return ownsPush(p, accounts)
    ? (stores.find((s) => s.id === p.tenantId) ?? null)
    : null;
}

export async function externalPushDestination(
  p: ExternalPushData,
  user: string,
  readRequest: (
    id: string,
  ) => Promise<{ id: string; tenant_id: string } | null>,
  readOffer: (
    id: string,
  ) => Promise<{
    id: string;
    requestId: string;
    tenantId: string;
    status: string;
  }>,
) {
  if (p.ownerId !== user) return null;
  const item = await readRequest(p.requestId);
  if (!item || item.id !== p.requestId || item.tenant_id !== p.tenantId)
    return null;
  if (!p.offerId)
    return {
      pathname: "/external-items" as const,
      params: { request: item.id },
    };
  const offer = await readOffer(p.offerId);
  if (
    offer.id !== p.offerId ||
    offer.requestId !== item.id ||
    offer.tenantId !== item.tenant_id
  )
    return null;
  return {
    pathname:
      offer.status === "accepted"
        ? ("/external-onboarding/[offer]" as const)
        : ("/external-offer/[offer]" as const),
    params: { offer: offer.id },
  };
}
