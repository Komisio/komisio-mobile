import { View } from "react-native";
import { dictionaries, locales, useI18n } from "@/lib/i18n";
import { Choice, Message } from "./ui";

export function LanguageOptions() {
  const { d, locale, setLocale, saveFailed } = useI18n();
  return (
    <View style={{ gap: 8 }}>
      {saveFailed ? (
        <Message tone="error">{d.languageSaveFailed}</Message>
      ) : null}
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
    </View>
  );
}
