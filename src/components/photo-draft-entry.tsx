import { router } from "expo-router";
import { Button } from "./ui";
import { useI18n } from "@/lib/i18n";
import { photoDraftCopy } from "@/lib/photo-draft-copy";

export function PhotoDraftEntry() {
  const { locale } = useI18n();
  return (
    <Button
      label={photoDraftCopy(locale).title}
      variant="secondary"
      onPress={() => router.push("/photo-draft")}
    />
  );
}
