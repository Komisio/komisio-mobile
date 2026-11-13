import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  AppState,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { useI18n } from "@/lib/i18n";
import { photoDraftCopy } from "@/lib/photo-draft-copy";
import { photoCaptureCopy } from "@/lib/photo-capture-copy";
import { MAX_DRAFT_PHOTOS, type DraftPhoto } from "@/lib/photo-draft";
import { photoDraftRepository } from "@/lib/photo-draft-storage";
import { createPhotoCapture } from "@/lib/photo-capture";
import { capturedPhotoInput } from "@/lib/photo-capture-input";
import { Button, Loading, Message, colors, uiStyles } from "./ui";

export function PhotoCapture({
  photos,
  onSaved,
  onClose,
}: {
  photos: DraftPhoto[];
  onSaved: (photos: DraftPhoto[]) => void;
  onClose: () => void;
}) {
  return (
    <Modal
      visible
      presentationStyle="fullScreen"
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaProvider>
        <Capture photos={photos} onSaved={onSaved} onClose={onClose} />
      </SafeAreaProvider>
    </Modal>
  );
}
function Capture({
  photos,
  onSaved,
  onClose,
}: Parameters<typeof PhotoCapture>[0]) {
  const { locale, d } = useI18n(),
    t = photoDraftCopy(locale),
    copy = photoCaptureCopy(locale);
  const camera = useRef<CameraView | null>(null);
  const [permission, requestPermission, refreshPermission] =
    useCameraPermissions();
  const [active, setActive] = useState(AppState.currentState === "active");
  const [ready, setReady] = useState(false);
  const [mountError, setMountError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [capture] = useState(() =>
    createPhotoCapture({ repository: photoDraftRepository }, photos),
  );
  function take() {
    void capture.take(async () => {
      if (!camera.current) throw new Error("CAMERA_FAILED");
      const shot = await camera.current.takePictureAsync({
        quality: 0.85,
        exif: false,
        base64: false,
      });
      if (!shot?.uri) throw new Error("CAMERA_FAILED");
      return capturedPhotoInput(shot.uri);
    }, onSaved);
  }
  const state = useSyncExternalStore(
    capture.subscribe,
    capture.getState,
    capture.getState,
  );
  useEffect(() => {
    capture.open();
    return () => capture.close();
  }, [capture]);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => {
      setReady(false);
      setActive(next === "active");
      if (next === "active")
        void refreshPermission().catch(() => setMountError(true));
    });
    return () => subscription.remove();
  }, [refreshPermission]);
  // Explicit exit invalidates an outstanding capture before navigating away.
  function close() {
    capture.close();
    onClose();
  }
  const full = state.photos.length >= MAX_DRAFT_PHOTOS;
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={close}
          style={styles.headerButton}
        >
          <Text style={styles.control}>{d.close}</Text>
        </Pressable>
        <Text accessibilityLiveRegion="polite" style={styles.count}>
          {t.count.replace("{count}", String(state.photos.length))}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: state.busy }}
          disabled={state.busy}
          onPress={close}
          style={[styles.headerButton, state.busy && styles.disabled]}
        >
          <Text style={[styles.control, { color: colors.accent }]}>
            {copy.done}
          </Text>
        </Pressable>
      </View>
      <View style={styles.preview}>
        {permission?.granted && active && !mountError ? (
          <CameraView
            key={attempt}
            ref={camera}
            style={StyleSheet.absoluteFill}
            facing="back"
            mode="picture"
            autofocus="on"
            onCameraReady={() => setReady(true)}
            onMountError={() => {
              setReady(false);
              setMountError(true);
            }}
          />
        ) : null}
        {!permission ? (
          <Loading />
        ) : !permission.granted ? (
          <View style={styles.permission}>
            <Text style={styles.light}>{t.denied}</Text>
            <Button
              label={permission.canAskAgain ? copy.allow : t.settings}
              onPress={() => {
                void (
                  permission.canAskAgain
                    ? requestPermission()
                    : Linking.openSettings()
                ).catch(() => setMountError(true));
              }}
            />
          </View>
        ) : mountError ? (
          <View style={styles.permission}>
            <Text style={styles.light}>{copy.captureError}</Text>
            <Button
              label={d.retry}
              onPress={() => {
                setReady(false);
                setMountError(false);
                setAttempt((n) => n + 1);
              }}
            />
          </View>
        ) : !ready ? (
          <Text style={styles.light}>{copy.starting}</Text>
        ) : null}
      </View>
      <ScrollView style={styles.footer} contentContainerStyle={styles.controls}>
        {state.photos.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.strip}
          >
            {state.photos.map((photo, index) => (
              <Image
                key={photo.id}
                source={{ uri: photo.uri }}
                accessibilityLabel={t.photo.replace(
                  "{count}",
                  String(index + 1),
                )}
                style={styles.thumbnail}
                contentFit="cover"
              />
            ))}
          </ScrollView>
        ) : null}
        {state.error ? (
          <Message tone="error">
            {state.retrySave
              ? copy.saveError
              : state.error === "PHOTO_LIMIT"
                ? t.limit
                : copy.captureError}
          </Message>
        ) : null}
        {state.retrySave ? (
          <Button label={copy.retrySave} busy={state.busy} onPress={take} />
        ) : (
          <>
            <Text style={styles.hint}>{full ? t.limit : copy.hint}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.camera}
              accessibilityState={{
                disabled: !ready || !active || state.busy || full,
                busy: state.busy,
              }}
              disabled={!ready || !active || state.busy || full}
              onPress={take}
              style={({ pressed }) => [
                styles.shutter,
                (!ready || state.busy || full) && styles.disabled,
                pressed && { opacity: 0.7 },
              ]}
            >
              <View style={styles.shutterCenter} />
            </Pressable>
          </>
        )}
        {state.busy ? (
          <Text accessibilityLiveRegion="polite" style={styles.hint}>
            {t.working}
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.brand },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    gap: 4,
  },
  headerButton: {
    minWidth: 48,
    minHeight: 48,
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  control: { ...uiStyles.label, color: colors.onBrand },
  count: {
    ...uiStyles.note,
    color: colors.onBrand,
    flex: 1,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  preview: {
    flex: 1,
    minHeight: 100,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  permission: { gap: 16, padding: 16, width: "100%", maxWidth: 500 },
  light: { ...uiStyles.body, color: colors.onBrand, textAlign: "center" },
  footer: { flexGrow: 0, flexShrink: 1, maxHeight: "52%" },
  controls: { padding: 16, gap: 12 },
  strip: { gap: 8 },
  thumbnail: { width: 56, height: 64, borderRadius: 8 },
  hint: { ...uiStyles.note, color: colors.onBrand, textAlign: "center" },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: colors.onBrand,
    padding: 5,
    alignSelf: "center",
  },
  shutterCenter: { flex: 1, borderRadius: 32, backgroundColor: colors.onBrand },
  disabled: { opacity: 0.45 },
});
