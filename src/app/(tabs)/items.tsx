import { useI18n } from "@/lib/i18n";
import { SellerGate } from "@/components/seller-gate";
import { SellerItems } from "@/components/seller-items";
import { useSession } from "@/lib/session";

export default function ItemsTab() {
  const { d } = useI18n();
  const { account, session, store } = useSession();
  return (
    <SellerGate title={d.tabs.items}>
      {account &&
        account !== "failed" &&
        session &&
        store &&
        account.tenantId === store.id && (
          <SellerItems
            key={`${session.user.id}:${account.tenantId}:${account.sellerId}`}
            tenant={account.tenantId}
            seller={account.sellerId}
          />
        )}
    </SellerGate>
  );
}
