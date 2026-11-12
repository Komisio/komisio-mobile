import type { Locale } from "./locale";

const sv = {
  done: "Klart",
  allow: "Tillåt kamera",
  starting: "Startar kameran…",
  captureError:
    "Kameran kunde inte ta bilden. Försök igen eller välj bilder från biblioteket.",
  saveError:
    "Den senaste bilden kunde inte sparas. Försök spara den igen innan du tar fler.",
  retrySave: "Spara bilden igen",
  hint: "Ta flera bilder i följd. Tryck på Klart när du är nöjd.",
};
type Copy = { [K in keyof typeof sv]: string };
const copies: Record<Locale, Copy> = {
  sv,
  en: {
    done: "Done",
    allow: "Allow camera",
    starting: "Starting camera…",
    captureError:
      "The camera could not take the photo. Try again or choose photos from your library.",
    saveError:
      "The last photo could not be saved. Try saving it again before taking more.",
    retrySave: "Save photo again",
    hint: "Take photos in a row. Tap Done when you are ready.",
  },
  no: {
    done: "Ferdig",
    allow: "Tillat kamera",
    starting: "Starter kameraet…",
    captureError:
      "Kameraet kunne ikke ta bildet. Prøv igjen eller velg bilder fra biblioteket.",
    saveError:
      "Det siste bildet kunne ikke lagres. Prøv å lagre det igjen før du tar flere.",
    retrySave: "Lagre bildet igjen",
    hint: "Ta flere bilder etter hverandre. Trykk Ferdig når du er klar.",
  },
  da: {
    done: "Færdig",
    allow: "Tillad kamera",
    starting: "Starter kameraet…",
    captureError:
      "Kameraet kunne ikke tage billedet. Prøv igen eller vælg billeder fra biblioteket.",
    saveError:
      "Det seneste billede kunne ikke gemmes. Prøv at gemme det igen, før du tager flere.",
    retrySave: "Gem billedet igen",
    hint: "Tag flere billeder i træk. Tryk Færdig, når du er klar.",
  },
  fi: {
    done: "Valmis",
    allow: "Salli kamera",
    starting: "Kamera käynnistyy…",
    captureError:
      "Kuvaa ei voitu ottaa. Yritä uudelleen tai valitse kuvia kirjastosta.",
    saveError:
      "Viimeistä kuvaa ei voitu tallentaa. Yritä tallentaa se uudelleen ennen uusien kuvien ottamista.",
    retrySave: "Tallenna kuva uudelleen",
    hint: "Ota useita kuvia peräkkäin. Napauta Valmis, kun olet valmis.",
  },
  de: {
    done: "Fertig",
    allow: "Kamera erlauben",
    starting: "Kamera startet…",
    captureError:
      "Das Foto konnte nicht aufgenommen werden. Versuche es erneut oder wähle Bilder aus der Mediathek.",
    saveError:
      "Das letzte Foto konnte nicht gespeichert werden. Speichere es erneut, bevor du weitere aufnimmst.",
    retrySave: "Foto erneut speichern",
    hint: "Nimm mehrere Fotos nacheinander auf. Tippe anschließend auf Fertig.",
  },
  es: {
    done: "Listo",
    allow: "Permitir cámara",
    starting: "Iniciando cámara…",
    captureError:
      "No se pudo hacer la foto. Inténtalo de nuevo o elige fotos de la biblioteca.",
    saveError:
      "No se pudo guardar la última foto. Vuelve a guardarla antes de hacer más.",
    retrySave: "Guardar foto de nuevo",
    hint: "Haz varias fotos seguidas. Pulsa Listo cuando termines.",
  },
  it: {
    done: "Fine",
    allow: "Consenti fotocamera",
    starting: "Avvio fotocamera…",
    captureError:
      "Non è stato possibile scattare la foto. Riprova o scegli foto dalla libreria.",
    saveError:
      "L'ultima foto non è stata salvata. Prova a salvarla di nuovo prima di scattarne altre.",
    retrySave: "Salva di nuovo",
    hint: "Scatta più foto di seguito. Tocca Fine quando hai finito.",
  },
};
export const photoCaptureCopy = (locale: Locale) => copies[locale];
