import { parsePushData, type PushData } from "./push-contract.ts";

export type PushAccount = { tenantId: string; sellerId: string };
export type PushStore = { id: string; name: string; slug: string };
export function ownsPush(data: unknown, accounts: PushAccount[]): boolean {
  const p = parsePushData(data);
  return (
    p !== null &&
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
