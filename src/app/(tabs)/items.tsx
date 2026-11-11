import { useI18n } from "@/lib/i18n";
import { SellerGate } from "@/components/seller-gate";
import { SellerItems } from "@/components/seller-items";
import { useSession } from "@/lib/session";
import { useLocalSearchParams } from "expo-router";
import { hasVerifiedEmail } from "@/lib/identity-gates";
import { ExternalItemsScreen } from "@/components/external-items-screen";
import { LoginOptions } from "@/components/login-options";
import { Screen } from "@/components/ui";

export default function ItemsTab() {
  const { d } = useI18n();
  const { account, session, store } = useSession();
  const { source } = useLocalSearchParams<{ source?: string }>();
  if (!session)
    return (
      <Screen title={d.tabs.items} bottomSafeArea={false}>
        <LoginOptions />
      </Screen>
    );
  if (source === "komisio" || !store || !hasVerifiedEmail(session.user))
    return <ExternalItemsScreen inTab />;
  return (
    <SellerGate bottomSafeArea={false} title={d.tabs.items}>
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
export { ExternalFlowError as ErrorBoundary } from "@/components/external-flow-error";
