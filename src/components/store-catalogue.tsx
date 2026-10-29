import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { createCataloguePager, formatPrice } from "@/lib/catalogue";
import { readCatalogue } from "@/lib/catalogue-api";
import { useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import {
  Button,
  colors,
  uiStyles,
  Field,
  Loading,
  Message,
  PageHeading,
  ItemCard,
} from "./ui";
import { Brand } from "./brand";
import { CataloguePhoto } from "./catalogue-photo";

export function StoreCatalogue({
  tenant,
  name,
}: {
  tenant: string;
  name: string;
}) {
  const { d, locale } = useI18n();
  const { chooseStore } = useSession();
  const t = d.catalogue;
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const pager = useMemo(
    () =>
      createCataloguePager((q, offset, signal) =>
        readCatalogue(tenant, q, offset, signal),
      ),
    [tenant],
  );
  const state = useSyncExternalStore(
    pager.subscribe,
    pager.getState,
    pager.getState,
  );
  useFocusEffect(
    useCallback(() => {
      void pager.revalidate();
      return pager.cancel;
    }, [pager]),
  );
  const search = () => {
    setSubmittedQuery(query.trim());
    void pager.search(query);
  };
  const failure = state.failure ? t[state.failure] : null;
  const header = (
    <View style={styles.header}>
      <Brand />
      <PageHeading title={name} />
      <Button
        label={d.storeInfo.title}
        variant="secondary"
        onPress={() => router.push("/store-info")}
      />
      <View style={styles.searchRow}>
        <View style={styles.search}>
          <Field
            label={t.search}
            value={query}
            onChangeText={setQuery}
            maxLength={120}
            returnKeyType="search"
            onSubmitEditing={search}
            autoCorrect={false}
          />
        </View>
        <Button label={t.searchButton} onPress={search} />
      </View>
    </View>
  );
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <FlatList
        data={state.status === "ready" ? state.items : []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <>
            {header}
            {state.status === "ready" && (
              <Text style={styles.count}>
                {t.count.replace("{count}", String(state.total))}
              </Text>
            )}
          </>
        }
        renderItem={({ item }) => (
          <ItemCard
            label={`${item.title ?? t.untitled}, ${formatPrice(item.priceOre, state.currency, locale)}`}
            media={
              item.photo ? (
                <CataloguePhoto
                  photo={item.photo}
                  tenant={tenant}
                  label={item.title ?? t.photo}
                />
              ) : undefined
            }
            onPress={() =>
              router.push({
                pathname: "/catalogue/[tenant]/[item]",
                params: { tenant, item: item.id },
              })
            }
          >
            <Text style={styles.itemTitle}>{item.title ?? t.untitled}</Text>
            {item.category ? (
              <Text style={styles.category}>{item.category}</Text>
            ) : null}
            <Text style={styles.price}>
              {formatPrice(item.priceOre, state.currency, locale)}
            </Text>
          </ItemCard>
        )}
        ListEmptyComponent={
          state.status === "loading" ? (
            <Loading />
          ) : state.status === "failed" ? (
            <View style={styles.message}>
              <Message tone="error">{failure}</Message>
              <Button label={d.retry} onPress={() => void pager.refresh()} />
              {state.failure === "denied" && (
                <Button
                  label={d.login.changeStore}
                  variant="secondary"
                  onPress={() => chooseStore(null)}
                />
              )}
            </View>
          ) : (
            <Message>{submittedQuery ? t.noMatches : t.empty}</Message>
          )
        }
        ListFooterComponent={
          state.status === "ready" ? (
            <View style={styles.footer}>
              {failure && <Message tone="error">{failure}</Message>}
              {state.offset < state.total && (
                <Button
                  label={state.failure ? d.retry : t.more}
                  busy={state.more}
                  disabled={state.refreshing}
                  onPress={() => void pager.more()}
                />
              )}
              <Button
                label={t.refresh}
                variant="secondary"
                disabled={state.more}
                busy={state.refreshing}
                onPress={() => void pager.revalidate()}
              />
            </View>
          ) : undefined
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { gap: 16, marginBottom: 16 },
  searchRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "flex-end",
  },
  search: { flexGrow: 1, flexBasis: 180, minWidth: 0 },
  message: { ...uiStyles.content },
  list: { ...uiStyles.content, gap: 12 },
  count: { ...uiStyles.note, marginBottom: 4 },
  itemTitle: { ...uiStyles.body, fontWeight: "600" },
  category: { ...uiStyles.note },
  price: { ...uiStyles.amount },
  footer: { paddingVertical: 16, gap: 12 },
});
