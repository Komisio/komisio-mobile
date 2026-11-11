import { useCallback, useEffect, useRef, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { Text } from "react-native";
import { Button, Card, Loading, Message, Screen, uiStyles } from "./ui";
import { useI18n } from "@/lib/i18n";
import { centralIntakeCopy } from "@/lib/central-intake-copy";
import { photoDraftCopy } from "@/lib/photo-draft-copy";
import { useItemDraft } from "@/lib/use-item-draft";
import { photoDraftRepository } from "@/lib/photo-draft-storage";
import {
  readCentralRecipient,
  type ExternalStore,
} from "@/lib/external-stores";
import { supabase } from "@/lib/supabase";

/** Compatibility route: resolve the central recipient without a store picker. */
export function PhotoStoreScreen() {
  const { locale, d } = useI18n();
  const t = centralIntakeCopy(locale),
    photo = photoDraftCopy(locale);
  const { snapshot, failed, reload } = useItemDraft();
  const [recipient, setRecipient] = useState<ExternalStore | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const generation = useRef(0);
  const alive = useRef(false),
    locked = useRef(false),
    started = useRef(false);
  useFocusEffect(
    useCallback(() => {
      void revision;
      alive.current = true;
      generation.current++;
      let current = true;
      started.current = false;
      setLoaded(false);
      setRecipient(null);
      setError("");
      void readCentralRecipient(supabase)
        .then((store) => {
          if (current) {
            setRecipient(store);
            setLoaded(true);
          }
        })
        .catch(() => {
          if (current) {
            setRecipient(null);
            setLoaded(true);
            setError(t.unavailable);
          }
        });
      return () => {
        current = false;
        alive.current = false;
        generation.current++;
      };
    }, [revision, t.unavailable]),
  );
  const changed = Boolean(
    snapshot?.draft.store &&
    recipient &&
    (snapshot.draft.store.id !== recipient.id ||
      snapshot.draft.store.currency !== recipient.currency),
  );
  const choose = useCallback(async () => {
    if (!snapshot || !recipient || locked.current) return;
    locked.current = true;
    const startedAt = generation.current;
    const isCurrent = () => alive.current && generation.current === startedAt;
    setBusy(true);
    setError("");
    try {
      const current = await readCentralRecipient(supabase);
      if (!current || current.id !== recipient.id)
        throw new Error("STORE_CHANGED");
      if (!isCurrent()) return;
      const repository = await photoDraftRepository();
      if (!isCurrent()) return;
      await repository.selectStore(current, snapshot.draft, changed);
      if (isCurrent()) router.replace("/photo-details");
    } catch {
      if (isCurrent()) setError(t.unavailable);
    } finally {
      locked.current = false;
      if (alive.current) setBusy(false);
    }
  }, [snapshot, recipient, changed, t.unavailable]);
  useEffect(() => {
    if (
      !loaded ||
      !snapshot?.photos.length ||
      !recipient ||
      changed ||
      busy ||
      locked.current ||
      started.current
    )
      return;
    started.current = true;
    void choose();
  }, [loaded, snapshot, recipient, changed, busy, choose]);
  function retry() {
    reload();
    setRevision((v) => v + 1);
  }
  if (failed)
    return (
      <Screen topSafeArea={false}>
        <Message tone="error">{photo.error}</Message>
        <Button label={d.retry} onPress={retry} />
      </Screen>
    );
  if (!snapshot || !loaded)
    return (
      <Screen topSafeArea={false}>
        <Loading />
      </Screen>
    );
  if (!snapshot.photos.length)
    return (
      <Screen topSafeArea={false}>
        <Button
          label={photo.title}
          onPress={() => router.navigate("/photo-draft")}
        />
      </Screen>
    );
  return (
    <Screen topSafeArea={false}>
      <Card>
        <Text style={uiStyles.heading}>Komisio</Text>
        <Text style={uiStyles.body}>{t.intro}</Text>
      </Card>
      {changed ? <Message>{t.changed}</Message> : null}
      {changed &&
      snapshot.draft.store?.currency !== "SEK" &&
      snapshot.draft.details.desiredSellerAmount.trim() ? (
        <Message>{t.clearPrice}</Message>
      ) : null}
      {error || !recipient ? (
        <>
          <Message tone="error">{error || t.unavailable}</Message>
          <Button
            label={d.retry}
            variant="secondary"
            onPress={retry}
            disabled={busy}
          />
        </>
      ) : changed ? (
        <Button
          label={t.switchRecipient}
          onPress={() => void choose()}
          busy={busy}
        />
      ) : (
        <Loading />
      )}
    </Screen>
  );
}
