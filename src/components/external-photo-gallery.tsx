import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { externalLifecycleCopy } from "@/lib/external-lifecycle-copy";
import { ExternalItemPhoto } from "./external-item-photo";
import { ExternalPhotoPager } from "./external-photo-pager";
import { Button, colors, uiStyles } from "./ui";

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
  const { locale } = useI18n(),
    { session } = useSession();
  const t = externalLifecycleCopy(locale);
  const [visible, setVisible] = useState(false);
  const close = () => setVisible(false);
  const open = visible && session?.user.id === owner;
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
        visible={open}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={close}
      >
        {open ? (
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
              <ExternalPhotoPager
                owner={owner}
                photos={photos}
                label={label}
                offerId={offerId}
                style={{ flex: 1, marginBottom: 12 }}
              />
            </SafeAreaView>
          </SafeAreaProvider>
        ) : null}
      </Modal>
    </>
  );
}
