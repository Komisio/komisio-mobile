import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import * as Crypto from "expo-crypto";
import { PendingDiscard } from "./pending-discard";
import { BalanceCard } from "./balance-card";
import {
  Button,
  Choice,
  StatusBadge,
  uiStyles,
  Field,
  Loading,
  Message,
  Screen,
  NavigationRow,
} from "./ui";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { createScopedRead } from "@/lib/scoped-read";
import { formatPrice } from "@/lib/catalogue";
import { payoutBadgeTone } from "@/lib/seller-overview";
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
  const [amount, setAmount] = useState("");
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
  // Keep a draft through reads/tab changes; clear only after confirmed registration.
  if (
    amount &&
    (change.status === "success" ||
      (change.status === "cleanup" && change.code === "success"))
  )
    setAmount("");
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
    <Screen
      title={d.tabs.money}
      bottomSafeArea={false}
      refresh={{
        refreshing: state.status === "loading",
        onRefresh: () => void read.refresh(),
        label: t.refresh,
      }}
    >
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
                : change.code === "rejected"
                  ? d.bank.rejected
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
          {change.status === "pending" && change.command ? (
            <PendingDiscard
              key={change.command.command.requestId}
              onDiscard={() => void writer.discard()}
            />
          ) : null}
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
      {change.status === "rejected" || change.status === "discarded" ? (
        <>
          <Message>
            {change.status === "rejected" ? d.bank.rejected : d.bank.discarded}
          </Message>
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
          <BalanceCard balance={data.balance} currency={data.currency} />
          <View style={styles.views}>
            {(["request", "history"] as const).map((value) => (
              <Choice
                key={value}
                label={value === "request" ? t.request : t.historyShort}
                selected={value === view}
                onPress={() => setView(value)}
              />
            ))}
          </View>
          {view === "request" ? (
            <>
              {change.status === "ready" ? (
                <PayoutForm
                  data={data}
                  amount={amount}
                  setAmount={setAmount}
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
              {!data.payouts.length ? (
                <Message>{data.total === 0 ? t.empty : t.pastEnd}</Message>
              ) : (
                data.payouts.map((payout) => (
                  <View key={payout.id} style={styles.card}>
                    <Text style={styles.heading}>
                      {formatPrice(payout.amountOre, data.currency, locale)}
                    </Text>
                    <StatusBadge tone={payoutBadgeTone(payout.status)}>
                      {d.overview.statuses[payout.status]}
                    </StatusBadge>
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
              {data.total > 25 || page > 0 ? (
                <>
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
              ) : null}
            </>
          )}
        </>
      ) : null}
      <View style={{ gap: 8 }}>
        <NavigationRow
          label={d.bank.title}
          onPress={() => router.push("/bank-account")}
        />
      </View>
    </Screen>
  );
}

function PayoutForm({
  data,
  enabled,
  onSubmit,
  amount,
  setAmount,
}: {
  data: PayoutPage;
  enabled: boolean;
  onSubmit: (amount: number) => void;
  amount: string;
  setAmount: (amount: string) => void;
}) {
  const { d, locale } = useI18n(),
    t = d.payouts;
  const [error, setError] = useState<
    "invalid" | "below" | "above" | "storage" | null
  >(null);
  const canRequest =
    data.balance.availableOre > 0 &&
    data.balance.availableOre >= data.thresholdOre;
  if (!canRequest)
    return (
      <View style={styles.card}>
        <Text style={styles.label}>{t.threshold}</Text>
        <Text style={styles.amount}>
          {formatPrice(data.thresholdOre, data.currency, locale)}
        </Text>
        <Text style={styles.note}>{t.insufficient}</Text>
      </View>
    );
  return (
    <View style={styles.card}>
      <Text style={styles.note}>
        {t.threshold}: {formatPrice(data.thresholdOre, data.currency, locale)}
      </Text>
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
      <Text style={styles.note}>{t.notice}</Text>
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
  views: uiStyles.choices,
  card: uiStyles.card,
  text: uiStyles.body,
  label: uiStyles.note,
  amount: { ...uiStyles.amount, fontSize: 30, lineHeight: 38 },
  heading: uiStyles.heading,
  note: uiStyles.note,
});
