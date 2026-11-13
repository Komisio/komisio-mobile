import type { Locale } from "./locale";
type Copy = {
  title: string;
  hint: string;
  save: string;
  change: string;
  invalid: string;
  changed: string;
  pending: string;
  required: string;
  cancel: string;
  limits: string;
  bookingInvalid: string;
};
const copy: Record<Locale, Copy> = {
  sv: {
    title: "Din avsändaradress",
    hint: "Sparas i din profil och används nästa gång du skickar en vara.",
    save: "Spara adress",
    change: "Ändra",
    invalid: "Ange gatuadress, femsiffrigt postnummer och ort.",
    changed: "Adressen har ändrats. Läs in den igen innan du sparar.",
    pending:
      "Det är oklart om adressen sparades. Försök igen för att kontrollera samma ändring.",
    required:
      "Du kan spara din adress när du har tackat ja till ditt första erbjudande från Komisio.",
    cancel: "Avbryt",
    limits:
      "Packa stadigt. Max 20 kg och 150 cm på längsta sidan. Längd + omkrets: högst 300 cm.",
    bookingInvalid: "Kontrollera avsändaradressen och försök igen.",
  },
  en: {
    title: "Your sender address",
    hint: "Saved in your profile and reused the next time you send an item.",
    save: "Save address",
    change: "Edit",
    invalid: "Enter a street, five-digit Swedish postal code and city.",
    changed: "The address has changed. Reload it before saving.",
    pending: "The save is unconfirmed. Retry to check the same change.",
    required:
      "You can save your address after accepting your first Komisio offer.",
    cancel: "Cancel",
    limits:
      "Pack securely. Max 20 kg and 150 cm on the longest side. Length + girth: max 300 cm.",
    bookingInvalid: "Check the sender address and try again.",
  },
  no: {
    title: "Din avsenderadresse",
    hint: "Lagres i profilen og brukes neste gang du sender en vare.",
    save: "Lagre adresse",
    change: "Endre",
    invalid: "Oppgi gateadresse, svensk postnummer med fem sifre og sted.",
    changed: "Adressen er endret. Last den inn igjen før du lagrer.",
    pending:
      "Lagringen er ikke bekreftet. Prøv igjen for å kontrollere samme endring.",
    required:
      "Du kan lagre adressen etter at du har godtatt ditt første tilbud fra Komisio.",
    cancel: "Avbryt",
    limits:
      "Pakk godt. Maks 20 kg og 150 cm på lengste side. Lengde + omkrets: maks 300 cm.",
    bookingInvalid: "Kontroller avsenderadressen og prøv igjen.",
  },
  da: {
    title: "Din afsenderadresse",
    hint: "Gemmes i din profil og bruges næste gang du sender en vare.",
    save: "Gem adresse",
    change: "Ret",
    invalid: "Angiv gadeadresse, svensk postnummer med fem cifre og by.",
    changed: "Adressen er ændret. Indlæs den igen, før du gemmer.",
    pending:
      "Det er uklart, om adressen blev gemt. Prøv igen for at kontrollere samme ændring.",
    required:
      "Du kan gemme adressen, når du har accepteret dit første tilbud fra Komisio.",
    cancel: "Annuller",
    limits:
      "Pak forsvarligt. Maks. 20 kg og 150 cm på længste side. Længde + omkreds: maks. 300 cm.",
    bookingInvalid: "Kontrollér afsenderadressen og prøv igen.",
  },
  fi: {
    title: "Lähettäjän osoitteesi",
    hint: "Tallennetaan profiiliisi ja käytetään seuraavalla lähetyskerralla.",
    save: "Tallenna osoite",
    change: "Muokkaa",
    invalid:
      "Anna katuosoite, viisinumeroinen Ruotsin postinumero ja kaupunki.",
    changed: "Osoite on muuttunut. Lataa se uudelleen ennen tallennusta.",
    pending:
      "Tallennusta ei ole vahvistettu. Tarkista sama muutos yrittämällä uudelleen.",
    required:
      "Voit tallentaa osoitteen hyväksyttyäsi ensimmäisen Komisio-tarjouksesi.",
    cancel: "Peruuta",
    limits:
      "Pakkaa huolellisesti. Enintään 20 kg ja pisin sivu 150 cm. Pituus + ympärysmitta: enintään 300 cm.",
    bookingInvalid: "Tarkista lähettäjän osoite ja yritä uudelleen.",
  },
  de: {
    title: "Deine Absenderadresse",
    hint: "Wird im Profil gespeichert und beim nächsten Versand wiederverwendet.",
    save: "Adresse speichern",
    change: "Ändern",
    invalid: "Straße, fünfstellige schwedische Postleitzahl und Ort eingeben.",
    changed: "Die Adresse wurde geändert. Vor dem Speichern neu laden.",
    pending:
      "Das Speichern ist unbestätigt. Erneut versuchen, um dieselbe Änderung zu prüfen.",
    required:
      "Nach Annahme deines ersten Komisio-Angebots kannst du die Adresse speichern.",
    cancel: "Abbrechen",
    limits:
      "Sicher verpacken. Max. 20 kg und 150 cm längste Seite. Länge + Umfang: max. 300 cm.",
    bookingInvalid: "Absenderadresse prüfen und erneut versuchen.",
  },
  es: {
    title: "Tu dirección de remitente",
    hint: "Se guarda en tu perfil y se reutiliza en el próximo envío.",
    save: "Guardar dirección",
    change: "Editar",
    invalid: "Indica calle, código postal sueco de cinco cifras y ciudad.",
    changed: "La dirección ha cambiado. Vuelve a cargarla antes de guardar.",
    pending:
      "No se ha confirmado el guardado. Reintenta para comprobar el mismo cambio.",
    required:
      "Puedes guardar tu dirección tras aceptar tu primera oferta de Komisio.",
    cancel: "Cancelar",
    limits:
      "Embala bien. Máx. 20 kg y 150 cm en el lado más largo. Longitud + perímetro: máx. 300 cm.",
    bookingInvalid:
      "Comprueba la dirección del remitente e inténtalo de nuevo.",
  },
  it: {
    title: "Il tuo indirizzo di mittente",
    hint: "Salvato nel profilo e riutilizzato per la prossima spedizione.",
    save: "Salva indirizzo",
    change: "Modifica",
    invalid: "Inserisci via, codice postale svedese di cinque cifre e città.",
    changed: "L’indirizzo è cambiato. Ricaricalo prima di salvare.",
    pending:
      "Il salvataggio non è confermato. Riprova per verificare la stessa modifica.",
    required:
      "Puoi salvare l’indirizzo dopo aver accettato la prima offerta di Komisio.",
    cancel: "Annulla",
    limits:
      "Imballa bene. Max 20 kg e 150 cm sul lato più lungo. Lunghezza + circonferenza: max 300 cm.",
    bookingInvalid: "Controlla l’indirizzo del mittente e riprova.",
  },
};
export const shippingAddressCopy = (locale: Locale) => copy[locale];
