import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text } from "react-native";
import { Image } from "expo-image";
import { useFonts } from "expo-font";

export function GoogleAccountButton({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const [focused, setFocused] = useState(false);
  const [fontReady] = useFonts({
    GoogleSansMedium: require("../../assets/auth/GoogleSans-Medium.ttf"),
  });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => [
        styles.button,
        focused && styles.focused,
        (disabled || pressed) && styles.dimmed,
      ]}
    >
      <Image
        source={require("../../assets/auth/google-g.png")}
        style={styles.logo}
        accessible={false}
      />
      <Text style={[styles.label, fontReady && styles.font]}>{label}</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  button: {
    backgroundColor: "#ffffff",
    borderColor: "#747775",
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 50,
    paddingHorizontal: Platform.OS === "ios" ? 16 : 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: Platform.OS === "ios" ? 12 : 10,
  },
  logo: { width: 20, height: 20 },
  label: {
    color: "#1f1f1f",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    textAlign: "center",
    flex: 1,
  },
  font: { fontFamily: "GoogleSansMedium" },
  focused: { borderColor: "#143e34", borderWidth: 2 },
  dimmed: { opacity: 0.5 },
});
