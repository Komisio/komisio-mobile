import { useEffect, useRef, useState } from "react";
import { Linking, Text, View } from "react-native";
import { Image } from "expo-image";
import { Button, Card, Loading, Message, Screen, colors, uiStyles } from "./ui";
import { DetailSheet } from "./detail-sheet";
import { useI18n } from "@/lib/i18n";
import { photoDraftCopy } from "@/lib/photo-draft-copy";
import { MAX_DRAFT_PHOTOS, type DraftPhoto } from "@/lib/photo-draft";
import { photoDraftRepository } from "@/lib/photo-draft-storage";
import { pickDraftPhotos } from "@/lib/photo-draft-picker";
import { readDraftPhotos, clearDraftPhotos } from "@/lib/photo-draft-runtime";

export function PhotoDraftScreen() {
  const { locale, d } = useI18n();
  const t = photoDraftCopy(locale);
  const [photos, setPhotos] = useState<DraftPhoto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const locked = useRef(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    let current = true;
    void readDraftPhotos()
      .then((saved) => {
        if (current) setPhotos(saved);
      })
      .catch((e: unknown) => {
        if (current)
          setError(e instanceof Error ? e.message : "DRAFT_UNAVAILABLE");
      });
    return () => {
      current = false;
      alive.current = false;
    };
  }, [attempt]);

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
                  <Image
                    source={{ uri: photo.uri }}
                    contentFit="contain"
                    cachePolicy="none"
                    accessibilityLabel={t.count.replace(
                      "{count}",
                      String(index + 1),
                    )}
                    style={{
                      width: "100%",
                      aspectRatio: 1,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: colors.line,
                      backgroundColor: "white",
                    }}
                    onError={() => setError("PHOTO_INVALID")}
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
                setAttempt((n) => n + 1);
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
              if (saved && alive.current) setConfirmClear(false);
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
