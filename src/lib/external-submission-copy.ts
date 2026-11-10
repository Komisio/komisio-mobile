import type { Locale } from "./locale";
const sv = {
  phoneTitle: "Verifiera mobilnumret",
  phoneIntro: "Bekräfta numret med en kod via sms. Inget lösenord behövs.",
  phone: "Mobilnummer med landskod",
  sendCode: "Skicka kod",
  code: "Kod från sms",
  verify: "Verifiera",
  resend: "Skicka ny kod",
  resendWait: "Ny kod om {seconds} s",
  existingAccount: "Numret kopplas till kontot du redan är inloggad på.",
  phoneInvalid: "Ange mobilnumret med landskod, till exempel +46701234567.",
  phoneUnavailable:
    "Det går inte att skicka eller verifiera koden just nu. Försök igen senare. Utkastet finns kvar.",
  codeInvalid: "Koden är fel eller har gått ut. Begär en ny kod.",
  phoneUsed:
    "Numret hör till ett annat konto. Logga in på det kontot eller använd ett annat nummer.",
  rateLimit: "Vänta en stund innan du begär en ny kod.",
  sessionChanged: "Kontot har ändrats. Öppna sidan igen innan du fortsätter.",
  reviewIntro:
    "Kontrollera varan och skicka en förfrågan till den valda butiken.",
  send: "Skicka till butiken",
  verifyPhone: "Verifiera mobilnumret",
  pending: "Ett inskick behöver bekräftas",
  resume: "Kontrollera och försök igen",
  sendError:
    "Det gick inte att bekräfta inskickandet. Bilderna finns kvar. Försök igen för att kontrollera samma förfrågan.",
  success: "Skickat till butiken",
  progress: "Laddar upp bild {done} av {total}",
  loadError: "Förfrågningarna kunde inte hämtas. Försök igen.",
  myRequests: "Mina förfrågningar",
  noRequests: "Du har inte skickat några förfrågningar ännu.",
  newItem: "Fota en vara",
  continueDraft: "Fortsätt med utkastet",
  activeCount: "{count} av 10 aktiva varor",
  waiting: "Väntar på butik",
  declined: "Nekad",
  limit:
    "Du har redan 10 aktiva varor. En ny plats blir ledig när en vara är avslutad.",
  unavailable:
    "Butiken tar inte emot nya förfrågningar just nu. Välj en annan butik.",
  changed:
    "Butikens valuta har ändrats. Välj butiken igen och kontrollera det önskade priset.",
  photoError:
    "Bilden kunde inte förberedas eller laddas upp. Originalet finns kvar i utkastet.",
  signOut: "Logga ut",
  toStore: "Till butiken",
  more: "Visa fler",
  previous: "Föregående",
  editAfterRefusal: "Ändra uppgifterna och försök igen.",
};
type Copy = { [K in keyof typeof sv]: string };
const en: Copy = {
  phoneTitle: "Verify your mobile number",
  phoneIntro:
    "Confirm your number with a code by text message. No password needed.",
  phone: "Mobile number with country code",
  sendCode: "Send code",
  code: "Code from text message",
  verify: "Verify",
  resend: "Send a new code",
  resendWait: "New code in {seconds} s",
  existingAccount:
    "The number will be linked to the account you are already signed in to.",
  phoneInvalid:
    "Enter your mobile number with country code, for example +46701234567.",
  phoneUnavailable:
    "The code cannot be sent or verified right now. Try again later. Your draft is saved.",
  codeInvalid: "The code is incorrect or has expired. Request a new code.",
  phoneUsed:
    "This number belongs to another account. Sign in to that account or use another number.",
  rateLimit: "Wait a moment before requesting another code.",
  sessionChanged:
    "The account has changed. Reopen this page before continuing.",
  reviewIntro: "Check the item and send a request to the selected store.",
  send: "Send to the store",
  verifyPhone: "Verify mobile number",
  pending: "A submission needs confirmation",
  resume: "Check and retry",
  sendError:
    "We could not confirm the submission. Your photos are saved. Retry to check the same request.",
  success: "Sent to the store",
  progress: "Uploading photo {done} of {total}",
  loadError: "Your requests could not be loaded. Try again.",
  myRequests: "My requests",
  noRequests: "You have not sent any requests yet.",
  newItem: "Photograph an item",
  continueDraft: "Continue your draft",
  activeCount: "{count} of 10 active items",
  waiting: "Waiting for store",
  declined: "Declined",
  limit:
    "You already have 10 active items. A place becomes available when an item is finished.",
  unavailable:
    "The store is not accepting new requests right now. Choose another store.",
  changed:
    "The store currency has changed. Select the store again and check your requested price.",
  photoError:
    "The photo could not be prepared or uploaded. The original remains in your draft.",
  signOut: "Sign out",
  toStore: "Back to store",
  more: "Show more",
  previous: "Previous",
  editAfterRefusal: "Edit the details and try again.",
};
const no: Copy = {
  phoneTitle: "Bekreft mobilnummeret",
  phoneIntro: "Bekreft nummeret med en kode på SMS. Du trenger ikke passord.",
  phone: "Mobilnummer med landskode",
  sendCode: "Send kode",
  code: "Kode fra SMS",
  verify: "Bekreft",
  resend: "Send ny kode",
  resendWait: "Ny kode om {seconds} s",
  existingAccount: "Nummeret knyttes til kontoen du allerede er logget inn på.",
  phoneInvalid: "Skriv mobilnummeret med landskode, for eksempel +4791234567.",
  phoneUnavailable:
    "Koden kan ikke sendes eller bekreftes akkurat nå. Prøv igjen senere. Utkastet er lagret.",
  codeInvalid: "Koden er feil eller har utløpt. Be om en ny kode.",
  phoneUsed:
    "Nummeret tilhører en annen konto. Logg inn på den kontoen eller bruk et annet nummer.",
  rateLimit: "Vent litt før du ber om en ny kode.",
  sessionChanged: "Kontoen er endret. Åpne siden på nytt før du fortsetter.",
  reviewIntro:
    "Kontroller varen og send en forespørsel til den valgte butikken.",
  send: "Send til butikken",
  verifyPhone: "Bekreft mobilnummer",
  pending: "En innsending må bekreftes",
  resume: "Kontroller og prøv igjen",
  sendError:
    "Vi kunne ikke bekrefte innsendingen. Bildene er lagret. Prøv igjen for å kontrollere samme forespørsel.",
  success: "Sendt til butikken",
  progress: "Laster opp bilde {done} av {total}",
  loadError: "Forespørslene kunne ikke lastes. Prøv igjen.",
  myRequests: "Mine forespørsler",
  noRequests: "Du har ikke sendt noen forespørsler ennå.",
  newItem: "Fotografer en vare",
  continueDraft: "Fortsett med utkastet",
  activeCount: "{count} av 10 aktive varer",
  waiting: "Venter på butikk",
  declined: "Avslått",
  limit:
    "Du har allerede 10 aktive varer. En plass blir ledig når en vare er avsluttet.",
  unavailable:
    "Butikken tar ikke imot nye forespørsler akkurat nå. Velg en annen butikk.",
  changed:
    "Butikkens valuta er endret. Velg butikken igjen og kontroller ønsket pris.",
  photoError:
    "Bildet kunne ikke klargjøres eller lastes opp. Originalen er fortsatt i utkastet.",
  signOut: "Logg ut",
  toStore: "Til butikken",
  more: "Vis flere",
  previous: "Forrige",
  editAfterRefusal: "Endre opplysningene og prøv igjen.",
};
const da: Copy = {
  phoneTitle: "Bekræft mobilnummeret",
  phoneIntro:
    "Bekræft nummeret med en kode via sms. Ingen adgangskode er nødvendig.",
  phone: "Mobilnummer med landekode",
  sendCode: "Send kode",
  code: "Kode fra sms",
  verify: "Bekræft",
  resend: "Send ny kode",
  resendWait: "Ny kode om {seconds} s",
  existingAccount:
    "Nummeret knyttes til den konto, du allerede er logget ind på.",
  phoneInvalid:
    "Indtast mobilnummeret med landekode, for eksempel +4512345678.",
  phoneUnavailable:
    "Koden kan ikke sendes eller bekræftes lige nu. Prøv igen senere. Dit udkast er gemt.",
  codeInvalid: "Koden er forkert eller udløbet. Bed om en ny kode.",
  phoneUsed:
    "Nummeret tilhører en anden konto. Log ind på den konto eller brug et andet nummer.",
  rateLimit: "Vent lidt, før du beder om en ny kode.",
  sessionChanged: "Kontoen er ændret. Åbn siden igen, før du fortsætter.",
  reviewIntro: "Kontrollér varen og send en forespørgsel til den valgte butik.",
  send: "Send til butikken",
  verifyPhone: "Bekræft mobilnummer",
  pending: "En indsendelse skal bekræftes",
  resume: "Kontrollér og prøv igen",
  sendError:
    "Vi kunne ikke bekræfte indsendelsen. Billederne er gemt. Prøv igen for at kontrollere samme forespørgsel.",
  success: "Sendt til butikken",
  progress: "Uploader billede {done} af {total}",
  loadError: "Forespørgslerne kunne ikke hentes. Prøv igen.",
  myRequests: "Mine forespørgsler",
  noRequests: "Du har ikke sendt nogen forespørgsler endnu.",
  newItem: "Fotografér en vare",
  continueDraft: "Fortsæt med udkastet",
  activeCount: "{count} af 10 aktive varer",
  waiting: "Venter på butik",
  declined: "Afvist",
  limit:
    "Du har allerede 10 aktive varer. En plads bliver ledig, når en vare er afsluttet.",
  unavailable:
    "Butikken modtager ikke nye forespørgsler lige nu. Vælg en anden butik.",
  changed:
    "Butikkens valuta er ændret. Vælg butikken igen, og kontrollér din ønskede pris.",
  photoError:
    "Billedet kunne ikke klargøres eller uploades. Originalen er stadig i dit udkast.",
  signOut: "Log ud",
  toStore: "Til butikken",
  more: "Vis flere",
  previous: "Forrige",
  editAfterRefusal: "Ret oplysningerne, og prøv igen.",
};
const fi: Copy = {
  phoneTitle: "Vahvista puhelinnumero",
  phoneIntro:
    "Vahvista numerosi tekstiviestillä saapuvalla koodilla. Et tarvitse salasanaa.",
  phone: "Puhelinnumero maakoodilla",
  sendCode: "Lähetä koodi",
  code: "Tekstiviestin koodi",
  verify: "Vahvista",
  resend: "Lähetä uusi koodi",
  resendWait: "Uusi koodi {seconds} s kuluttua",
  existingAccount: "Numero liitetään tiliin, jolle olet jo kirjautunut.",
  phoneInvalid: "Anna puhelinnumero maakoodilla, esimerkiksi +358401234567.",
  phoneUnavailable:
    "Koodia ei voi lähettää tai vahvistaa juuri nyt. Yritä myöhemmin uudelleen. Luonnoksesi on tallessa.",
  codeInvalid: "Koodi on väärä tai vanhentunut. Pyydä uusi koodi.",
  phoneUsed:
    "Numero kuuluu toiselle tilille. Kirjaudu sille tilille tai käytä toista numeroa.",
  rateLimit: "Odota hetki ennen uuden koodin pyytämistä.",
  sessionChanged: "Tili on vaihtunut. Avaa sivu uudelleen ennen jatkamista.",
  reviewIntro: "Tarkista tuote ja lähetä ehdotus valitulle liikkeelle.",
  send: "Lähetä liikkeelle",
  verifyPhone: "Vahvista puhelinnumero",
  pending: "Lähetys odottaa vahvistusta",
  resume: "Tarkista ja yritä uudelleen",
  sendError:
    "Lähetystä ei voitu vahvistaa. Kuvasi ovat tallessa. Yritä uudelleen tarkistaaksesi saman ehdotuksen.",
  success: "Lähetetty liikkeelle",
  progress: "Lähetetään kuvaa {done}/{total}",
  loadError: "Ehdotuksia ei voitu ladata. Yritä uudelleen.",
  myRequests: "Omat ehdotukset",
  noRequests: "Et ole vielä lähettänyt ehdotuksia.",
  newItem: "Kuvaa tuote",
  continueDraft: "Jatka luonnosta",
  activeCount: "{count}/10 aktiivista tuotetta",
  waiting: "Odottaa liikettä",
  declined: "Hylätty",
  limit:
    "Sinulla on jo 10 aktiivista tuotetta. Paikka vapautuu, kun tuote on käsitelty loppuun.",
  unavailable:
    "Liike ei ota vastaan uusia ehdotuksia juuri nyt. Valitse toinen liike.",
  changed:
    "Liikkeen valuutta on muuttunut. Valitse liike uudelleen ja tarkista toivomasi hinta.",
  photoError:
    "Kuvaa ei voitu valmistella tai lähettää. Alkuperäinen on yhä luonnoksessasi.",
  signOut: "Kirjaudu ulos",
  toStore: "Liikkeeseen",
  more: "Näytä lisää",
  previous: "Edellinen",
  editAfterRefusal: "Muokkaa tietoja ja yritä uudelleen.",
};
const de: Copy = {
  phoneTitle: "Mobilnummer bestätigen",
  phoneIntro: "Bestätige deine Nummer mit einem SMS-Code. Kein Passwort nötig.",
  phone: "Mobilnummer mit Ländervorwahl",
  sendCode: "Code senden",
  code: "Code aus der SMS",
  verify: "Bestätigen",
  resend: "Neuen Code senden",
  resendWait: "Neuer Code in {seconds} s",
  existingAccount:
    "Die Nummer wird mit deinem bereits angemeldeten Konto verknüpft.",
  phoneInvalid:
    "Gib die Mobilnummer mit Ländervorwahl ein, zum Beispiel +491701234567.",
  phoneUnavailable:
    "Der Code kann gerade nicht gesendet oder bestätigt werden. Versuche es später erneut. Dein Entwurf bleibt gespeichert.",
  codeInvalid:
    "Der Code ist falsch oder abgelaufen. Fordere einen neuen Code an.",
  phoneUsed:
    "Die Nummer gehört zu einem anderen Konto. Melde dich dort an oder verwende eine andere Nummer.",
  rateLimit: "Warte kurz, bevor du einen neuen Code anforderst.",
  sessionChanged:
    "Das Konto wurde gewechselt. Öffne die Seite erneut, bevor du fortfährst.",
  reviewIntro:
    "Prüfe den Artikel und sende eine Anfrage an das ausgewählte Geschäft.",
  send: "An das Geschäft senden",
  verifyPhone: "Mobilnummer bestätigen",
  pending: "Eine Einsendung benötigt Bestätigung",
  resume: "Prüfen und erneut versuchen",
  sendError:
    "Die Einsendung konnte nicht bestätigt werden. Deine Fotos sind gespeichert. Versuche es erneut, um dieselbe Anfrage zu prüfen.",
  success: "An das Geschäft gesendet",
  progress: "Foto {done} von {total} wird hochgeladen",
  loadError: "Die Anfragen konnten nicht geladen werden. Versuche es erneut.",
  myRequests: "Meine Anfragen",
  noRequests: "Du hast noch keine Anfragen gesendet.",
  newItem: "Artikel fotografieren",
  continueDraft: "Entwurf fortsetzen",
  activeCount: "{count} von 10 aktiven Artikeln",
  waiting: "Wartet auf Geschäft",
  declined: "Abgelehnt",
  limit:
    "Du hast bereits 10 aktive Artikel. Ein Platz wird frei, wenn ein Artikel abgeschlossen ist.",
  unavailable:
    "Das Geschäft nimmt gerade keine neuen Anfragen an. Wähle ein anderes Geschäft.",
  changed:
    "Die Währung des Geschäfts hat sich geändert. Wähle es erneut aus und prüfe deinen Wunschpreis.",
  photoError:
    "Das Foto konnte nicht vorbereitet oder hochgeladen werden. Das Original bleibt in deinem Entwurf.",
  signOut: "Abmelden",
  toStore: "Zum Geschäft",
  more: "Mehr anzeigen",
  previous: "Zurück",
  editAfterRefusal: "Bearbeite die Angaben und versuche es erneut.",
};
const es: Copy = {
  phoneTitle: "Verifica tu móvil",
  phoneIntro:
    "Confirma tu número con un código por SMS. No necesitas contraseña.",
  phone: "Número de móvil con prefijo internacional",
  sendCode: "Enviar código",
  code: "Código del SMS",
  verify: "Verificar",
  resend: "Enviar otro código",
  resendWait: "Nuevo código en {seconds} s",
  existingAccount:
    "El número se vinculará a la cuenta en la que ya has iniciado sesión.",
  phoneInvalid:
    "Introduce el móvil con el prefijo internacional, por ejemplo +34612345678.",
  phoneUnavailable:
    "Ahora no se puede enviar o verificar el código. Inténtalo más tarde. Tu borrador está guardado.",
  codeInvalid: "El código es incorrecto o ha caducado. Solicita otro código.",
  phoneUsed:
    "Este número pertenece a otra cuenta. Inicia sesión en ella o usa otro número.",
  rateLimit: "Espera un momento antes de solicitar otro código.",
  sessionChanged:
    "La cuenta ha cambiado. Vuelve a abrir la página antes de continuar.",
  reviewIntro:
    "Revisa el artículo y envía una solicitud a la tienda seleccionada.",
  send: "Enviar a la tienda",
  verifyPhone: "Verificar móvil",
  pending: "Un envío necesita confirmación",
  resume: "Comprobar y reintentar",
  sendError:
    "No se pudo confirmar el envío. Tus fotos están guardadas. Reintenta para comprobar la misma solicitud.",
  success: "Enviado a la tienda",
  progress: "Subiendo foto {done} de {total}",
  loadError: "No se pudieron cargar las solicitudes. Inténtalo de nuevo.",
  myRequests: "Mis solicitudes",
  noRequests: "Aún no has enviado solicitudes.",
  newItem: "Fotografiar un artículo",
  continueDraft: "Continuar el borrador",
  activeCount: "{count} de 10 artículos activos",
  waiting: "Esperando a la tienda",
  declined: "Rechazado",
  limit:
    "Ya tienes 10 artículos activos. Habrá una plaza cuando se complete un artículo.",
  unavailable:
    "La tienda no acepta nuevas solicitudes ahora. Elige otra tienda.",
  changed:
    "La moneda de la tienda ha cambiado. Selecciónala de nuevo y comprueba el precio deseado.",
  photoError:
    "No se pudo preparar o subir la foto. El original sigue en tu borrador.",
  signOut: "Cerrar sesión",
  toStore: "Ir a la tienda",
  more: "Mostrar más",
  previous: "Anterior",
  editAfterRefusal: "Edita los datos e inténtalo de nuevo.",
};
const it: Copy = {
  phoneTitle: "Verifica il numero di cellulare",
  phoneIntro:
    "Conferma il numero con un codice via SMS. Non serve una password.",
  phone: "Cellulare con prefisso internazionale",
  sendCode: "Invia codice",
  code: "Codice dell’SMS",
  verify: "Verifica",
  resend: "Invia un nuovo codice",
  resendWait: "Nuovo codice tra {seconds} s",
  existingAccount:
    "Il numero verrà collegato all’account con cui hai già effettuato l’accesso.",
  phoneInvalid:
    "Inserisci il cellulare con il prefisso internazionale, ad esempio +393331234567.",
  phoneUnavailable:
    "Al momento non è possibile inviare o verificare il codice. Riprova più tardi. La bozza è salvata.",
  codeInvalid: "Il codice è errato o scaduto. Richiedine uno nuovo.",
  phoneUsed:
    "Questo numero appartiene a un altro account. Accedi a quell’account o usa un altro numero.",
  rateLimit: "Attendi un momento prima di richiedere un altro codice.",
  sessionChanged: "L’account è cambiato. Riapri la pagina prima di continuare.",
  reviewIntro:
    "Controlla l’articolo e invia una richiesta al negozio selezionato.",
  send: "Invia al negozio",
  verifyPhone: "Verifica cellulare",
  pending: "Un invio richiede conferma",
  resume: "Controlla e riprova",
  sendError:
    "Non è stato possibile confermare l’invio. Le foto sono salvate. Riprova per controllare la stessa richiesta.",
  success: "Inviato al negozio",
  progress: "Caricamento foto {done} di {total}",
  loadError: "Non è stato possibile caricare le richieste. Riprova.",
  myRequests: "Le mie richieste",
  noRequests: "Non hai ancora inviato richieste.",
  newItem: "Fotografa un articolo",
  continueDraft: "Continua la bozza",
  activeCount: "{count} di 10 articoli attivi",
  waiting: "In attesa del negozio",
  declined: "Rifiutato",
  limit:
    "Hai già 10 articoli attivi. Si libererà un posto quando un articolo sarà concluso.",
  unavailable:
    "Il negozio non accetta nuove richieste al momento. Scegli un altro negozio.",
  changed:
    "La valuta del negozio è cambiata. Selezionalo di nuovo e controlla il prezzo desiderato.",
  photoError:
    "Non è stato possibile preparare o caricare la foto. L’originale resta nella bozza.",
  signOut: "Esci",
  toStore: "Al negozio",
  more: "Mostra altro",
  previous: "Precedente",
  editAfterRefusal: "Modifica i dati e riprova.",
};
const copies: Record<Locale, Copy> = { sv, en, no, da, fi, de, es, it };
export function externalSubmissionCopy(locale: Locale) {
  return copies[locale];
}
export function externalSubmissionError(locale: Locale, code: string) {
  const t = copies[locale];
  if (code === "PHONE_INVALID") return t.phoneInvalid;
  if (code === "PHONE_CODE_INVALID") return t.codeInvalid;
  if (code === "PHONE_ALREADY_USED") return t.phoneUsed;
  if (code === "PHONE_RATE_LIMIT") return t.rateLimit;
  if (code === "SESSION_CHANGED") return t.sessionChanged;
  if (code === "ACTIVE_REQUEST_LIMIT") return t.limit;
  if (code === "STORE_UNAVAILABLE") return t.unavailable;
  if (code === "STORE_CHANGED") return t.changed;
  if (
    [
      "PHOTO_INVALID",
      "INVALID_IMAGE",
      "PHOTO_TOO_LARGE",
      "ASSISTANCE_IMAGE_TOO_LARGE",
    ].includes(code)
  )
    return t.photoError;
  return t.sendError;
}
