import type { Locale } from "./locale";

export const centralPayoutCopy = {
  sv: {
    bankFirst:
      "Ange ditt utbetalningskonto första gången. När du har sparat kontot kommer du tillbaka till beloppet du valde.",
    emailInUse:
      "Adressen används av ett annat konto. Ange en annan e-postadress för det här kontot.",
    open: "Visa saldo och begär utbetalning",
    empty:
      "Här visas ditt saldo när du har lämnat in din första vara till Komisio.",
    verifyEmail:
      "Bekräfta en e-postadress för ditt befintliga konto för att använda utbetalningar.",
    sendEmail: "Skicka bekräftelsemejl",
    checkInbox: "Öppna länken i mejlet och gå sedan tillbaka hit.",
    confirmed: "Jag har bekräftat min e-postadress",
  },
  en: {
    bankFirst:
      "Add your payout account the first time. After you save it, you’ll return to the amount you chose.",
    emailInUse:
      "This address belongs to another account. Enter a different email for this account.",
    open: "View balance and request a payout",
    empty:
      "Your balance will appear here once you have submitted your first item to Komisio.",
    verifyEmail:
      "Confirm an email address on your existing account to use payouts.",
    sendEmail: "Send confirmation email",
    checkInbox: "Open the link in your email, then return here.",
    confirmed: "I’ve confirmed my email address",
  },
  no: {
    bankFirst:
      "Legg til utbetalingskontoen din første gang. Når du har lagret kontoen, kommer du tilbake til beløpet du valgte.",
    emailInUse:
      "Adressen brukes av en annen konto. Oppgi en annen e-postadresse for denne kontoen.",
    open: "Vis saldo og be om utbetaling",
    empty:
      "Saldoen vises her når du har levert inn din første vare til Komisio.",
    verifyEmail:
      "Bekreft en e-postadresse på den eksisterende kontoen din for å bruke utbetalinger.",
    sendEmail: "Send bekreftelse på e-post",
    checkInbox: "Åpne lenken i e-posten, og kom tilbake hit.",
    confirmed: "Jeg har bekreftet e-postadressen min",
  },
  da: {
    bankFirst:
      "Tilføj din udbetalingskonto første gang. Når du har gemt kontoen, vender du tilbage til det valgte beløb.",
    emailInUse:
      "Adressen bruges af en anden konto. Angiv en anden e-mailadresse til denne konto.",
    open: "Se saldo og anmod om udbetaling",
    empty:
      "Din saldo vises her, når du har indsendt din første vare til Komisio.",
    verifyEmail:
      "Bekræft en e-mailadresse på din eksisterende konto for at bruge udbetalinger.",
    sendEmail: "Send bekræftelsesmail",
    checkInbox: "Åbn linket i mailen, og vend tilbage hertil.",
    confirmed: "Jeg har bekræftet min e-mailadresse",
  },
  fi: {
    bankFirst:
      "Lisää maksutilisi ensimmäisellä kerralla. Kun olet tallentanut tilin, palaat valitsemaasi summaan.",
    emailInUse:
      "Osoite on toisen tilin käytössä. Anna tälle tilille toinen sähköpostiosoite.",
    open: "Näytä saldo ja pyydä maksua",
    empty:
      "Saldosi näkyy täällä, kun olet lähettänyt ensimmäisen tuotteesi Komisiolle.",
    verifyEmail:
      "Vahvista nykyisen tilisi sähköpostiosoite maksupyyntöjä varten.",
    sendEmail: "Lähetä vahvistusviesti",
    checkInbox: "Avaa sähköpostiviestin linkki ja palaa sitten tänne.",
    confirmed: "Olen vahvistanut sähköpostiosoitteeni",
  },
  de: {
    bankFirst:
      "Gib beim ersten Mal dein Auszahlungskonto an. Nach dem Speichern kehrst du zum gewählten Betrag zurück.",
    emailInUse:
      "Diese Adresse gehört zu einem anderen Konto. Gib für dieses Konto eine andere E-Mail-Adresse an.",
    open: "Guthaben ansehen und Auszahlung anfordern",
    empty:
      "Dein Guthaben erscheint hier, sobald du deinen ersten Artikel bei Komisio eingereicht hast.",
    verifyEmail:
      "Bestätige eine E-Mail-Adresse für dein bestehendes Konto, um Auszahlungen zu nutzen.",
    sendEmail: "Bestätigungsmail senden",
    checkInbox: "Öffne den Link in der E-Mail und kehre dann hierher zurück.",
    confirmed: "Ich habe meine E-Mail-Adresse bestätigt",
  },
  es: {
    bankFirst:
      "Añade tu cuenta para recibir el primer pago. Después de guardarla, volverás al importe que elegiste.",
    emailInUse:
      "Esta dirección pertenece a otra cuenta. Introduce otro correo para esta cuenta.",
    open: "Ver saldo y solicitar un pago",
    empty:
      "Tu saldo aparecerá aquí cuando hayas enviado tu primer artículo a Komisio.",
    verifyEmail:
      "Confirma una dirección de correo en tu cuenta actual para solicitar pagos.",
    sendEmail: "Enviar correo de confirmación",
    checkInbox: "Abre el enlace del correo y vuelve aquí.",
    confirmed: "He confirmado mi correo",
  },
  it: {
    bankFirst:
      "Aggiungi il conto per il primo pagamento. Dopo averlo salvato, tornerai all’importo scelto.",
    emailInUse:
      "Questo indirizzo appartiene a un altro account. Inserisci un’altra e-mail per questo account.",
    open: "Vedi il saldo e richiedi un pagamento",
    empty:
      "Il saldo apparirà qui dopo che avrai inviato il tuo primo articolo a Komisio.",
    verifyEmail:
      "Conferma un indirizzo e-mail sul tuo account esistente per richiedere pagamenti.",
    sendEmail: "Invia e-mail di conferma",
    checkInbox: "Apri il link nell’e-mail, poi torna qui.",
    confirmed: "Ho confermato il mio indirizzo e-mail",
  },
} satisfies Record<
  Locale,
  Record<
    | "open"
    | "empty"
    | "verifyEmail"
    | "sendEmail"
    | "checkInbox"
    | "confirmed"
    | "emailInUse"
    | "bankFirst",
    string
  >
>;
