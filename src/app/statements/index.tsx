import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SellerGate } from "@/components/seller-gate";
import { Button, colors, Loading, Message, Screen } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { createScopedRead } from "@/lib/scoped-read";
import { readStatements } from "@/lib/statement-api";
import { statementPeriod, statementTitleKey } from "@/lib/seller-statements";
import { formatPrice } from "@/lib/catalogue";
import { formatAgreementTime } from "@/lib/seller-agreement";
import { payoutOffset } from "@/lib/seller-payouts";

export default function StatementsScreen() {
  const { account, store, session } = useSession();
  const { d } = useI18n();
  return (
    <SellerGate title={d.statements.title}>
      {account &&
      account !== "failed" &&
      store &&
      session &&
      account.tenantId === store.id ? (
        <Statements
          key={`${session.user.id}:${account.tenantId}:${account.sellerId}`}
          tenant={account.tenantId}
          seller={account.sellerId}
        />
      ) : null}
    </SellerGate>
  );
}
function Statements({ tenant, seller }: { tenant: string; seller: string }) {
  const { d, locale } = useI18n(),
    t = d.statements;
  const { chooseStore } = useSession();
  const [page, setPage] = useState(0);
  const read = useMemo(
    () =>
      createScopedRead((signal) =>
        readStatements(tenant, seller, payoutOffset(page), signal),
      ),
    [tenant, seller, page],
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
  const data = state.data;
  return (
    <Screen title={t.title} intro={t.intro}>
      <Button
        label={t.back}
        variant="secondary"
        onPress={() =>
          router.canGoBack() ? router.back() : router.replace("/(tabs)/money")
        }
      />
      {state.status === "idle" || state.status === "loading" ? (
        <Loading />
      ) : state.status === "failed" ? (
        <>
          <Message tone="error">
            {state.failure === "denied" ? t.denied : t.failed}
          </Message>
          <Button label={d.retry} onPress={() => void read.refresh()} />
          {state.failure === "denied" ? (
            <Button
              label={d.login.changeStore}
              onPress={() => chooseStore(null)}
            />
          ) : null}
        </>
      ) : data ? (
        <>
          {!data.statements.length ? (
            <Message>{data.total ? t.pastEnd : t.empty}</Message>
          ) : (
            data.statements.map((s) => (
              <Pressable
                key={s.id}
                accessibilityRole="button"
                accessibilityLabel={`${t[statementTitleKey(s)]} #${s.number}`}
                onPress={() =>
                  router.push({
                    pathname: "/statements/[tenant]/[statement]",
                    params: { tenant, statement: s.id },
                  })
                }
                style={({ pressed }) => [
                  styles.card,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.heading}>
                  {t[statementTitleKey(s)]} #{s.number}
                </Text>
                <Text style={styles.text}>
                  {t.period}: {statementPeriod(s, locale)}
                </Text>
                <Text style={styles.note}>
                  {t.issuedAt}: {formatAgreementTime(s.issuedAt, locale)}
                </Text>
                <Text style={styles.text}>
                  {t.opening}:{" "}
                  {formatPrice(s.openingOre, data.currency, locale)}
                </Text>
                <Text style={styles.text}>
                  {t.closing}:{" "}
                  {formatPrice(s.closingOre, data.currency, locale)}
                </Text>
              </Pressable>
            ))
          )}
          {data.total ? (
            <Text style={styles.note}>
              {t.page
                .replace("{page}", String(page + 1))
                .replace("{pages}", String(Math.ceil(data.total / 25)))}
            </Text>
          ) : null}
          {page > 0 ? (
            <Button
              label={t.first}
              variant="secondary"
              onPress={() => setPage(0)}
            />
          ) : null}
          <Button
            label={t.previous}
            variant="secondary"
            disabled={!page}
            onPress={() => setPage(page - 1)}
          />
          <Button
            label={t.next}
            variant="secondary"
            disabled={(page + 1) * 25 >= data.total || page >= 100000}
            onPress={() => setPage(page + 1)}
          />
          <Button
            label={t.refresh}
            variant="secondary"
            onPress={() => void read.refresh()}
          />
        </>
      ) : null}
    </Screen>
  );
}
const styles = StyleSheet.create({
  card: {
    minHeight: 48,
    padding: 16,
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  heading: { color: colors.brand, fontSize: 21, fontWeight: "600" },
  text: { color: colors.text, fontSize: 16, lineHeight: 24 },
  note: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  pressed: { opacity: 0.6 },
});
