import { useI18n } from "@/lib/i18n";
import { ExternalPageButton } from "./external-page-button";

/** Public operator document; opening it does not record consent or send account data. */
export function PrivacyLink() {
  const { locale, d } = useI18n();
  return (
    <ExternalPageButton
      label={d.externalPage.privacy}
      variant="text"
      url={
        locale === "sv"
          ? "https://komisio.com/sv/privacy/"
          : "https://komisio.com/en/privacy/"
      }
    />
  );
}
