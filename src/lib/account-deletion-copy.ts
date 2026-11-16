import type { Locale } from "./locale";

const en = {
  title: "Delete account",
  intro:
    "Request deletion of your Komisio account and personal data. This covers your sign-in methods and your seller accounts at all connected stores.",
  retained:
    "We review ongoing consignments, balances and payouts first. Records that must be kept, such as bookkeeping documents, are retained. Your money and items are not deleted by this request.",
  timing:
    "Komisio handles your request manually and responds within one month. You receive confirmation when deletion is complete. Until then, you can continue to sign in.",
  confirm: "I want to request deletion of my entire Komisio account.",
  submit: "Request account deletion",
  received: "Your deletion request has been received",
  processing: "Your deletion request is being handled",
  completed: "Your account has been deleted",
  pending:
    "Your account has not been deleted yet. You do not need to send an email or create another request.",
  deadline: "We will respond by",
  failed:
    "We could not confirm the result. Reload the status or try again. The same request will be reused.",
  loadFailed: "Could not load your deletion status. Please try again.",
  refresh: "Reload status",
  apple:
    "If you used Apple, you can also remove Komisio from Sign in with Apple. This is optional and does not cancel your deletion request.",
  appleLink: "How to remove Komisio from Apple",
};
type Copy = typeof en;
const copy: Record<Locale, Copy> = {
  en,
  sv: {
    title: "Radera konto",
    intro:
      "Begär att ditt Komisio-konto och dina personuppgifter raderas. Det gäller dina inloggningssätt och dina säljarkonton hos alla anslutna butiker.",
    retained:
      "Vi går först igenom pågående inlämningar, saldo och utbetalningar. Underlag som måste sparas, exempelvis bokföringsunderlag, bevaras. Dina pengar och varor försvinner inte genom begäran.",
    timing:
      "Komisio handlägger din begäran manuellt och återkommer inom en månad. Du får en bekräftelse när raderingen är klar. Fram till dess kan du fortsätta logga in.",
    confirm: "Jag vill begära radering av hela mitt Komisio-konto.",
    submit: "Begär kontoradering",
    received: "Din begäran om kontoradering är mottagen",
    processing: "Din begäran om kontoradering handläggs",
    completed: "Ditt konto har raderats",
    pending:
      "Kontot är ännu inte raderat. Du behöver inte mejla oss eller skicka en ny begäran.",
    deadline: "Vi återkommer senast",
    failed:
      "Vi kunde inte bekräfta resultatet. Hämta status eller försök igen. Samma begäran används.",
    loadFailed:
      "Det gick inte att hämta status för kontoradering. Försök igen.",
    refresh: "Hämta status",
    apple:
      "Om du har använt Apple kan du även ta bort Komisio från Logga in med Apple. Det är valfritt och avbryter inte din begäran om kontoradering.",
    appleLink: "Så tar du bort Komisio från Apple",
  },
  no: {
    title: "Slett konto",
    intro:
      "Be om sletting av Komisio-kontoen og personopplysningene dine. Dette gjelder innloggingsmetodene og selgerkontoene dine hos alle tilknyttede butikker.",
    retained:
      "Vi gjennomgår først pågående innleveringer, saldo og utbetalinger. Dokumentasjon som må oppbevares, for eksempel regnskapsbilag, beholdes. Pengene og varene dine slettes ikke av forespørselen.",
    timing:
      "Komisio behandler forespørselen manuelt og svarer innen én måned. Du får en bekreftelse når slettingen er fullført. Frem til da kan du fortsatt logge inn.",
    confirm: "Jeg vil be om sletting av hele Komisio-kontoen min.",
    submit: "Be om kontosletting",
    received: "Forespørselen om kontosletting er mottatt",
    processing: "Forespørselen om kontosletting behandles",
    completed: "Kontoen din er slettet",
    pending:
      "Kontoen er ikke slettet ennå. Du trenger ikke sende e-post eller en ny forespørsel.",
    deadline: "Vi svarer senest",
    failed:
      "Vi kunne ikke bekrefte resultatet. Last inn status eller prøv igjen. Samme forespørsel brukes.",
    loadFailed: "Kunne ikke hente slettestatus. Prøv igjen.",
    refresh: "Hent status",
    apple:
      "Hvis du brukte Apple, kan du også fjerne Komisio fra Logg på med Apple. Dette er valgfritt og avbryter ikke sletteforespørselen.",
    appleLink: "Slik fjerner du Komisio fra Apple",
  },
  da: {
    title: "Slet konto",
    intro:
      "Anmod om sletning af din Komisio-konto og dine personoplysninger. Det gælder dine loginmetoder og sælgerkonti hos alle tilknyttede butikker.",
    retained:
      "Vi gennemgår først igangværende indleveringer, saldo og udbetalinger. Dokumentation, der skal gemmes, såsom regnskabsbilag, bevares. Dine penge og varer slettes ikke af anmodningen.",
    timing:
      "Komisio behandler din anmodning manuelt og svarer inden for en måned. Du får en bekræftelse, når sletningen er afsluttet. Indtil da kan du fortsat logge ind.",
    confirm: "Jeg ønsker at anmode om sletning af hele min Komisio-konto.",
    submit: "Anmod om kontosletning",
    received: "Din anmodning om kontosletning er modtaget",
    processing: "Din anmodning om kontosletning behandles",
    completed: "Din konto er slettet",
    pending:
      "Kontoen er endnu ikke slettet. Du behøver ikke sende en e-mail eller en ny anmodning.",
    deadline: "Vi svarer senest",
    failed:
      "Vi kunne ikke bekræfte resultatet. Hent status eller prøv igen. Samme anmodning bruges.",
    loadFailed: "Kunne ikke hente slettestatus. Prøv igen.",
    refresh: "Hent status",
    apple:
      "Hvis du brugte Apple, kan du også fjerne Komisio fra Log ind med Apple. Det er valgfrit og annullerer ikke din sletteanmodning.",
    appleLink: "Sådan fjerner du Komisio fra Apple",
  },
  fi: {
    title: "Poista tili",
    intro:
      "Pyydä Komisio-tilisi ja henkilötietojesi poistamista. Pyyntö koskee kirjautumistapojasi ja myyjätilejäsi kaikissa liitetyissä myymälöissä.",
    retained:
      "Tarkistamme ensin keskeneräiset toimitukset, saldon ja maksut. Säilytettävät asiakirjat, kuten kirjanpitoaineisto, säilytetään. Pyyntö ei poista rahojasi tai tavaroitasi.",
    timing:
      "Komisio käsittelee pyyntösi manuaalisesti ja vastaa kuukauden kuluessa. Saat vahvistuksen, kun poisto on valmis. Siihen asti voit edelleen kirjautua sisään.",
    confirm: "Haluan pyytää koko Komisio-tilini poistamista.",
    submit: "Pyydä tilin poistamista",
    received: "Tilin poistopyyntösi on vastaanotettu",
    processing: "Tilin poistopyyntöäsi käsitellään",
    completed: "Tilisi on poistettu",
    pending:
      "Tiliä ei ole vielä poistettu. Sinun ei tarvitse lähettää sähköpostia tai uutta pyyntöä.",
    deadline: "Vastaamme viimeistään",
    failed:
      "Tulosta ei voitu vahvistaa. Lataa tila tai yritä uudelleen. Sama pyyntö käytetään uudelleen.",
    loadFailed: "Poistopyynnön tilaa ei voitu ladata. Yritä uudelleen.",
    refresh: "Päivitä tila",
    apple:
      "Jos käytit Applea, voit myös poistaa Komision Kirjaudu sisään Applella -palvelusta. Tämä on vapaaehtoista eikä peruuta poistopyyntöäsi.",
    appleLink: "Komision poistaminen Applelta",
  },
  de: {
    title: "Konto löschen",
    intro:
      "Beantrage die Löschung deines Komisio-Kontos und deiner personenbezogenen Daten. Dies umfasst deine Anmeldemethoden und Verkäuferkonten bei allen verbundenen Geschäften.",
    retained:
      "Wir prüfen zuerst laufende Einlieferungen, Guthaben und Auszahlungen. Aufbewahrungspflichtige Unterlagen, etwa Buchungsbelege, bleiben erhalten. Dein Geld und deine Waren werden durch den Antrag nicht gelöscht.",
    timing:
      "Komisio bearbeitet deinen Antrag manuell und antwortet innerhalb eines Monats. Du erhältst eine Bestätigung nach Abschluss der Löschung. Bis dahin kannst du dich weiterhin anmelden.",
    confirm:
      "Ich möchte die Löschung meines gesamten Komisio-Kontos beantragen.",
    submit: "Kontolöschung beantragen",
    received: "Dein Löschantrag ist eingegangen",
    processing: "Dein Löschantrag wird bearbeitet",
    completed: "Dein Konto wurde gelöscht",
    pending:
      "Das Konto wurde noch nicht gelöscht. Du musst keine E-Mail und keinen weiteren Antrag senden.",
    deadline: "Wir antworten spätestens am",
    failed:
      "Das Ergebnis konnte nicht bestätigt werden. Lade den Status neu oder versuche es erneut. Derselbe Antrag wird verwendet.",
    loadFailed:
      "Der Löschstatus konnte nicht geladen werden. Bitte erneut versuchen.",
    refresh: "Status neu laden",
    apple:
      "Wenn du Apple verwendet hast, kannst du Komisio auch aus „Mit Apple anmelden“ entfernen. Dies ist freiwillig und hebt deinen Löschantrag nicht auf.",
    appleLink: "Komisio aus Apple entfernen",
  },
  es: {
    title: "Eliminar cuenta",
    intro:
      "Solicita la eliminación de tu cuenta de Komisio y tus datos personales. Incluye tus métodos de inicio de sesión y tus cuentas de vendedor en todas las tiendas vinculadas.",
    retained:
      "Primero revisamos los artículos entregados, saldos y pagos pendientes. Conservamos los documentos que deben guardarse, como los justificantes contables. Esta solicitud no elimina tu dinero ni tus artículos.",
    timing:
      "Komisio tramita tu solicitud manualmente y responde en un mes. Recibirás una confirmación al finalizar la eliminación. Hasta entonces puedes seguir iniciando sesión.",
    confirm: "Quiero solicitar la eliminación de toda mi cuenta de Komisio.",
    submit: "Solicitar eliminación de cuenta",
    received: "Hemos recibido tu solicitud de eliminación",
    processing: "Estamos tramitando tu solicitud de eliminación",
    completed: "Tu cuenta ha sido eliminada",
    pending:
      "La cuenta aún no se ha eliminado. No necesitas enviar un correo ni otra solicitud.",
    deadline: "Responderemos antes del",
    failed:
      "No pudimos confirmar el resultado. Actualiza el estado o inténtalo de nuevo. Se reutilizará la misma solicitud.",
    loadFailed: "No se pudo cargar el estado. Inténtalo de nuevo.",
    refresh: "Actualizar estado",
    apple:
      "Si utilizaste Apple, también puedes quitar Komisio de Iniciar sesión con Apple. Es opcional y no cancela tu solicitud de eliminación.",
    appleLink: "Cómo quitar Komisio de Apple",
  },
  it: {
    title: "Elimina account",
    intro:
      "Richiedi la cancellazione del tuo account Komisio e dei tuoi dati personali. Sono inclusi i metodi di accesso e gli account venditore presso tutti i negozi collegati.",
    retained:
      "Esaminiamo prima le consegne in corso, il saldo e i pagamenti. Conserviamo i documenti obbligatori, come quelli contabili. La richiesta non elimina il tuo denaro né i tuoi articoli.",
    timing:
      "Komisio gestisce la richiesta manualmente e risponde entro un mese. Riceverai una conferma al termine della cancellazione. Nel frattempo puoi continuare ad accedere.",
    confirm:
      "Desidero richiedere la cancellazione del mio intero account Komisio.",
    submit: "Richiedi cancellazione account",
    received: "La richiesta di cancellazione è stata ricevuta",
    processing: "La richiesta di cancellazione è in elaborazione",
    completed: "Il tuo account è stato eliminato",
    pending:
      "L’account non è ancora stato eliminato. Non devi inviare un’email o un’altra richiesta.",
    deadline: "Risponderemo entro il",
    failed:
      "Non è stato possibile confermare il risultato. Aggiorna lo stato o riprova. Verrà usata la stessa richiesta.",
    loadFailed: "Impossibile caricare lo stato della cancellazione. Riprova.",
    refresh: "Aggiorna stato",
    apple:
      "Se hai usato Apple, puoi anche rimuovere Komisio da Accedi con Apple. È facoltativo e non annulla la richiesta di cancellazione.",
    appleLink: "Come rimuovere Komisio da Apple",
  },
};
export function accountDeletionCopy(locale: Locale) {
  return copy[locale];
}
