import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { createCataloguePager, formatPrice } from "@/lib/catalogue";
import { readCatalogue } from "@/lib/catalogue-api";
import { useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { Button, colors, Field, Loading, Message } from "./ui";
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
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          {name}
        </Text>
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
      {state.status === "loading" ? (
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
        <FlatList
          data={state.items}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.row}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <Text style={styles.count}>
              {t.count.replace("{count}", String(state.total))}
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.title ?? t.untitled}, ${formatPrice(item.priceOre, state.currency, locale)}`}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              onPress={() =>
                router.push({
                  pathname: "/catalogue/[tenant]/[item]",
                  params: { tenant, item: item.id },
                })
              }
            >
              <CataloguePhoto
                photo={item.photo}
                tenant={tenant}
                label={item.title ?? t.photo}
              />
              <View style={styles.cardBody}>
                <Text style={styles.itemTitle}>{item.title ?? t.untitled}</Text>
                {item.category ? (
                  <Text style={styles.category}>{item.category}</Text>
                ) : null}
                <Text style={styles.price}>
                  {formatPrice(item.priceOre, state.currency, locale)}
                </Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <Message>{submittedQuery ? t.noMatches : t.empty}</Message>
          }
          ListFooterComponent={
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
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { padding: 16, gap: 16 },
  title: { fontSize: 26, fontWeight: "700", color: colors.brand },
  searchRow: { flexDirection: "row", gap: 8, alignItems: "flex-end" },
  search: { flex: 1 },
  message: { padding: 16, gap: 16 },
  list: { padding: 16, paddingTop: 0, gap: 12 },
  row: { gap: 12 },
  count: { color: colors.muted, fontSize: 14, marginBottom: 4 },
  card: {
    width: "48%",
    flexGrow: 0,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  pressed: { opacity: 0.7 },
  cardBody: { padding: 12, gap: 6 },
  itemTitle: { fontSize: 16, fontWeight: "600", color: colors.text },
  category: { fontSize: 13, color: colors.muted },
  price: { fontSize: 17, fontWeight: "700", color: colors.brand },
  footer: { paddingVertical: 16, gap: 12 },
});
