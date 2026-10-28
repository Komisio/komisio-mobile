import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import * as Crypto from "expo-crypto";
import { Button, colors, Field, Loading, Message, Screen } from "./ui";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { createScopedRead } from "@/lib/scoped-read";
import { formatPrice } from "@/lib/catalogue";
import { formatAgreementTime } from "@/lib/seller-agreement";
import { payoutEndpoint, payoutWriter, readPayouts } from "@/lib/payout-api";
import {
  payoutAmount,
  payoutAmountInput,
  payoutLimitError,
  payoutOffset,
  type PayoutPage,
} from "@/lib/seller-payouts";

export function SellerPayouts({
  user,
  tenant,
  seller,
}: {
  user: string;
  tenant: string;
  seller: string;
}) {
  const { d, locale } = useI18n(),
    t = d.payouts;
  const { chooseStore, signOut, refreshAssurance } = useSession();
  const [page, setPage] = useState(0),
    [view, setView] = useState<"request" | "history">("request");
  const read = useMemo(
    () =>
      createScopedRead((signal) =>
        readPayouts(tenant, seller, payoutOffset(page), signal),
      ),
    [tenant, seller, page],
  );
  const writer = useMemo(
    () => payoutWriter(user, tenant, seller),
    [user, tenant, seller],
  );
  const state = useSyncExternalStore(
    read.subscribe,
    read.getState,
    read.getState,
  );
  const change = useSyncExternalStore(
    writer.subscribe,
    writer.getState,
    writer.getState,
  );
  useFocusEffect(
    useCallback(() => {
      void read.refresh();
      void writer.load();
      return read.cancel;
    }, [read, writer]),
  );
  const refresh = () => {
    void read.refresh();
    void writer.load();
  };
  const data = state.data;
  return (
    <Screen title={t.title}>
      <View style={styles.views}>
        {(["request", "history"] as const).map((value) => (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityState={{ selected: value === view }}
            style={[styles.choice, value === view && styles.selected]}
            onPress={() => setView(value)}
          >
            <Text style={styles.text}>{t[value]}</Text>
          </Pressable>
        ))}
      </View>
      <Button
        label={d.bank.title}
        variant="secondary"
        onPress={() => router.push("/bank-account")}
      />
      {!payoutEndpoint ? <Message>{t.notConfigured}</Message> : null}
      {change.status === "busy" || change.status === "idle" ? (
        <Loading />
      ) : null}
      {change.status === "pending" || change.status === "cleanup" ? (
        <View style={styles.card}>
          <Message>
            {change.status === "pending"
              ? t.pending
              : change.code === "success"
                ? t.cleanupSuccess
                : t.cleanupConflict}
          </Message>
          {change.command ? (
            <Text style={styles.amount}>
              {formatPrice(
                change.command.command.amountOre,
                change.command.currency,
                locale,
              )}
            </Text>
          ) : null}
          {change.code === "AUTH_REQUIRED" ? (
            <>
              <Message tone="error">{d.bank.auth}</Message>
              <Button label={d.account.logout} onPress={() => void signOut()} />
            </>
          ) : null}
          {change.code === "MFA_REQUIRED" ? (
            <>
              <Message tone="error">{d.bank.mfa}</Message>
              <Button
                label={d.bank.verify}
                onPress={() => void refreshAssurance()}
              />
            </>
          ) : null}
          {change.code === "PASSWORD_UPDATE_REQUIRED" ? (
            <>
              <Message tone="error">{d.bank.recovery}</Message>
              <Button label={d.account.logout} onPress={() => void signOut()} />
            </>
          ) : null}
          <Button
            label={change.status === "cleanup" ? t.finish : t.retrySame}
            disabled={!payoutEndpoint && change.status === "pending"}
            onPress={() => void writer.retry()}
          />
        </View>
      ) : null}
      {change.status === "blocked" ? (
        <>
          <Message tone="error">
            {change.code === "BUSY"
              ? d.bank.busy
              : change.code === "UNSUPPORTED"
                ? t.unsupported
                : d.bank.storage}
          </Message>
          <Button label={d.retry} onPress={() => void writer.load()} />
        </>
      ) : null}
      {change.status === "success" || change.status === "conflict" ? (
        <>
          <Message>{change.status === "success" ? t.saved : t.changed}</Message>
          <Button label={t.refresh} onPress={refresh} />
        </>
      ) : null}
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
          <View style={styles.card}>
            <Text style={styles.label}>{d.overview.available}</Text>
            <Text style={styles.amount}>
              {formatPrice(data.balance.availableOre, data.currency, locale)}
            </Text>
            <Text style={styles.text}>
              {d.overview.reserved}:{" "}
              {formatPrice(data.balance.reservedOre, data.currency, locale)}
            </Text>
            <Text style={styles.text}>
              {d.overview.paid}:{" "}
              {formatPrice(data.balance.paidOre, data.currency, locale)}
            </Text>
            <Text style={styles.note}>{d.overview.balanceNote}</Text>
            <Text style={styles.text}>
              {t.threshold}:{" "}
              {formatPrice(data.thresholdOre, data.currency, locale)}
            </Text>
          </View>
          {view === "request" ? (
            <>
              <Message>{t.notice}</Message>
              {change.status === "ready" ? (
                <PayoutForm
                  data={data}
                  enabled={Boolean(payoutEndpoint)}
                  onSubmit={(amountOre) => {
                    void writer.submit({
                      currency: data.currency,
                      command: {
                        action: "requestPayout",
                        tenantId: tenant,
                        sellerId: seller,
                        requestId: Crypto.randomUUID(),
                        amountOre,
                      },
                    });
                  }}
                />
              ) : null}
            </>
          ) : (
            <>
              <Text style={styles.heading} accessibilityRole="header">
                {t.history}
              </Text>
              {!data.payouts.length ? (
                <Message>{data.total === 0 ? t.empty : t.pastEnd}</Message>
              ) : (
                data.payouts.map((payout) => (
                  <View key={payout.id} style={styles.card}>
                    <Text style={styles.heading}>
                      {formatPrice(payout.amountOre, data.currency, locale)}
                    </Text>
                    <Text style={styles.text}>
                      {d.overview.statuses[payout.status]}
                    </Text>
                    <Text style={styles.note}>
                      {d.overview.requestedAt}:{" "}
                      {formatAgreementTime(payout.requestedAt, locale)}
                    </Text>
                  </View>
                ))
              )}
              {data.total > 0 ? (
                <Text style={styles.note}>
                  {t.page
                    .replace("{page}", String(page + 1))
                    .replace("{pages}", String(Math.ceil(data.total / 25)))
                    .replace("{total}", String(data.total))}
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
                disabled={page === 0}
                onPress={() => setPage(page - 1)}
              />
              <Button
                label={t.next}
                variant="secondary"
                disabled={(page + 1) * 25 >= data.total || page >= 100000}
                onPress={() => setPage(page + 1)}
              />
            </>
          )}
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

function PayoutForm({
  data,
  enabled,
  onSubmit,
}: {
  data: PayoutPage;
  enabled: boolean;
  onSubmit: (amount: number) => void;
}) {
  const { d } = useI18n(),
    t = d.payouts;
  const [amount, setAmount] = useState(""),
    [error, setError] = useState<
      "invalid" | "below" | "above" | "storage" | null
    >(null);
  const canRequest =
    data.balance.availableOre > 0 &&
    data.balance.availableOre >= data.thresholdOre;
  return (
    <View style={styles.card}>
      {!canRequest ? <Message>{t.insufficient}</Message> : null}
      <Field
        label={t.amount.replace("{currency}", data.currency)}
        value={amount}
        onChangeText={(value) => {
          setAmount(value);
          setError(null);
        }}
        editable={enabled && canRequest}
        keyboardType="decimal-pad"
        maxLength={12}
        autoComplete="off"
      />
      <Button
        label={t.useAll}
        variant="secondary"
        disabled={
          !enabled || !canRequest || data.balance.availableOre > 99999999999
        }
        onPress={() => {
          setAmount(payoutAmountInput(data.balance.availableOre));
          setError(null);
        }}
      />
      {error ? (
        <Message tone="error">
          {error === "storage" ? d.bank.storage : t[error]}
        </Message>
      ) : null}
      <Button
        label={t.submit}
        disabled={!enabled || !canRequest}
        onPress={() => {
          let parsed: number;
          try {
            parsed = payoutAmount(amount);
          } catch {
            setError("invalid");
            return;
          }
          const issue = payoutLimitError(
            parsed,
            data.balance.availableOre,
            data.thresholdOre,
          );
          if (issue) {
            setError(issue);
            return;
          }
          try {
            setError(null);
            onSubmit(parsed);
          } catch {
            setError("storage");
          }
        }}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  views: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: {
    minHeight: 48,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.brand,
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  selected: { backgroundColor: colors.accent, borderWidth: 2 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  text: { fontSize: 16, lineHeight: 24, color: colors.text },
  label: { fontSize: 16, color: colors.muted },
  amount: { fontSize: 30, fontWeight: "700", color: colors.brand },
  heading: { fontSize: 21, fontWeight: "600", color: colors.brand },
  note: { fontSize: 14, lineHeight: 21, color: colors.muted },
});
