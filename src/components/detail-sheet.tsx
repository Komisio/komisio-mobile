import { BottomSheet } from "@expo/ui";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import type { ReactNode } from "react";
import { Button, colors, uiStyles } from "./ui";
import { useI18n } from "@/lib/i18n";

/** SDK 58's universal sheet provides its own native Host and safe-area chrome. */
export function DetailSheet({
  title,
  open,
  onClose,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const { height } = useWindowDimensions();
  const { locale } = useI18n();
  return (
    <BottomSheet
      isPresented={open}
      onDismiss={onClose}
      containerColor={colors.background}
    >
      <ScrollView
        style={{ maxHeight: height * 0.7 }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
          <Button
            label={locale === "sv" ? "Stäng" : "Close"}
            variant="text"
            onPress={onClose}
          />
        </View>
        {children}
      </ScrollView>
    </BottomSheet>
  );
}
const styles = StyleSheet.create({
  content: { gap: 12, paddingBottom: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { ...uiStyles.heading, flex: 1 },
});
