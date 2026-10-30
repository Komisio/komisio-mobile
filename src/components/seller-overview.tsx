import { useCallback, useMemo, useSyncExternalStore } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { createScopedRead } from "@/lib/scoped-read";
import { readSellerOverview } from "@/lib/seller-overview-api";
import { payoutBadgeTone } from "@/lib/seller-overview";
import { formatPrice } from "@/lib/catalogue";
import { formatItemDate } from "@/lib/seller-items";
import { BalanceCard } from "./balance-card";
import {
  Button,
  colors,
  uiStyles,
  Loading,
  Message,
  Screen,
  ItemCard,
  StatusBadge,
} from "./ui";

export function SellerOverviewScreen({
  tenant,
  seller,
  storeName,
}: {
  tenant: string;
  seller: string;
  storeName: string;
}) {
  const { d, locale } = useI18n();
  const { chooseStore } = useSession();
  const t = d.overview;
  const read = useMemo(
    () =>
      createScopedRead((signal) => readSellerOverview(tenant, seller, signal)),
    [tenant, seller],
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
  const money = (ore: number) =>
    data ? formatPrice(ore, data.currency, locale) : "";
  return (
    <Screen
      bottomSafeArea={false}
      title={d.tabs.overview}
      refresh={{
        refreshing: state.status === "loading",
        onRefresh: () => void read.refresh(),
        label: t.refresh,
      }}
    >
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
              variant="secondary"
              onPress={() => chooseStore(null)}
            />
          ) : null}
        </>
      ) : data ? (
        <>
          <Text style={styles.store}>{storeName}</Text>
          <BalanceCard balance={data.balance} currency={data.currency} />
          <View style={styles.counts}>
            {(["active", "sold", "expiring", "ended"] as const).map((key) => (
              <View
                key={key}
                style={[
                  styles.count,
                  key === "active" && styles.activeCount,
                  key === "expiring" &&
                    data.counts.expiring > 0 &&
                    styles.attentionCount,
                ]}
              >
                <Text style={styles.number}>{data.counts[key]}</Text>
                <Text style={styles.countLabel}>{t[key]}</Text>
              </View>
            ))}
          </View>
          {data.counts.expiring > 0 ? (
            <View style={styles.section}>
              <Text style={styles.heading} accessibilityRole="header">
                {t.expiring}
              </Text>
              {data.expiring.map((item) => (
                <ItemCard
                  compact
                  key={item.id}
                  label={`${item.title ?? d.items.untitled}, ${item.reference}`}
                  onPress={() =>
                    router.push({
                      pathname: "/my-items/[tenant]/[item]",
                      params: { tenant, item: item.id },
                    })
                  }
                >
                  <Text style={styles.itemTitle}>
                    {item.title ?? d.items.untitled}
                  </Text>
                  <Text style={styles.note}>{item.reference}</Text>
                  <Text style={styles.text}>
                    {d.items.periodEnd}:{" "}
                    {formatItemDate(item.periodEnd, locale)}
                  </Text>
                </ItemCard>
              ))}
              {data.counts.expiring > data.expiring.length ? (
                <Text style={styles.note}>
                  {t.preview
                    .replace("{shown}", String(data.expiring.length))
                    .replace("{count}", String(data.counts.expiring))}
                </Text>
              ) : null}
            </View>
          ) : null}
          {data.payouts.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.heading} accessibilityRole="header">
                {t.recentPayouts}
              </Text>
              {data.payouts.map((payout) => (
                <View key={payout.id} style={styles.item}>
                  <Text style={styles.itemTitle}>
                    {money(payout.amountOre)}
                  </Text>
                  <StatusBadge tone={payoutBadgeTone(payout.status)}>
                    {t.statuses[payout.status]}
                  </StatusBadge>
                  <Text style={styles.note}>
                    {t.requestedAt}:{" "}
                    {formatItemDate(payout.requestedAt, locale)}
                  </Text>
                </View>
              ))}
              <Button
                label={t.allPayouts}
                variant="text"
                onPress={() => router.navigate("/(tabs)/money")}
              />
            </View>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}
const styles = StyleSheet.create({
  counts: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  count: {
    flexBasis: 130,
    flexGrow: 1,
    padding: 16,
    gap: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  store: { ...uiStyles.note, marginTop: -8 },
  activeCount: {
    backgroundColor: colors.softAccent,
    borderColor: colors.softAccent,
  },
  attentionCount: {
    backgroundColor: colors.warningSurface,
    borderColor: colors.warningSurface,
  },
  countLabel: uiStyles.label,
  number: { ...uiStyles.amount, fontSize: 28, lineHeight: 36 },
  text: { ...uiStyles.body },
  note: { ...uiStyles.note },
  heading: { ...uiStyles.heading },
  section: { gap: 12, marginTop: 8 },
  item: {
    padding: 16,
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    minHeight: 48,
  },
  itemTitle: { color: colors.text, fontSize: 18, fontWeight: "600" },
});
