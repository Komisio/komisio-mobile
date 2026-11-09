import { router } from "expo-router";
import { Button } from "./ui";
import { useI18n } from "@/lib/i18n";
import { externalIntakePreviewEnabled } from "@/lib/external-intake-preview";
import { photoDraftCopy } from "@/lib/photo-draft-copy";

export function PhotoDraftEntry() {
  const { locale } = useI18n();
  if (!externalIntakePreviewEnabled()) return null;
  return (
    <Button
      label={photoDraftCopy(locale).entry}
      variant="secondary"
      onPress={() => router.push("/photo-draft")}
    />
  );
}
