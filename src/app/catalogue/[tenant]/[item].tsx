import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  type CatalogueDetail,
  type ReadFailure,
  formatPrice,
  isId,
  readFailure,
} from "@/lib/catalogue";
import { readCatalogueItem } from "@/lib/catalogue-api";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import {
  Button,
  colors,
  uiStyles,
  Loading,
  Message,
  Screen,
} from "@/components/ui";
import { SellerGate } from "@/components/seller-gate";
import { CataloguePhoto } from "@/components/catalogue-photo";

export default function CatalogueItemScreen() {
  const { tenant, item } = useLocalSearchParams<{
    tenant: string;
    item: string;
  }>();
  const { store, session } = useSession();
  const { d } = useI18n();
  // A stale deep link must not read an item using a newly selected store.
  if (!store || tenant !== store.id || !isId(item))
    return (
      <Screen topSafeArea={false} title={d.catalogue.detail}>
        <Message>{d.catalogue.missing}</Message>
      </Screen>
    );
  return (
    <SellerGate topSafeArea={false} title={d.catalogue.detail}>
      <ItemDetail
        key={`${session?.user.id}:${tenant}:${item}`}
        tenant={tenant}
        item={item}
      />
    </SellerGate>
  );
}

function ItemDetail({ tenant, item }: { tenant: string; item: string }) {
  const [attempt, setAttempt] = useState(0);
  return (
    <ItemRead
      key={attempt}
      tenant={tenant}
      item={item}
      retry={() => setAttempt((n) => n + 1)}
    />
  );
}

function ItemRead({
  tenant,
  item,
  retry,
}: {
  tenant: string;
  item: string;
  retry: () => void;
}) {
  const { d, locale } = useI18n();
  const t = d.catalogue;
  const [data, setData] = useState<CatalogueDetail | null>(null);
  const [failure, setFailure] = useState<ReadFailure | null>(null);
  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      setData(null);
      setFailure(null);
      readCatalogueItem(tenant, item, controller.signal)
        .then((data) => {
          if (!controller.signal.aborted) setData(data);
        })
        .catch((e) => {
          if (!controller.signal.aborted) setFailure(readFailure(e));
        });
      return () => controller.abort();
    }, [tenant, item]),
  );
  return (
    <Screen topSafeArea={false} title={data ? undefined : t.detail}>
      {failure ? (
        <>
          <Message tone="error">{t[failure]}</Message>
          {failure !== "missing" && <Button label={d.retry} onPress={retry} />}
        </>
      ) : !data ? (
        <Loading />
      ) : (
        <>
          {data.photos.length > 0 && (
            <Gallery
              key={data.photos.map((p) => p.path).join(":")}
              data={data}
              tenant={tenant}
            />
          )}
          <View style={styles.summary}>
            <Text accessibilityRole="header" style={styles.title}>
              {data.title ?? t.untitled}
            </Text>
            <Text style={styles.price}>
              {formatPrice(data.priceOre, data.currency, locale)}
            </Text>
          </View>
          {data.facts.length ? (
            <>
              <Text accessibilityRole="header" style={styles.heading}>
                {t.facts}
              </Text>
              <View style={styles.facts}>
                {data.facts.map((fact) => (
                  <View key={fact.slug} style={styles.fact}>
                    <Text style={styles.label}>{t.factLabels[fact.slug]}</Text>
                    <Text style={styles.value}>{fact.value}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}

function Gallery({ data, tenant }: { data: CatalogueDetail; tenant: string }) {
  const { d } = useI18n();
  const t = d.catalogue;
  const [index, setIndex] = useState(0);
  return (
    <View style={styles.gallery}>
      <View style={styles.galleryPhoto}>
        <CataloguePhoto
          photo={data.photos[index] ?? null}
          tenant={tenant}
          label={`${data.title ?? t.photo} ${index + 1}`}
          retryable
        />
      </View>
      {data.photos.length > 1 && (
        <>
          <Text style={styles.counter}>
            {t.imageCount
              .replace("{current}", String(index + 1))
              .replace("{total}", String(data.photos.length))}
          </Text>
          <View style={styles.navigation}>
            <View style={styles.control}>
              <Button
                label={t.previous}
                variant="secondary"
                disabled={index === 0}
                onPress={() => setIndex((n) => n - 1)}
              />
            </View>
            <View style={styles.control}>
              <Button
                label={t.next}
                variant="secondary"
                disabled={index === data.photos.length - 1}
                onPress={() => setIndex((n) => n + 1)}
              />
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  gallery: { gap: 12 },
  galleryPhoto: { borderRadius: 16, overflow: "hidden" },
  counter: { color: colors.muted, textAlign: "center", fontSize: 14 },
  navigation: { flexDirection: "row", gap: 12 },
  control: { flex: 1 },
  summary: { gap: 8, paddingVertical: 8 },
  title: { ...uiStyles.title },
  price: { ...uiStyles.amount, fontSize: 24, lineHeight: 32 },
  heading: { ...uiStyles.heading },
  facts: { ...uiStyles.surface, paddingHorizontal: 16 },
  fact: {
    flexDirection: "row",
    gap: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
  label: { ...uiStyles.body, flex: 1, color: colors.muted },
  value: { ...uiStyles.body, flex: 2 },
});
