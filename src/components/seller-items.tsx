import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { FlatList, Keyboard, StyleSheet, Text, View } from "react-native";
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
import { DetailSheet } from "./detail-sheet";
import {
  Button,
  colors,
  uiStyles,
  Field,
  Loading,
  Message,
  PageHeading,
  ItemCard,
  FilterChip,
  StatusBadge,
} from "./ui";

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
  const [filtersOpen, setFiltersOpen] = useState(false);
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
    Keyboard.dismiss();
    if (query.trim() === submittedQuery) void pager.refresh();
    else setSubmittedQuery(query.trim());
  };
  const header = (
    <View style={styles.header}>
      <PageHeading title={t.title} />
      <View style={styles.searchRow}>
        <View style={styles.search}>
          <Field
            label={t.search}
            labelHidden
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
      <View style={styles.filterRow}>
        <Button
          variant="secondary"
          label={`${t.filters[filter]} ▾`}
          accessibilityLabel={`${t.filter}: ${t.filters[filter]}`}
          expanded={filtersOpen}
          onPress={() => setFiltersOpen(true)}
        />
        {state.status === "ready" ? (
          <StatusBadge tone="neutral" live>
            {t.count.replace("{count}", String(state.total))}
          </StatusBadge>
        ) : null}
      </View>
    </View>
  );
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <FlatList
        key={`${filter}:${submittedQuery}`}
        data={state.status === "ready" ? state.items : []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshing={state.refreshing}
        onRefresh={() => void pager.revalidate()}
        ListHeaderComponent={
          <>
            {header}
            {state.status === "ready" && submittedQuery ? (
              <View style={styles.resultRow}>
                {submittedQuery ? (
                  <Button
                    variant="text"
                    label={d.catalogue.clear}
                    onPress={() => {
                      setQuery("");
                      setSubmittedQuery("");
                    }}
                  />
                ) : null}
              </View>
            ) : null}
          </>
        }
        renderItem={({ item }) => {
          const price = sellerItemPrice(item),
            date = sellerItemDate(item);
          const displayedPrice =
            price === null
              ? t.unavailablePrice
              : formatPrice(price, state.currency, locale);
          return (
            <ItemCard
              compact
              label={`${item.title ?? t.untitled}, ${displayedPrice}, ${t.statuses[sellerItemStatus(item)]}`}
              onPress={() =>
                router.push({
                  pathname: "/my-items/[tenant]/[item]",
                  params: { tenant, item: item.id },
                })
              }
            >
              <View style={styles.itemTop}>
                <Text style={[styles.itemTitle, styles.itemName]}>
                  {item.title ?? t.untitled}
                </Text>
                <Text style={styles.price}>{displayedPrice}</Text>
              </View>
              <Text style={styles.reference}>
                {item.reference}
                {item.category ? ` · ${item.category}` : ""}
              </Text>
              <View style={styles.itemMeta}>
                <StatusBadge
                  tone={item.stage === "sold" ? "positive" : "neutral"}
                  attention={
                    item.stage === "period_ending" ||
                    item.stage === "period_ended"
                  }
                >
                  {t.statuses[sellerItemStatus(item)]}
                </StatusBadge>
                <Text style={styles.date}>
                  {t[date.label]}:{" "}
                  {date.value
                    ? formatItemDate(date.value, locale)
                    : t.missingDate}
                </Text>
              </View>
            </ItemCard>
          );
        }}
        ListEmptyComponent={
          state.status === "loading" ? (
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
            <Message>{submittedQuery ? t.noMatches : t.empty}</Message>
          )
        }
        ListFooterComponent={
          state.status === "ready" ? (
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
              {state.failure ? (
                <Button
                  label={state.failure ? t.retryRefresh : t.refresh}
                  variant="text"
                  disabled={state.more}
                  busy={state.refreshing}
                  onPress={() => void pager.revalidate()}
                />
              ) : null}
            </View>
          ) : undefined
        }
      />
      <DetailSheet
        title={t.filter}
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
      >
        {itemFilters.map((value) => (
          <FilterChip
            key={value}
            label={t.filters[value]}
            selected={filter === value}
            onPress={() => {
              setFilter(value);
              setFiltersOpen(false);
            }}
          />
        ))}
      </DetailSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { gap: 12, marginBottom: 8 },
  searchRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "flex-end",
  },
  search: { flexGrow: 1, flexBasis: 180, minWidth: 0 },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemTop: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "baseline",
  },
  itemName: { flexGrow: 1, flexBasis: 140 },
  itemMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
    marginTop: 4,
  },
  message: { ...uiStyles.content },
  list: { ...uiStyles.content, gap: 12 },
  resultRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  itemTitle: uiStyles.itemName,
  reference: { ...uiStyles.note },
  price: uiStyles.itemPrice,
  date: { ...uiStyles.note },
  footer: { paddingVertical: 16, gap: 12 },
});
