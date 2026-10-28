import { Pressable, StyleSheet, Text, View } from "react-native";
import { dictionaries, locales, useI18n } from "@/lib/i18n";
import { colors } from "./ui";

export function LanguagePicker() {
  const { d, locale, setLocale } = useI18n();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={d.language} style={styles.row}>
      {locales.map((l) => (
        <Pressable
          key={l}
          accessibilityRole="radio"
          accessibilityState={{ checked: l === locale }}
          onPress={() => setLocale(l)}
          style={[styles.chip, l === locale && styles.active]}
        >
          <Text style={[styles.text, l === locale && styles.activeText]}>
            {dictionaries[l].languageName}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: {
    minHeight: 40,
    paddingHorizontal: 14,
    justifyContent: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  active: { backgroundColor: colors.accent, borderColor: colors.brand },
  text: { color: colors.text, fontSize: 15 },
  activeText: { color: colors.brand, fontWeight: "600" },
});
