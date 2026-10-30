import { BottomSheet, RNHostView } from "@expo/ui";
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
  const { d } = useI18n();
  return (
    <BottomSheet
      isPresented={open}
      onDismiss={onClose}
      containerColor={colors.background}
    >
      {/* Fill the native sheet's width; only height follows Yoga content.
          An unbridged RN ScrollView can collapse to intrinsic width on iOS. */}
      <RNHostView matchContents={{ vertical: true }}>
        <View style={[styles.layout, { maxHeight: height * 0.7 }]}>
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
            <Button label={d.close} variant="text" onPress={onClose} />
          </View>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </View>
      </RNHostView>
    </BottomSheet>
  );
}
const styles = StyleSheet.create({
  layout: { width: "100%", gap: 12 },
  scroll: { flexGrow: 0, flexShrink: 1, width: "100%" },
  content: { gap: 12, paddingBottom: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 0 },
  title: { ...uiStyles.heading, flex: 1, minWidth: 0 },
});
