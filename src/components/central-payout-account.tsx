import {
  useCallback,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useFocusEffect } from "expo-router";
import { useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { hasCentralIdentity, hasVerifiedEmail } from "@/lib/identity-gates";
import { createScopedRead } from "@/lib/scoped-read";
import { readShippingAccount } from "@/lib/central-shipping-address-runtime";
import { centralPayoutCopy } from "@/lib/central-payout-copy";
import { CentralPayoutEmail } from "./central-payout-email";
import { Button, Loading, Message, Screen } from "./ui";

type Props = {
  tenant?: string;
  bank?: boolean;
  children: (scope: {
    user: string;
    tenant: string;
    seller: string;
  }) => ReactNode;
};
export function CentralPayoutAccount({
  tenant,
  bank = false,
  children,
}: Props) {
  const { session, mfaRequired } = useSession(),
    { d } = useI18n();
  if (!session || mfaRequired || !hasCentralIdentity(session.user))
    return (
      <Screen title={d.tabs.money}>
        <Message>{d.payouts.denied}</Message>
      </Screen>
    );
  return (
    <OwnedAccount
      key={JSON.stringify([session.user.id, tenant])}
      user={session.user.id}
      needsBankEmail={bank && !hasVerifiedEmail(session.user)}
      tenant={tenant}
    >
      {children}
    </OwnedAccount>
  );
}

function OwnedAccount({
  user,
  needsBankEmail,
  tenant,
  children,
}: Props & { user: string; needsBankEmail: boolean }) {
  const { d, locale } = useI18n();
  // Resolve the explicitly owned central seller independently of the selected store.
  const read = useMemo(
    () =>
      createScopedRead(async () => {
        const { account } = await readShippingAccount(user);
        return account
          ? { user, tenant: account.tenantId, seller: account.sellerId }
          : null;
      }),
    [user],
  );
  const state = useSyncExternalStore(
    read.subscribe,
    read.getState,
    read.getState,
  );
  useFocusEffect(
    useCallback(() => {
      void read.refresh();
      return read.cancel;
    }, [read]),
  );
  const scope = state.data;
  if (
    state.status === "ready" &&
    scope &&
    (tenant === undefined || tenant === scope.tenant)
  ) {
    return needsBankEmail ? (
      <CentralPayoutEmail owner={user} />
    ) : (
      children(scope)
    );
  }
  return (
    <Screen title={`${d.tabs.money} · Komisio`}>
      {state.status === "failed" ? (
        <>
          <Message tone="error">{d.payouts.failed}</Message>
          <Button label={d.retry} onPress={() => void read.refresh()} />
        </>
      ) : state.status === "ready" ? (
        <Message>
          {tenant !== undefined
            ? d.payouts.denied
            : centralPayoutCopy[locale].empty}
        </Message>
      ) : (
        <Loading />
      )}
    </Screen>
  );
}
