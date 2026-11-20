import { router, useNavigation } from "expo-router";
import { useI18n } from "@/lib/i18n";
import { Screen } from "@/components/ui";
import { LanguageOptions } from "@/components/language-options";

export default function LanguageScreen() {
  const { d } = useI18n();
  const navigation = useNavigation();
  return (
    <Screen title={d.language} topSafeArea={false}>
      <LanguageOptions
        onSelected={() => {
          if (!navigation.isFocused()) return;
          if (router.canGoBack()) router.back();
          else router.replace("/(tabs)/profile");
        }}
      />
    </Screen>
  );
}
