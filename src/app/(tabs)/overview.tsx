import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { SellerGate } from "@/components/seller-gate";
import { SellerOverviewScreen } from "@/components/seller-overview";

export default function OverviewTab() {
  const { d } = useI18n();
  const { account, session, store } = useSession();
  return (
    <SellerGate bottomSafeArea={false} title={d.tabs.overview}>
      {account &&
      account !== "failed" &&
      session &&
      store &&
      account.tenantId === store.id ? (
        <SellerOverviewScreen
          key={`${session.user.id}:${account.tenantId}:${account.sellerId}`}
          tenant={account.tenantId}
          seller={account.sellerId}
          storeName={store.name}
        />
      ) : null}
    </SellerGate>
  );
}
