import { useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { SellerGate } from "@/components/seller-gate";
import { BankAccount } from "@/components/bank-account";

export default function BankAccountScreen() {
  const { account, session, store } = useSession();
  const { d } = useI18n();
  return (
    <SellerGate topSafeArea={false} title={d.bank.title}>
      {account &&
      account !== "failed" &&
      session &&
      store &&
      account.tenantId === store.id ? (
        <BankAccount
          key={`${session.user.id}:${account.tenantId}:${account.sellerId}:${store.slug}`}
          user={session.user.id}
          tenant={account.tenantId}
          seller={account.sellerId}
          slug={store.slug}
        />
      ) : null}
    </SellerGate>
  );
}
