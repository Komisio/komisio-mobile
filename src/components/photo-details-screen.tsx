import { useCallback, useEffect, useRef, useState } from "react";
import { Keyboard, Text, View } from "react-native";
import { router, usePreventRemove, type Href } from "expo-router";
import {
  Button,
  Card,
  Choice,
  Field,
  Loading,
  Message,
  Screen,
  uiStyles,
} from "./ui";
import { DetailSheet } from "./detail-sheet";
import { PhotoDraftImage } from "./photo-draft-image";
import { useI18n } from "@/lib/i18n";
import { itemDraftCopy } from "@/lib/item-draft-copy";
import { photoDraftCopy } from "@/lib/photo-draft-copy";
import {
  emptyItemDetails,
  itemConditions,
  itemDetailsErrors,
  type ItemDraftDetails,
} from "@/lib/item-draft-details";
import { useItemDraft } from "@/lib/use-item-draft";
import { photoDraftRepository } from "@/lib/photo-draft-storage";
import type { ItemDraftSnapshot } from "@/lib/photo-draft";

export function PhotoDetailsScreen() {
  const { locale, d } = useI18n();
  const t = itemDraftCopy(locale);
  const photo = photoDraftCopy(locale);
  const [values, setValues] = useState<ItemDraftDetails>(emptyItemDetails);
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const alive = useRef(true);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<ReturnType<typeof itemDetailsErrors>>(
    [],
  );
  const [pendingExit, setPendingExit] = useState<{ repeat: () => void } | null>(
    null,
  );
  const [leaving, setLeaving] = useState(false);
  const [exitAction, setExitAction] = useState<{ repeat: () => void } | null>(
    null,
  );
  const completedExit = useRef<typeof exitAction>(null);
  const initialize = useCallback((value: ItemDraftSnapshot) => {
    setValues(value.draft.details);
    setError(null);
    setIssues([]);
    setLeaving(false);
    setExitAction(null);
  }, []);
  const { snapshot, setSnapshot, failed, reload } = useItemDraft(initialize);
  useEffect(() => {
    if (!exitAction || completedExit.current === exitAction) return;
    // Remove the sheet before the route is hidden; otherwise it can retain focus.
    completedExit.current = exitAction;
    exitAction.repeat();
  }, [exitAction]);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const dirty = Boolean(
    snapshot &&
    JSON.stringify(values) !== JSON.stringify(snapshot.draft.details),
  );
  const disablePrevention = usePreventRemove(
    (dirty || busy) && !leaving,
    ({ repeat }) => {
      // The current save owns navigation until it succeeds or fails.
      if (!locked.current) setPendingExit({ repeat });
    },
  );
  function change<K extends keyof ItemDraftDetails>(
    field: K,
    value: ItemDraftDetails[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    setIssues([]);
    setError(null);
  }
  async function save(complete = false): Promise<boolean> {
    if (!snapshot || locked.current) return false;
    Keyboard.dismiss();
    const invalid = complete ? itemDetailsErrors(values) : [];
    setIssues(invalid);
    if (invalid.length) return false;
    locked.current = true;
    setBusy(true);
    setError(null);
    try {
      const saved = await (
        await photoDraftRepository()
      ).saveDetails(values, snapshot.draft);
      if (!alive.current) return false;
      setSnapshot(saved);
      return true;
    } catch (e) {
      if (alive.current)
        setError(e instanceof Error ? e.message : "DRAFT_UNAVAILABLE");
      return false;
    } finally {
      locked.current = false;
      if (alive.current) setBusy(false);
    }
  }
  async function open(path: Href, complete = false) {
    if (await save(complete)) {
      setLeaving(true);
      setPendingExit(null);
      setExitAction({
        repeat: () => {
          disablePrevention();
          router.navigate(path);
        },
      });
    }
  }
  function exit() {
    if (!pendingExit) return;
    setLeaving(true);
    setPendingExit(null);
    setExitAction(pendingExit);
  }
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
  if (!snapshot.draft.store)
    return (
      <Screen topSafeArea={false}>
        <Message>{t.storeIntro}</Message>
        <Button
          label={t.storeTitle}
          onPress={() => router.navigate("/photo-store")}
        />
      </Screen>
    );
  const currency = snapshot.draft.store.currency;
  const issueText = {
    description: t.requiredDescription,
    condition: t.requiredCondition,
    desiredPrice: t.invalidPrice,
  };
  return (
    <Screen topSafeArea={false} keyboardInsets>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ width: 76 }}>
          <PhotoDraftImage
            uri={snapshot.photos[0].uri}
            label={photo.photo.replace("{count}", "1")}
            errorText={photo.previewError}
            retryLabel={d.retry}
          />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={uiStyles.rowTitle}>{snapshot.draft.store.name}</Text>
        </View>
      </View>
      <Text style={uiStyles.body}>{t.detailsIntro}</Text>
      <Field
        label={t.description}
        value={values.description}
        maxLength={160}
        editable={!busy}
        onChangeText={(value) => change("description", value)}
        returnKeyType="next"
      />
      <Field
        label={t.brand}
        value={values.brand}
        maxLength={100}
        editable={!busy}
        onChangeText={(value) => change("brand", value)}
        autoCorrect={false}
        returnKeyType="next"
      />
      <View
        style={{ gap: 8 }}
        accessibilityRole="radiogroup"
        accessibilityLabel={t.condition}
      >
        <Text style={uiStyles.rowTitle}>{t.condition}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {itemConditions.map((condition) => (
            <Choice
              key={condition}
              role="radio"
              label={t.conditions[condition]}
              selected={values.condition === condition}
              disabled={busy}
              onPress={() => change("condition", condition)}
            />
          ))}
        </View>
      </View>
      <Field
        label={t.notes}
        value={values.notes}
        maxLength={1000}
        editable={!busy}
        onChangeText={(value) => change("notes", value)}
        multiline
        numberOfLines={3}
        style={[
          uiStyles.body,
          {
            minHeight: 88,
            borderWidth: 1,
            borderRadius: 12,
            padding: 12,
            textAlignVertical: "top",
          },
        ]}
      />
      <Card>
        <Field
          label={t.desiredPrice.replace("{currency}", currency)}
          value={values.desiredPrice}
          maxLength={32}
          editable={!busy}
          onChangeText={(value) => change("desiredPrice", value)}
          inputMode="decimal"
          keyboardType="decimal-pad"
        />
        <Text style={uiStyles.body}>{t.priceHint}</Text>
      </Card>
      {issues.length ? (
        <Message tone="error">
          {issues.map((key) => issueText[key]).join("\n")}
        </Message>
      ) : null}
      {error ? (
        <Message tone="error">
          {error === "DRAFT_CHANGED" ? t.changed : photo.error}
        </Message>
      ) : null}
      <Button
        label={t.review}
        busy={busy}
        onPress={() => void open("/photo-review", true)}
      />
      <Button
        label={t.save}
        variant="secondary"
        disabled={busy}
        onPress={() => void save()}
      />
      <Message>{dirty ? t.unsaved : photo.saved}</Message>
      {pendingExit ? (
        <DetailSheet
          title={t.leaveTitle}
          open={Boolean(pendingExit)}
          onClose={() => {
            if (!busy) setPendingExit(null);
          }}
        >
          <Text style={uiStyles.body}>{t.leaveMessage}</Text>
          {error ? (
            <Message tone="error">
              {error === "DRAFT_CHANGED" ? t.changed : photo.error}
            </Message>
          ) : null}
          <Button
            label={t.saveAndLeave}
            busy={busy}
            onPress={() => {
              void save().then((ok) => {
                if (ok) exit();
              });
            }}
          />
          <Button
            label={t.discard}
            variant="text"
            disabled={busy}
            onPress={exit}
          />
        </DetailSheet>
      ) : null}
    </Screen>
  );
}
