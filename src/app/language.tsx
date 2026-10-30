import { useI18n } from "@/lib/i18n";
import { Screen } from "@/components/ui";
import { LanguageOptions } from "@/components/language-options";

export default function LanguageScreen() {
  const { d } = useI18n();
  return (
    <Screen title={d.language} topSafeArea={false}>
      <LanguageOptions />
    </Screen>
  );
}
