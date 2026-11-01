import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { NavigationRow } from "./ui";
import { DetailSheet } from "./detail-sheet";
import { LanguageOptions } from "./language-options";

export function LanguagePicker() {
  const { d } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <>
      <NavigationRow
        label={`${d.language}: ${d.languageName}`}
        onPress={() => setOpen(true)}
      />
      <DetailSheet
        title={d.language}
        open={open}
        onClose={() => setOpen(false)}
      >
        <LanguageOptions />
      </DetailSheet>
    </>
  );
}
