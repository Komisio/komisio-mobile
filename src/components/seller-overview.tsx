import { useCallback, useMemo, useSyncExternalStore } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { createScopedRead } from "@/lib/scoped-read";
import { readSellerOverview } from "@/lib/seller-overview-api";
import { formatPrice } from "@/lib/catalogue";
import { formatItemDate } from "@/lib/seller-items";
import {
  Button,
  colors,
  uiStyles,
  Loading,
  Message,
  Screen,
  ItemCard,
  NavigationRow,
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
          {data.counts.expiring > 0 ? (
            <NavigationRow
              label={
                data.counts.expiring === 1
                  ? t.attentionOne
                  : t.attentionCount.replace(
                      "{count}",
                      String(data.counts.expiring),
                    )
              }
              onPress={() =>
                router.navigate({
                  pathname: "/(tabs)/items",
                  params: { filter: "expiring" },
                })
              }
            />
          ) : null}
          <View style={styles.counts}>
            {(["active", "sold"] as const).map((key) => (
              <View key={key} style={styles.count}>
                <Text style={styles.number}>{data.counts[key]}</Text>
                <Text style={styles.countLabel}>
                  {key === "active"
                    ? d.items.filters.active
                    : d.items.filters.sold}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.section}>
            <Text style={uiStyles.heading} accessibilityRole="header">
              {t.recentSales}
            </Text>
            {data.recentSales === null ? (
              <>
                <Message tone="error">{t.salesFailed}</Message>
                <Button
                  label={d.retry}
                  variant="secondary"
                  onPress={() => void read.refresh()}
                />
              </>
            ) : data.recentSales.length === 0 ? (
              <Text style={uiStyles.note}>{t.noSales}</Text>
            ) : (
              data.recentSales.map((sale) => (
                <ItemCard
                  compact
                  key={sale.id}
                  label={`${sale.title ?? d.items.untitled}, ${formatItemDate(sale.soldAt, locale)}, ${t.salePrice}: ${formatPrice(sale.soldPriceOre, data.currency, locale)}`}
                  onPress={() =>
                    router.push({
                      pathname: "/my-items/[tenant]/[item]",
                      params: { tenant, item: sale.id },
                    })
                  }
                >
                  <View style={styles.sale}>
                    <View style={styles.description}>
                      <Text style={uiStyles.itemName}>
                        {sale.title ?? d.items.untitled}
                      </Text>
                      <Text style={uiStyles.note}>
                        {formatItemDate(sale.soldAt, locale)}
                      </Text>
                    </View>
                    <View style={styles.price}>
                      <Text style={uiStyles.note}>{t.salePrice}</Text>
                      <Text style={uiStyles.itemPrice}>
                        {formatPrice(sale.soldPriceOre, data.currency, locale)}
                      </Text>
                    </View>
                  </View>
                </ItemCard>
              ))
            )}
          </View>
        </>
      ) : null}
    </Screen>
  );
}
const styles = StyleSheet.create({
  store: { ...uiStyles.note, marginTop: -8 },
  counts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    padding: 16,
    borderRadius: 20,
    borderCurve: "continuous",
    backgroundColor: colors.brand,
  },
  count: { flex: 1, flexBasis: 100, gap: 4 },
  number: {
    ...uiStyles.amount,
    color: colors.onBrand,
    fontSize: 28,
    lineHeight: 36,
  },
  countLabel: { ...uiStyles.label, color: colors.accent },
  section: { gap: 12 },
  sale: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "center",
  },
  description: { flex: 1, flexBasis: 140, gap: 4 },
  price: { maxWidth: "100%", gap: 4 },
});
