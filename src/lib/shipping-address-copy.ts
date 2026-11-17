import type { Locale } from "./locale";
type Copy = {
  title: string;
  firstName: string;
  lastName: string;
  phone: string;
  hint: string;
  save: string;
  change: string;
  invalid: string;
  changed: string;
  pending: string;
  required: string;
  cancel: string;
  bookingInvalid: string;
};
const copy: Record<Locale, Copy> = {
  sv: {
    firstName: "Förnamn",
    lastName: "Efternamn",
    phone: "Telefonnummer",
    title: "Avsändare",
    hint: "Sparas i din profil och används nästa gång du skickar en vara.",
    save: "Spara avsändaruppgifter",
    change: "Ändra",
    invalid:
      "Ange förnamn, efternamn, telefonnummer och en fullständig svensk postadress.",
    changed: "Adressen har ändrats. Läs in den igen innan du sparar.",
    pending:
      "Det är oklart om adressen sparades. Försök igen för att kontrollera samma ändring.",
    required:
      "Du kan spara din adress när du har tackat ja till ditt första erbjudande från Komisio.",
    cancel: "Avbryt",
    bookingInvalid: "Kontrollera avsändaradressen och försök igen.",
  },
  en: {
    firstName: "First name",
    lastName: "Last name",
    phone: "Phone number",
    title: "Sender",
    hint: "Saved in your profile and reused the next time you send an item.",
    save: "Save sender details",
    change: "Edit",
    invalid:
      "Enter your first name, last name, phone number and complete Swedish postal address.",
    changed: "The address has changed. Reload it before saving.",
    pending: "The save is unconfirmed. Retry to check the same change.",
    required:
      "You can save your address after accepting your first Komisio offer.",
    cancel: "Cancel",
    bookingInvalid: "Check the sender address and try again.",
  },
  no: {
    firstName: "Fornavn",
    lastName: "Etternavn",
    phone: "Telefonnummer",
    title: "Avsender",
    hint: "Lagres i profilen og brukes neste gang du sender en vare.",
    save: "Lagre avsenderopplysninger",
    change: "Endre",
    invalid:
      "Oppgi fornavn, etternavn, telefonnummer og fullstendig svensk postadresse.",
    changed: "Adressen er endret. Last den inn igjen før du lagrer.",
    pending:
      "Lagringen er ikke bekreftet. Prøv igjen for å kontrollere samme endring.",
    required:
      "Du kan lagre adressen etter at du har godtatt ditt første tilbud fra Komisio.",
    cancel: "Avbryt",
    bookingInvalid: "Kontroller avsenderadressen og prøv igjen.",
  },
  da: {
    firstName: "Fornavn",
    lastName: "Efternavn",
    phone: "Telefonnummer",
    title: "Afsender",
    hint: "Gemmes i din profil og bruges næste gang du sender en vare.",
    save: "Gem afsenderoplysninger",
    change: "Ret",
    invalid:
      "Angiv fornavn, efternavn, telefonnummer og fuld svensk postadresse.",
    changed: "Adressen er ændret. Indlæs den igen, før du gemmer.",
    pending:
      "Det er uklart, om adressen blev gemt. Prøv igen for at kontrollere samme ændring.",
    required:
      "Du kan gemme adressen, når du har accepteret dit første tilbud fra Komisio.",
    cancel: "Annuller",
    bookingInvalid: "Kontrollér afsenderadressen og prøv igen.",
  },
  fi: {
    firstName: "Etunimi",
    lastName: "Sukunimi",
    phone: "Puhelinnumero",
    title: "Lähettäjä",
    hint: "Tallennetaan profiiliisi ja käytetään seuraavalla lähetyskerralla.",
    save: "Tallenna lähettäjätiedot",
    change: "Muokkaa",
    invalid:
      "Anna etunimi, sukunimi, puhelinnumero ja täydellinen Ruotsin postiosoite.",
    changed: "Osoite on muuttunut. Lataa se uudelleen ennen tallennusta.",
    pending:
      "Tallennusta ei ole vahvistettu. Tarkista sama muutos yrittämällä uudelleen.",
    required:
      "Voit tallentaa osoitteen hyväksyttyäsi ensimmäisen Komisio-tarjouksesi.",
    cancel: "Peruuta",
    bookingInvalid: "Tarkista lähettäjän osoite ja yritä uudelleen.",
  },
  de: {
    firstName: "Vorname",
    lastName: "Nachname",
    phone: "Telefonnummer",
    title: "Absender",
    hint: "Wird im Profil gespeichert und beim nächsten Versand wiederverwendet.",
    save: "Absenderdaten speichern",
    change: "Ändern",
    invalid:
      "Vorname, Nachname, Telefonnummer und vollständige schwedische Postadresse eingeben.",
    changed: "Die Adresse wurde geändert. Vor dem Speichern neu laden.",
    pending:
      "Das Speichern ist unbestätigt. Erneut versuchen, um dieselbe Änderung zu prüfen.",
    required:
      "Nach Annahme deines ersten Komisio-Angebots kannst du die Adresse speichern.",
    cancel: "Abbrechen",
    bookingInvalid: "Absenderadresse prüfen und erneut versuchen.",
  },
  es: {
    firstName: "Nombre",
    lastName: "Apellidos",
    phone: "Teléfono",
    title: "Remitente",
    hint: "Se guarda en tu perfil y se reutiliza en el próximo envío.",
    save: "Guardar datos del remitente",
    change: "Editar",
    invalid:
      "Indica nombre, apellidos, teléfono y dirección postal sueca completa.",
    changed: "La dirección ha cambiado. Vuelve a cargarla antes de guardar.",
    pending:
      "No se ha confirmado el guardado. Reintenta para comprobar el mismo cambio.",
    required:
      "Puedes guardar tu dirección tras aceptar tu primera oferta de Komisio.",
    cancel: "Cancelar",
    bookingInvalid:
      "Comprueba la dirección del remitente e inténtalo de nuevo.",
  },
  it: {
    firstName: "Nome",
    lastName: "Cognome",
    phone: "Telefono",
    title: "Mittente",
    hint: "Salvato nel profilo e riutilizzato per la prossima spedizione.",
    save: "Salva dati del mittente",
    change: "Modifica",
    invalid:
      "Inserisci nome, cognome, telefono e indirizzo postale svedese completo.",
    changed: "L’indirizzo è cambiato. Ricaricalo prima di salvare.",
    pending:
      "Il salvataggio non è confermato. Riprova per verificare la stessa modifica.",
    required:
      "Puoi salvare l’indirizzo dopo aver accettato la prima offerta di Komisio.",
    cancel: "Annulla",
    bookingInvalid: "Controlla l’indirizzo del mittente e riprova.",
  },
};
export const shippingAddressCopy = (locale: Locale) => copy[locale];
