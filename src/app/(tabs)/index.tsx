import { useI18n } from "@/lib/i18n";
import { SellerGate } from "@/components/seller-gate";
import { StoreCatalogue } from "@/components/store-catalogue";
import { useSession } from "@/lib/session";

export default function StoreTab() {
  const { d } = useI18n();
  const { store, session } = useSession();
  return (
    <SellerGate title={d.tabs.store}>
      {store && session && (
        <StoreCatalogue
          key={`${session.user.id}:${store.id}`}
          tenant={store.id}
          name={store.name}
        />
      )}
    </SellerGate>
  );
}
