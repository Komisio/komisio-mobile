import type { ReactNode } from "react";
import { useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { Button, Loading, Message, Screen } from "./ui";

export function SellerGate({
  children,
  title,
  bottomSafeArea = true,
}: {
  children: ReactNode;
  title: string;
  bottomSafeArea?: boolean;
}) {
  const { account, store, retryAccount, chooseStore } = useSession();
  const { d } = useI18n();
  if (account === undefined) return <Loading />;
  if (account === "failed")
    return (
      <Screen title={title} bottomSafeArea={bottomSafeArea}>
        <Message tone="error">{d.login.offline}</Message>
        <Button label={d.retry} onPress={retryAccount} />
      </Screen>
    );
  if (!account)
    return (
      <Screen title={title} bottomSafeArea={bottomSafeArea}>
        <Message>
          {d.account.missing.replace("{store}", store?.name ?? "")}
        </Message>
        <Button label={d.login.changeStore} onPress={() => chooseStore(null)} />
      </Screen>
    );
  return children;
}
