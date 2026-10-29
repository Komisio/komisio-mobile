import { View } from "react-native";
import { dictionaries, locales, useI18n } from "@/lib/i18n";
import { Choice, uiStyles } from "./ui";
export function LanguagePicker() {
  const { d, locale, setLocale } = useI18n();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={d.language}
      style={uiStyles.choices}
    >
      {locales.map((l) => (
        <Choice
          key={l}
          role="radio"
          label={dictionaries[l].languageName}
          selected={l === locale}
          onPress={() => setLocale(l)}
        />
      ))}
    </View>
  );
}
