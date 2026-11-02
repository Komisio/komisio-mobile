import { useRef, useState } from "react";
import { openBrowserAsync } from "expo-web-browser";
import { useI18n, type Locale } from "@/lib/i18n";
import { Button, Message } from "./ui";

const copy: Record<Locale, { label: string; failed: string }> = {
  sv: {
    label: "Integritetspolicy",
    failed: "Kunde inte öppna sidan. Försök igen.",
  },
  en: {
    label: "Privacy policy",
    failed: "Could not open the page. Try again.",
  },
  no: {
    label: "Personvernerklæring (engelsk)",
    failed: "Kunne ikke åpne siden. Prøv igjen.",
  },
  da: {
    label: "Privatlivspolitik (engelsk)",
    failed: "Kunne ikke åbne siden. Prøv igen.",
  },
  fi: {
    label: "Tietosuojaseloste (englanniksi)",
    failed: "Sivua ei voitu avata. Yritä uudelleen.",
  },
  de: {
    label: "Datenschutzerklärung (Englisch)",
    failed: "Die Seite konnte nicht geöffnet werden. Bitte erneut versuchen.",
  },
  es: {
    label: "Política de privacidad (inglés)",
    failed: "No se pudo abrir la página. Inténtalo de nuevo.",
  },
  it: {
    label: "Informativa sulla privacy (inglese)",
    failed: "Impossibile aprire la pagina. Riprova.",
  },
};

/** Public operator document; opening it does not record consent or send account data. */
export function PrivacyLink() {
  const { locale } = useI18n();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const opening = useRef(false);
  const text = copy[locale];
  const open = async () => {
    if (opening.current) return;
    opening.current = true;
    setBusy(true);
    setFailed(false);
    try {
      await openBrowserAsync(
        locale === "sv"
          ? "https://komisio.com/sv/privacy/"
          : "https://komisio.com/en/privacy/",
      );
    } catch {
      setFailed(true);
    } finally {
      opening.current = false;
      setBusy(false);
    }
  };
  return (
    <>
      <Button
        label={text.label}
        variant="text"
        busy={busy}
        onPress={() => void open()}
      />
      {failed ? <Message tone="error">{text.failed}</Message> : null}
    </>
  );
}
