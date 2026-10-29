import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { createCataloguePager, formatPrice } from "@/lib/catalogue";
import { readSellerItems } from "@/lib/seller-items-api";
import {
  formatItemDate,
  itemFilters,
  sellerItemDate,
  sellerItemPrice,
  sellerItemStatus,
  type ItemFilter,
  type SellerItem,
} from "@/lib/seller-items";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { Button, colors, Field, Loading, Message } from "./ui";

export function SellerItems({
  tenant,
  seller,
}: {
  tenant: string;
  seller: string;
}) {
  const { d, locale } = useI18n();
  const { chooseStore } = useSession();
  const t = d.items;
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [filter, setFilter] = useState<ItemFilter>("active");
  const pager = useMemo(
    () =>
      createCataloguePager<SellerItem>(
        (q, offset, signal) =>
          readSellerItems(tenant, seller, q, offset, filter, signal),
        submittedQuery,
      ),
    [tenant, seller, filter, submittedQuery],
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
    if (query.trim() === submittedQuery) void pager.refresh();
    else setSubmittedQuery(query.trim());
  };
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          {t.title}
        </Text>
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
        <View style={styles.filters}>
          {itemFilters.map((value) => (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityState={{ selected: filter === value }}
              onPress={() => setFilter(value)}
              style={({ pressed }) => [
                styles.filter,
                filter === value && styles.selected,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === value && styles.selectedText,
                ]}
              >
                {t.filters[value]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      {state.status === "loading" ? (
        <Loading />
      ) : state.status === "failed" ? (
        <View style={styles.message}>
          <Message tone="error">{t[state.failure ?? "failed"]}</Message>
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
          key={`${filter}:${submittedQuery}`}
          data={state.items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <Text accessibilityLiveRegion="polite" style={styles.count}>
              {t.count.replace("{count}", String(state.total))}
            </Text>
          }
          renderItem={({ item }) => {
            const price = sellerItemPrice(item),
              date = sellerItemDate(item);
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${item.title ?? t.untitled}, ${t.statuses[sellerItemStatus(item)]}`}
                style={({ pressed }) => [
                  styles.card,
                  pressed && styles.pressed,
                ]}
                onPress={() =>
                  router.push({
                    pathname: "/my-items/[tenant]/[item]",
                    params: { tenant, item: item.id },
                  })
                }
              >
                <Text style={styles.itemTitle}>{item.title ?? t.untitled}</Text>
                <Text style={styles.reference}>
                  {item.reference}
                  {item.category ? ` · ${item.category}` : ""}
                </Text>
                <Text style={styles.price}>
                  {price === null
                    ? t.unavailablePrice
                    : formatPrice(price, state.currency, locale)}
                </Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {t.statuses[sellerItemStatus(item)]}
                  </Text>
                </View>
                <Text style={styles.date}>
                  {t[date.label]}:{" "}
                  {date.value
                    ? formatItemDate(date.value, locale)
                    : t.missingDate}
                </Text>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <Message>{submittedQuery ? t.noMatches : t.empty}</Message>
          }
          ListFooterComponent={
            <View style={styles.footer}>
              {state.failure && (
                <Message tone="error">{t[state.failure]}</Message>
              )}
              {state.offset < state.total && (
                <Button
                  label={t.more}
                  busy={state.more}
                  disabled={state.refreshing || Boolean(state.failure)}
                  onPress={() => void pager.more()}
                />
              )}
              <Button
                label={state.failure ? t.retryRefresh : t.refresh}
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
  header: { padding: 16, gap: 12 },
  title: { fontSize: 26, fontWeight: "700", color: colors.brand },
  searchRow: { flexDirection: "row", gap: 8, alignItems: "flex-end" },
  search: { flex: 1 },
  filters: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  filter: {
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 24,
    backgroundColor: colors.surface,
  },
  selected: { backgroundColor: colors.brand, borderColor: colors.brand },
  filterText: { fontSize: 15, color: colors.text },
  selectedText: { color: "#fff", fontWeight: "600" },
  message: { padding: 16, gap: 16 },
  list: { padding: 16, paddingTop: 0, gap: 12 },
  count: { color: colors.muted, fontSize: 14, marginBottom: 4 },
  card: {
    padding: 16,
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.7 },
  itemTitle: { fontSize: 18, fontWeight: "600", color: colors.text },
  reference: { fontSize: 14, color: colors.muted },
  price: { fontSize: 20, fontWeight: "700", color: colors.brand },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: colors.accent,
  },
  badgeText: { fontSize: 14, color: colors.brand },
  date: { fontSize: 15, color: colors.text },
  footer: { paddingVertical: 16, gap: 12 },
});
