import { View } from "react-native";
import { dictionaries, locales, useI18n } from "@/lib/i18n";
import { Choice, Screen } from "@/components/ui";

export default function LanguageScreen() {
  const { d, locale, setLocale } = useI18n();
  return (
    <Screen title={d.language} topSafeArea={false}>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={d.language}
        style={{ gap: 8 }}
      >
        {locales.map((code) => (
          <Choice
            key={code}
            listRow
            role="radio"
            label={dictionaries[code].languageName}
            selected={locale === code}
            onPress={() => setLocale(code)}
          />
        ))}
      </View>
    </Screen>
  );
}
