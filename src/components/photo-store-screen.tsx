import { useCallback, useEffect, useRef, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { Text, View } from "react-native";
import {
  Button,
  Choice,
  Field,
  Loading,
  Message,
  Screen,
  uiStyles,
} from "./ui";
import { DetailSheet } from "./detail-sheet";
import { useI18n } from "@/lib/i18n";
import { itemDraftCopy } from "@/lib/item-draft-copy";
import { photoDraftCopy } from "@/lib/photo-draft-copy";
import { useItemDraft } from "@/lib/use-item-draft";
import { photoDraftRepository } from "@/lib/photo-draft-storage";
import {
  EXTERNAL_STORE_PAGE_SIZE,
  readExternalStores,
  type ExternalStore,
  type ExternalStorePage,
} from "@/lib/external-stores";
import { supabase, supabaseConfigured } from "@/lib/supabase";

export function PhotoStoreScreen() {
  const { locale, d } = useI18n();
  const t = itemDraftCopy(locale);
  const photo = photoDraftCopy(locale);
  const { snapshot, setSnapshot, failed, reload } = useItemDraft();
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    page: ExternalStorePage | null;
    error: string | null;
  } | null>(null);
  const requestKey = JSON.stringify([query, offset, attempt]);
  const page =
    result?.key === requestKey && input === query ? result.page : null;
  const readError = !supabaseConfigured
    ? "EXTERNAL_STORES_FAILED"
    : result?.key === requestKey && input === query
      ? result.error
      : null;
  const [saveError, setSaveError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectionNumber, setSelectionNumber] = useState(0);
  const navigatedSelection = useRef(0);
  const locked = useRef(false);
  const alive = useRef(true);
  const focusVersion = useRef(0);
  const [currencyChoice, setCurrencyChoice] = useState<ExternalStore | null>(
    null,
  );
  useEffect(() => {
    if (selectionNumber === navigatedSelection.current) return;
    // Commit the sheet's removal before freezing this route during navigation.
    navigatedSelection.current = selectionNumber;
    if (alive.current) router.navigate("/photo-details");
  }, [selectionNumber]);
  useFocusEffect(
    useCallback(() => {
      alive.current = true;
      return () => {
        alive.current = false;
        focusVersion.current += 1;
      };
    }, []),
  );
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(input);
      setOffset(0);
    }, 250);
    return () => clearTimeout(timer);
  }, [input]);
  useEffect(() => {
    let current = true;
    if (!supabaseConfigured) return;
    void readExternalStores(supabase, query, offset)
      .then((value) => {
        if (current) setResult({ key: requestKey, page: value, error: null });
      })
      .catch((error) => {
        if (current)
          setResult({
            key: requestKey,
            page: null,
            error:
              error instanceof Error ? error.message : "EXTERNAL_STORES_FAILED",
          });
      });
    return () => {
      current = false;
    };
  }, [query, offset, requestKey]);
  async function choose(store: ExternalStore, clearPrice = false) {
    if (!snapshot || locked.current) return;
    locked.current = true;
    const startedOnFocus = focusVersion.current;
    setBusy(true);
    setSaveError(null);
    let refreshed = store;
    try {
      // Refresh this exact opt-in instead of trusting a previous search page.
      const latest = (await readExternalStores(supabase, "", 0, store.id))
        .stores[0];
      if (!alive.current || startedOnFocus !== focusVersion.current) return;
      if (!latest) throw new Error("STORE_NOT_RECEIVING");
      refreshed = latest;
      // A second policy change must not silently confirm a different currency.
      if (clearPrice && latest.currency !== store.currency)
        throw new Error("PRICE_CURRENCY_CHANGED");
      const saved = await (
        await photoDraftRepository()
      ).selectStore(latest, snapshot.draft, clearPrice);
      if (alive.current && startedOnFocus === focusVersion.current) {
        setSnapshot(saved);
        setCurrencyChoice(null);
        setSelectionNumber((n) => n + 1);
      }
    } catch (error) {
      if (alive.current && startedOnFocus === focusVersion.current) {
        const code =
          error instanceof Error ? error.message : "DRAFT_UNAVAILABLE";
        if (code === "PRICE_CURRENCY_CHANGED") setCurrencyChoice(refreshed);
        else {
          setCurrencyChoice(null);
          setSaveError(code);
        }
      }
    } finally {
      locked.current = false;
      if (alive.current) setBusy(false);
    }
  }
  const reset = () => {
    setSaveError(null);
    reload();
    setAttempt((n) => n + 1);
  };
  if (failed)
    return (
      <Screen topSafeArea={false}>
        <Message tone="error">{photo.error}</Message>
        <Button label={d.retry} onPress={reload} />
      </Screen>
    );
  if (!snapshot)
    return (
      <Screen topSafeArea={false}>
        <Loading />
      </Screen>
    );
  if (!snapshot.photos.length)
    return (
      <Screen topSafeArea={false}>
        <Message>{t.noPhotos}</Message>
        <Button
          label={photo.title}
          onPress={() => router.navigate("/photo-draft")}
        />
      </Screen>
    );
  return (
    <Screen topSafeArea={false} keyboardInsets>
      <Text style={uiStyles.body}>{t.storeIntro}</Text>
      <Field
        label={d.store.search}
        value={input}
        maxLength={100}
        onChangeText={(value) => {
          setInput(value);
        }}
        editable={!busy}
        returnKeyType="search"
        autoCorrect={false}
      />
      {readError ? (
        <>
          <Message tone="error">
            {readError === "EXTERNAL_INTAKE_UNAVAILABLE"
              ? t.unavailable
              : d.store.failed}
          </Message>
          <Button
            label={d.retry}
            variant="secondary"
            onPress={() => setAttempt((n) => n + 1)}
          />
        </>
      ) : !page ? (
        <Loading />
      ) : (
        <>
          {!page.stores.length ? <Message>{t.storeEmpty}</Message> : null}
          <View style={{ gap: 8 }}>
            {page.stores.map((store) => (
              <Choice
                key={store.id}
                listRow
                label={`${store.name}${store.city ? ` · ${store.city}` : ""}`}
                selected={snapshot.draft.store?.id === store.id}
                disabled={busy}
                onPress={() => void choose(store)}
              />
            ))}
          </View>
          {offset > 0 ? (
            <Button
              label={t.previous}
              variant="text"
              disabled={busy}
              onPress={() =>
                setOffset((n) => Math.max(0, n - EXTERNAL_STORE_PAGE_SIZE))
              }
            />
          ) : null}
          {page.hasMore && offset < 10000 ? (
            <Button
              label={t.more}
              variant="secondary"
              disabled={busy}
              onPress={() => setOffset((n) => n + EXTERNAL_STORE_PAGE_SIZE)}
            />
          ) : null}
        </>
      )}
      {saveError ? (
        <>
          <Message tone="error">
            {saveError === "DRAFT_CHANGED"
              ? t.changed
              : saveError === "STORE_NOT_RECEIVING"
                ? t.notReceiving
                : photo.error}
          </Message>
          <Button label={d.retry} variant="secondary" onPress={reset} />
        </>
      ) : null}
      {busy ? <Loading /> : null}
      {currencyChoice ? (
        <DetailSheet
          title={t.currencyTitle}
          open={Boolean(currencyChoice)}
          onClose={() => {
            if (!busy) setCurrencyChoice(null);
          }}
        >
          <Text style={uiStyles.body}>
            {t.currencyMessage.replace(
              "{currency}",
              currencyChoice?.currency ?? "",
            )}
          </Text>
          <Button
            label={t.confirmCurrency}
            busy={busy}
            onPress={() => {
              if (currencyChoice) void choose(currencyChoice, true);
            }}
          />
        </DetailSheet>
      ) : null}
    </Screen>
  );
}
