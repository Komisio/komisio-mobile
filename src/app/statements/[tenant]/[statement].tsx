import { useCallback, useMemo, useSyncExternalStore } from "react";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { SellerGate } from "@/components/seller-gate";
import { Button, Loading, Message, Screen } from "@/components/ui";
import { StatementDocument } from "@/components/statement-document";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { isId } from "@/lib/catalogue";
import { createScopedRead } from "@/lib/scoped-read";
import { readStatement } from "@/lib/statement-api";
import { statementReadFailure } from "@/lib/seller-statements";
export default function StatementScreen() {
  const { tenant, statement } = useLocalSearchParams<{
    tenant: string;
    statement: string;
  }>();
  const { account, session, store } = useSession();
  const { d } = useI18n(),
    t = d.statements;
  if (!store || store.id !== tenant || !isId(tenant) || !isId(statement))
    return (
      <Screen topSafeArea={false} title={t.title}>
        <Message>{t.missing}</Message>
      </Screen>
    );
  return (
    <SellerGate topSafeArea={false} title={t.title}>
      {account &&
      account !== "failed" &&
      session &&
      account.tenantId === tenant ? (
        <StatementRead
          key={`${session.user.id}:${tenant}:${account.sellerId}:${statement}`}
          tenant={tenant}
          seller={account.sellerId}
          id={statement}
        />
      ) : null}
    </SellerGate>
  );
}
function StatementRead({
  tenant,
  seller,
  id,
}: {
  tenant: string;
  seller: string;
  id: string;
}) {
  const { d } = useI18n(),
    t = d.statements;
  const { chooseStore } = useSession();
  const read = useMemo(
    () =>
      createScopedRead(
        (signal) => readStatement(tenant, seller, id, signal),
        statementReadFailure,
      ),
    [tenant, seller, id],
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
  return (
    <Screen topSafeArea={false} title={t.title}>
      {state.status === "idle" || state.status === "loading" ? (
        <Loading />
      ) : state.status === "failed" ? (
        <>
          <Message tone="error">
            {state.failure === "denied"
              ? t.denied
              : state.failure === "missing"
                ? t.missing
                : state.failure === "too-large"
                  ? t.tooLarge
                  : t.failed}
          </Message>
          <Button label={d.retry} onPress={() => void read.refresh()} />
          {state.failure === "denied" ? (
            <Button
              label={d.login.changeStore}
              onPress={() => chooseStore(null)}
            />
          ) : null}
        </>
      ) : state.data ? (
        <StatementDocument
          data={state.data}
          openOriginal={(statement) =>
            router.push({
              pathname: "/statements/[tenant]/[statement]",
              params: { tenant, statement },
            })
          }
        />
      ) : null}
    </Screen>
  );
}
