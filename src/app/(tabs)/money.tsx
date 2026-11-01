import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { SellerGate } from "@/components/seller-gate";
import { SellerPayouts } from "@/components/seller-payouts";

export default function MoneyTab() {
  const { d } = useI18n();
  const { account, session, store } = useSession();
  return (
    <SellerGate bottomSafeArea={false} title={d.payouts.title}>
      {account &&
      account !== "failed" &&
      session &&
      store &&
      account.tenantId === store.id ? (
        <SellerPayouts
          key={`${session.user.id}:${account.tenantId}:${account.sellerId}`}
          user={session.user.id}
          tenant={account.tenantId}
          seller={account.sellerId}
        />
      ) : null}
    </SellerGate>
  );
}
