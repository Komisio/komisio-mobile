import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useI18n } from "@/lib/i18n";
import { externalOfferCopy } from "@/lib/external-offer-copy";
import type { ExternalOfferDetail } from "@/lib/external-offer";
import { Button, colors, uiStyles } from "./ui";

export function OfferAgreementLink({
  agreement,
}: {
  agreement: ExternalOfferDetail["agreement"];
}) {
  const { locale, d } = useI18n();
  const [visible, setVisible] = useState(false);
  const close = () => setVisible(false);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={() => setVisible(true)}
        style={({ pressed }) => ({
          minHeight: 48,
          alignSelf: "flex-start",
          justifyContent: "center",
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <Text
          style={[
            uiStyles.note,
            { color: colors.brand, textDecorationLine: "underline" },
          ]}
        >
          {externalOfferCopy(locale).terms}
        </Text>
      </Pressable>
      <Modal
        visible={visible}
        presentationStyle="formSheet"
        animationType="slide"
        allowSwipeDismissal
        onRequestClose={close}
      >
        <SafeAreaProvider>
          <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={{ alignItems: "flex-end", paddingHorizontal: 12 }}>
              <Button label={d.close} variant="text" onPress={close} />
            </View>
            <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
              <Text accessibilityRole="header" style={uiStyles.heading}>
                {agreement.title}
              </Text>
              <Text style={uiStyles.note}>
                {d.agreement.version.replace(
                  "{version}",
                  String(agreement.version),
                )}
              </Text>
              <Text selectable style={uiStyles.body}>
                {agreement.body}
              </Text>
            </ScrollView>
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </>
  );
}
