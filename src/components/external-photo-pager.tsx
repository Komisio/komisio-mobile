import { useEffect, useRef, useState, type ComponentRef } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Image } from "expo-image";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { readExternalOfferItem } from "@/lib/external-offer-runtime";
import { externalLifecycleCopy } from "@/lib/external-lifecycle-copy";
import { externalItemDetailCopy } from "@/lib/external-item-detail-copy";
import { Button, Loading, Message, colors, uiStyles } from "./ui";

type Props = {
  owner: string;
  photos: string[];
  label: string;
  offerId?: string;
  style?: StyleProp<ViewStyle>;
};

export function ExternalPhotoPager(props: Props) {
  const { session } = useSession();
  if (session?.user.id !== props.owner) return null;
  return (
    <PrivatePhotos
      key={`${props.owner}:${props.offerId ?? ""}:${props.photos.join()}`}
      {...props}
    />
  );
}

function PrivatePhotos({ owner, photos, label, offerId, style }: Props) {
  const { locale, d } = useI18n();
  const t = externalLifecycleCopy(locale),
    detail = externalItemDetailCopy(locale);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0),
    pager = useRef<ComponentRef<typeof ScrollView>>(null);
  const [width, setWidth] = useState(0);
  const [urls, setUrls] = useState<string[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [failedPhotos, setFailedPhotos] = useState<Set<number>>(
    () => new Set(),
  );
  const [retry, setRetry] = useState(0);
  const photoKey = JSON.stringify(photos);

  useEffect(() => {
    let current = true;
    async function load() {
      // Handover summaries contain a thumbnail; resolve all immutable originals.
      const ids: string[] = offerId
        ? (await readExternalOfferItem(owner, offerId)).item.photos
        : JSON.parse(photoKey);
      const auth = await supabase.auth.getSession();
      if (
        auth.error ||
        auth.data.session?.user.id !== owner ||
        !ids.length ||
        ids.length > 8
      )
        throw new Error("PHOTO_UNAVAILABLE");
      const { data, error } = await supabase.storage
        .from("external-item-photos")
        .createSignedUrls(
          ids.map((id) => `${owner}/${id}.jpg`),
          60,
        );
      if (
        error ||
        !data ||
        data.length !== ids.length ||
        data.some((p) => p.error || !p.signedUrl)
      )
        throw new Error("PHOTO_UNAVAILABLE");
      const result = data.map((p) => {
        if (!p.signedUrl) throw new Error("PHOTO_UNAVAILABLE");
        return p.signedUrl;
      });
      const latest = await supabase.auth.getSession();
      if (latest.error || latest.data.session?.user.id !== owner)
        throw new Error("PHOTO_UNAVAILABLE");
      if (current) {
        indexRef.current = Math.min(indexRef.current, result.length - 1);
        setIndex(indexRef.current);
        setUrls(result);
      }
    }
    void load().catch(() => {
      if (current) setFailed(true);
    });
    return () => {
      current = false;
    };
  }, [owner, photoKey, offerId, retry]);

  function restorePosition() {
    pager.current?.scrollTo({ x: indexRef.current * width, animated: false });
  }
  useEffect(() => {
    pager.current?.scrollTo({ x: indexRef.current * width, animated: false });
  }, [width]);
  function goTo(next: number) {
    if (!urls || !width) return;
    indexRef.current = Math.max(0, Math.min(urls.length - 1, next));
    setIndex(indexRef.current);
    // Accessibility/keyboard adjustments are immediate; touch uses native paging.
    restorePosition();
  }
  function reload() {
    setUrls(null);
    setFailed(false);
    setFailedPhotos(new Set());
    setRetry((n) => n + 1);
  }
  const counter = urls
    ? t.photoCount
        .replace("{index}", String(index + 1))
        .replace("{count}", String(urls.length))
    : "";
  const errorContent = (
    <View style={styles.message}>
      <Message tone="error">{detail.photoError}</Message>
      <Button label={d.retry} onPress={reload} />
    </View>
  );
  return (
    <View style={[styles.root, style]}>
      <View
        style={styles.viewport}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        accessible={Boolean(urls) && !failedPhotos.has(index)}
        tabIndex={Platform.OS === "web" && urls ? 0 : undefined}
        {...(Platform.OS === "web" && urls && urls.length > 1
          ? {
              "aria-valuemin": 1,
              "aria-valuemax": urls.length,
              "aria-valuenow": index + 1,
              "aria-valuetext": counter,
            }
          : {})}
        accessibilityRole={urls && urls.length > 1 ? "adjustable" : "image"}
        accessibilityLabel={`${label}. ${counter}`}
        accessibilityHint={
          urls && urls.length > 1 ? detail.swipePhotos : undefined
        }
        accessibilityValue={
          urls
            ? { min: 1, max: urls.length, now: index + 1, text: counter }
            : undefined
        }
        accessibilityActions={
          urls && urls.length > 1
            ? [
                ...(index > 0
                  ? [{ name: "decrement", label: t.previous }]
                  : []),
                ...(index < urls.length - 1
                  ? [{ name: "increment", label: t.next }]
                  : []),
              ]
            : undefined
        }
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === "increment") goTo(index + 1);
          if (e.nativeEvent.actionName === "decrement") goTo(index - 1);
        }}
        onKeyDown={
          Platform.OS === "web"
            ? (e) => {
                if (
                  e.nativeEvent.key === "ArrowRight" ||
                  e.nativeEvent.key === "ArrowLeft"
                ) {
                  e.preventDefault();
                  goTo(index + (e.nativeEvent.key === "ArrowRight" ? 1 : -1));
                }
              }
            : undefined
        }
      >
        {failed ? (
          errorContent
        ) : urls && width > 0 ? (
          <ScrollView
            ref={pager}
            horizontal
            pagingEnabled
            directionalLockEnabled
            bounces={false}
            overScrollMode="never"
            scrollEnabled={urls.length > 1}
            showsHorizontalScrollIndicator={false}
            contentInsetAdjustmentBehavior="never"
            scrollEventThrottle={32}
            style={styles.scroll}
            contentContainerStyle={styles.pages}
            onContentSizeChange={restorePosition}
            onScroll={(e) => {
              if (Math.abs(e.nativeEvent.layoutMeasurement.width - width) > 1)
                return;
              indexRef.current = Math.max(
                0,
                Math.min(
                  urls.length - 1,
                  Math.round(e.nativeEvent.contentOffset.x / width),
                ),
              );
              setIndex(indexRef.current);
            }}
          >
            {urls.map((url, n) => (
              <View
                key={url}
                style={{ width, height: "100%" }}
                accessibilityElementsHidden={n !== index}
                importantForAccessibility={
                  n === index ? "auto" : "no-hide-descendants"
                }
              >
                {failedPhotos.has(n) ? (
                  errorContent
                ) : (
                  <Image
                    source={{ uri: url }}
                    cachePolicy="none"
                    contentFit="contain"
                    accessible={false}
                    style={styles.image}
                    onError={() =>
                      setFailedPhotos((prior) => new Set([...prior, n]))
                    }
                  />
                )}
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.message}>
            <Loading />
          </View>
        )}
      </View>
      {urls ? (
        <View style={styles.caption}>
          {urls.length > 1 ? (
            <View
              style={styles.dots}
              accessible={false}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              {urls.map((_, n) => (
                <View
                  key={n}
                  style={[styles.dot, n === index && styles.selectedDot]}
                />
              ))}
            </View>
          ) : null}
          <Text style={uiStyles.note}>{counter}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 10 },
  viewport: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 16,
    backgroundColor: colors.softAccent,
  },
  scroll: { flex: 1 },
  pages: { height: "100%" },
  image: { width: "100%", height: "100%" },
  message: { flex: 1, padding: 16, justifyContent: "center", gap: 12 },
  caption: { alignItems: "center", gap: 6 },
  dots: { flexDirection: "row", gap: 6 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.control,
  },
  selectedDot: { width: 18, backgroundColor: colors.brand },
});
