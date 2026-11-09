import { useCallback, useRef, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { Linking, Text, View } from "react-native";
import { PhotoDraftImage } from "./photo-draft-image";
import { Button, Card, Loading, Message, Screen, colors, uiStyles } from "./ui";
import { DetailSheet } from "./detail-sheet";
import { useI18n } from "@/lib/i18n";
import { photoDraftCopy } from "@/lib/photo-draft-copy";
import { itemDraftCopy } from "@/lib/item-draft-copy";
import { MAX_DRAFT_PHOTOS, type DraftPhoto } from "@/lib/photo-draft";
import { photoDraftRepository } from "@/lib/photo-draft-storage";
import { pickDraftPhotos } from "@/lib/photo-draft-picker";
import { readDraftPhotos, clearDraftPhotos } from "@/lib/photo-draft-runtime";

export function PhotoDraftScreen() {
  const { locale, d } = useI18n();
  const t = photoDraftCopy(locale);
  const [photos, setPhotos] = useState<DraftPhoto[] | null>(null);
  const [hasRecipient, setHasRecipient] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const locked = useRef(false);
  const alive = useRef(true);
  const readVersion = useRef(0);
  const load = useCallback(() => {
    const started = ++readVersion.current;
    void readDraftPhotos()
      .then(async () => (await photoDraftRepository()).snapshot())
      .then((saved) => {
        if (started === readVersion.current) {
          setPhotos(saved.photos);
          setHasRecipient(Boolean(saved.draft.store));
        }
      })
      .catch((e: unknown) => {
        if (started === readVersion.current)
          setError(e instanceof Error ? e.message : "DRAFT_UNAVAILABLE");
      });
  }, [setPhotos, setHasRecipient, setError]);
  useFocusEffect(
    useCallback(() => {
      alive.current = true;
      load();
      return () => {
        readVersion.current += 1;
        alive.current = false;
      };
    }, [load]),
  );

  async function update(action: () => Promise<DraftPhoto[]>) {
    if (locked.current) return false;
    locked.current = true;
    setBusy(true);
    setError(null);
    try {
      const saved = await action();
      if (alive.current) setPhotos(saved);
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
  function pick(camera: boolean) {
    if (!photos) return;
    void update(() =>
      pickDraftPhotos(camera, MAX_DRAFT_PHOTOS - photos.length).then(
        async (inputs) => (await photoDraftRepository()).add(inputs),
      ),
    );
  }
  const count = photos?.length ?? 0;
  const errorText =
    error === "PHOTO_LIMIT"
      ? t.limit
      : error === "PHOTO_INVALID"
        ? t.invalid
        : error === "CAMERA_DENIED" || error === "CAMERA_SETTINGS"
          ? t.denied
          : t.error;
  return (
    <Screen topSafeArea={false}>
      <Text style={uiStyles.body}>{t.intro}</Text>
      {photos === null && !error ? <Loading /> : null}
      {photos !== null ? (
        <>
          <View
            style={{
              alignSelf: "flex-start",
              backgroundColor: colors.accent,
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 8,
            }}
          >
            <Text
              selectable
              style={[uiStyles.rowTitle, { fontVariant: ["tabular-nums"] }]}
            >
              {t.count.replace("{count}", String(count))}
            </Text>
          </View>
          {count === 0 ? (
            <Card>
              <Text style={uiStyles.heading}>{t.empty}</Text>
              <Text style={uiStyles.body}>{t.tips}</Text>
            </Card>
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
              {photos.map((photo, index) => (
                <View key={photo.id} style={{ width: "47%", gap: 4 }}>
                  <PhotoDraftImage
                    uri={photo.uri}
                    label={t.photo.replace("{count}", String(index + 1))}
                    errorText={t.previewError}
                    retryLabel={d.retry}
                  />
                  <Button
                    label={t.remove.replace("{count}", String(index + 1))}
                    variant="text"
                    disabled={busy}
                    onPress={() => {
                      void update(async () =>
                        (await photoDraftRepository()).remove(photo.id),
                      );
                    }}
                  />
                </View>
              ))}
            </View>
          )}
          <Button
            label={t.camera}
            disabled={busy || count >= MAX_DRAFT_PHOTOS}
            onPress={() => pick(true)}
          />
          <Button
            label={t.library}
            variant="secondary"
            disabled={busy || count >= MAX_DRAFT_PHOTOS}
            onPress={() => pick(false)}
          />
          {count === MAX_DRAFT_PHOTOS ? <Message>{t.limit}</Message> : null}
          {count > 0 ? (
            <Button
              label={
                hasRecipient
                  ? itemDraftCopy(locale).detailsTitle
                  : itemDraftCopy(locale).storeTitle
              }
              disabled={busy}
              onPress={() =>
                router.navigate(
                  hasRecipient ? "/photo-details" : "/photo-store",
                )
              }
            />
          ) : null}
          {busy ? (
            <Message>{t.working}</Message>
          ) : count > 0 && !error ? (
            <Message>{t.saved}</Message>
          ) : null}
        </>
      ) : null}
      {error ? (
        <>
          <Message tone="error">{errorText}</Message>
          {error === "CAMERA_SETTINGS" ? (
            <Button
              label={t.settings}
              variant="secondary"
              onPress={() => {
                void Linking.openSettings().catch(() =>
                  setError("CAMERA_DENIED"),
                );
              }}
            />
          ) : null}
          {photos === null ? (
            <Button
              label={d.retry}
              disabled={busy}
              onPress={() => {
                setError(null);
                load();
              }}
            />
          ) : null}
        </>
      ) : null}
      {count > 0 || error ? (
        <Button
          label={t.clear}
          variant="text"
          disabled={busy}
          onPress={() => setConfirmClear(true)}
        />
      ) : null}
      <DetailSheet
        title={t.clearTitle}
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
      >
        <Text style={uiStyles.body}>{t.clearBody}</Text>
        <Button
          label={t.clear}
          busy={busy}
          onPress={() => {
            void update(clearDraftPhotos).then((saved) => {
              if (saved && alive.current) {
                setConfirmClear(false);
                setHasRecipient(false);
              }
            });
          }}
        />
        <Button
          label={t.keep}
          variant="secondary"
          disabled={busy}
          onPress={() => setConfirmClear(false)}
        />
      </DetailSheet>
    </Screen>
  );
}
