import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  formatPrice,
  isId,
  readFailure,
  type ReadFailure,
} from "@/lib/catalogue";
import { readSellerItem } from "@/lib/seller-items-api";
import {
  collectionDate,
  formatItemDate,
  plannedMarkdown,
  sellerItemDate,
  sellerItemPrice,
  sellerItemStatus,
  type SellerItemDetail,
} from "@/lib/seller-items";
import { useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { Button, colors, Loading, Message, Screen } from "@/components/ui";
import { SellerGate } from "@/components/seller-gate";

const back = () =>
  router.canGoBack() ? router.back() : router.replace("/(tabs)/items");

export default function MyItemScreen() {
  const { tenant, item } = useLocalSearchParams<{
    tenant: string;
    item: string;
  }>();
  const { store, account, session } = useSession();
  const { d } = useI18n();
  if (!store || store.id !== tenant || !isId(item))
    return (
      <Screen title={d.items.detail}>
        <Message>{d.items.missing}</Message>
        <Button label={d.items.back} onPress={back} />
      </Screen>
    );
  return (
    <SellerGate title={d.items.detail}>
      {account &&
        account !== "failed" &&
        account.tenantId === tenant &&
        session && (
          <ItemDetail
            key={`${session.user.id}:${tenant}:${account.sellerId}:${item}`}
            tenant={tenant}
            seller={account.sellerId}
            id={item}
          />
        )}
    </SellerGate>
  );
}

type ItemProps = { tenant: string; seller: string; id: string };

function ItemDetail(props: ItemProps) {
  const [attempt, setAttempt] = useState(0);
  return (
    <ItemRead key={attempt} {...props} retry={() => setAttempt((n) => n + 1)} />
  );
}

function ItemRead({
  tenant,
  seller,
  id,
  retry,
}: ItemProps & { retry: () => void }) {
  const { d, locale } = useI18n(),
    t = d.items;
  const [data, setData] = useState<SellerItemDetail | null>(null);
  const [failure, setFailure] = useState<ReadFailure | null>(null);
  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      setData(null);
      setFailure(null);
      readSellerItem(tenant, seller, id, controller.signal)
        .then((value) => {
          if (!controller.signal.aborted) setData(value);
        })
        .catch((error) => {
          if (!controller.signal.aborted) setFailure(readFailure(error));
        });
      return () => controller.abort();
    }, [tenant, seller, id]),
  );
  const item = data?.item,
    price = item ? sellerItemPrice(item) : null;
  const date = item ? sellerItemDate(item) : null,
    next = item ? plannedMarkdown(item) : null,
    collection = item ? collectionDate(item) : null;
  return (
    <Screen title={t.detail}>
      <Button label={t.back} variant="secondary" onPress={back} />
      {failure ? (
        <>
          <Message tone="error">{t[failure]}</Message>
          {failure !== "missing" && <Button label={d.retry} onPress={retry} />}
        </>
      ) : !data || !item || !date ? (
        <Loading />
      ) : (
        <>
          <Text accessibilityRole="header" style={styles.title}>
            {item.title ?? t.untitled}
          </Text>
          {item.category && <Text style={styles.muted}>{item.category}</Text>}
          <Text style={styles.status}>
            {t.statuses[sellerItemStatus(item)]}
          </Text>
          <Text style={styles.muted}>
            {item.stage === "sold" ? t.soldPrice : t.price}
          </Text>
          <Text style={styles.price}>
            {price === null
              ? t.unavailablePrice
              : formatPrice(price, data.currency, locale)}
          </Text>
          <View style={styles.facts}>
            <Fact label={t.reference} value={item.reference} />
            <Fact
              label={t.acceptedAt}
              value={formatItemDate(item.acceptedAt, locale)}
            />
            <Fact
              label={t.acceptedPrice}
              value={
                item.acceptedPriceOre === null
                  ? t.unavailablePrice
                  : formatPrice(item.acceptedPriceOre, data.currency, locale)
              }
            />
            <Fact
              label={t[date.label]}
              value={
                date.value ? formatItemDate(date.value, locale) : t.missingDate
              }
            />
            {collection && (
              <Fact
                label={t.collectionDeadline}
                value={formatItemDate(collection, locale)}
              />
            )}
          </View>
          {collection && <Message>{t.collectionHint}</Message>}
          {next && (
            <View style={styles.plan}>
              <Text accessibilityRole="header" style={styles.heading}>
                {t.nextStep}
              </Text>
              <Text style={styles.value}>
                {formatItemDate(next.at, locale)} ·{" "}
                {formatPrice(next.priceOre, data.currency, locale)}
              </Text>
              <Message>
                {data.automaticMarkdowns ? t.automatic : t.manual}
              </Message>
            </View>
          )}
        </>
      )}
    </Screen>
  );
}
function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  title: { fontSize: 26, color: colors.text, fontWeight: "700" },
  muted: { fontSize: 15, color: colors.muted },
  price: { fontSize: 30, color: colors.brand, fontWeight: "700" },
  status: {
    alignSelf: "flex-start",
    backgroundColor: colors.accent,
    color: colors.brand,
    fontSize: 16,
    padding: 8,
    borderRadius: 8,
  },
  facts: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.surface,
    gap: 16,
  },
  fact: { gap: 4 },
  value: { fontSize: 17, color: colors.text },
  plan: {
    gap: 12,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  heading: { fontSize: 19, color: colors.brand, fontWeight: "600" },
});
