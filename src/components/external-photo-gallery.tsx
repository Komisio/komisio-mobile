import { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { readExternalOfferItem } from "@/lib/external-offer-runtime";
import { externalLifecycleCopy } from "@/lib/external-lifecycle-copy";
import { photoDraftCopy } from "@/lib/photo-draft-copy";
import { ExternalItemPhoto } from "./external-item-photo";
import { Button, Loading, Message, colors, uiStyles } from "./ui";

export function ExternalPhotoGallery({
  owner,
  photos,
  label,
  offerId,
}: {
  owner: string;
  photos: string[];
  label: string;
  offerId?: string;
}) {
  const { locale } = useI18n();
  const { session } = useSession();
  const t = externalLifecycleCopy(locale);
  const [visible, setVisible] = useState(false);
  const close = () => setVisible(false);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t.viewPhotos}: ${label}`}
        onPress={() => setVisible(true)}
      >
        <ExternalItemPhoto owner={owner} photo={photos[0]} label={label} />
        <Text
          style={[uiStyles.note, { textAlign: "center", color: colors.brand }]}
        >
          {t.viewPhotos}
        </Text>
      </Pressable>
      <Modal
        visible={visible && session?.user.id === owner}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={close}
      >
        {visible && session?.user.id === owner ? (
          <GalleryContent
            key={`${owner}:${offerId ?? photos.join()}`}
            owner={owner}
            photos={photos}
            label={label}
            offerId={offerId}
            close={close}
          />
        ) : null}
      </Modal>
    </>
  );
}

function GalleryContent({
  owner,
  photos,
  label,
  offerId,
  close,
}: {
  owner: string;
  photos: string[];
  label: string;
  offerId?: string;
  close: () => void;
}) {
  const { locale, d } = useI18n();
  const t = externalLifecycleCopy(locale);
  const [index, setIndex] = useState(0);
  const [urls, setUrls] = useState<string[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const photoKey = JSON.stringify(photos);
  useEffect(() => {
    let current = true;
    async function load() {
      // Handover summaries carry one thumbnail. Resolve the immutable request
      // on opening so the viewer includes every original photo for that item.
      const ids: string[] = offerId
        ? (await readExternalOfferItem(owner, offerId)).item.photos
        : JSON.parse(photoKey);
      const { data: auth, error: authError } = await supabase.auth.getSession();
      if (
        authError ||
        auth.session?.user.id !== owner ||
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
      if (current) setUrls(result);
    }
    void load().catch(() => {
      if (current) setFailed(true);
    });
    return () => {
      current = false;
    };
  }, [owner, photoKey, offerId, retry]);
  const currentUrl = urls?.[index];
  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: colors.background,
          paddingHorizontal: 16,
          gap: 12,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <Text numberOfLines={2} style={[uiStyles.label, { flex: 1 }]}>
            {label}
          </Text>
          <Button label={t.close} variant="text" onPress={close} />
        </View>
        {failed ? (
          <View style={{ flex: 1, justifyContent: "center", gap: 12 }}>
            <Message tone="error">
              {photoDraftCopy(locale).previewError}
            </Message>
            <Button
              label={d.retry}
              onPress={() => {
                setUrls(null);
                setFailed(false);
                setRetry((n) => n + 1);
              }}
            />
          </View>
        ) : currentUrl ? (
          <Image
            key={currentUrl}
            source={{ uri: currentUrl }}
            cachePolicy="none"
            contentFit="contain"
            accessibilityLabel={`${label}. ${t.photoCount.replace("{index}", String(index + 1)).replace("{count}", String(urls!.length))}`}
            style={{ flex: 1, width: "100%" }}
            onError={() => setFailed(true)}
          />
        ) : (
          <View style={{ flex: 1, justifyContent: "center" }}>
            <Loading />
          </View>
        )}
        {urls ? (
          <>
            <Text style={[uiStyles.note, { textAlign: "center" }]}>
              {t.photoCount
                .replace("{index}", String(index + 1))
                .replace("{count}", String(urls.length))}
            </Text>
            {urls.length > 1 ? (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: 12,
                  paddingBottom: 12,
                }}
              >
                <Button
                  label={t.previous}
                  variant="secondary"
                  disabled={index === 0}
                  onPress={() => {
                    setFailed(false);
                    setIndex((n) => n - 1);
                  }}
                />
                <Button
                  label={t.next}
                  variant="secondary"
                  disabled={index === urls.length - 1}
                  onPress={() => {
                    setFailed(false);
                    setIndex((n) => n + 1);
                  }}
                />
              </View>
            ) : null}
          </>
        ) : null}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
