import type { Locale } from "./locale";
const copies = {
  sv: {
    title: "Komisio",
    intro:
      "Skicka dina bilder till Komisio. Vi tar just nu emot förfrågningar från dig som bor i Sverige. Alla belopp anges i SEK.",
    confirmCountry: "Jag bor i Sverige",
    countryRequired: "Bekräfta att du bor i Sverige innan du skickar.",
    unavailable:
      "Komisio tar inte emot nya förfrågningar just nu. Ditt utkast finns kvar.",
    changed: "Mottagaren har ändrats. Kontrollera mottagaren innan du skickar.",
    continue: "Fortsätt",
    switchRecipient: "Fortsätt med Komisio",
    clearPrice:
      "Ditt tidigare önskade pris anges i en annan valuta och töms när du fortsätter.",
    reviewIntro: "Kontrollera varan och skicka dina bilder till Komisio.",
    send: "Skicka till Komisio",
    success: "Skickat till Komisio",
    waiting: "Väntar på Komisio",
    priceHint:
      "Komisio bedömer varan och ger dig ett erbjudande som du kan tacka ja eller nej till.",
  },
  en: {
    title: "Komisio",
    intro:
      "Send your photos to Komisio. We currently accept requests from residents of Sweden. All amounts are in SEK.",
    confirmCountry: "I live in Sweden",
    countryRequired: "Confirm that you live in Sweden before sending.",
    unavailable:
      "Komisio is not accepting new requests right now. Your draft is saved.",
    changed: "The recipient changed. Check the recipient before sending.",
    continue: "Continue",
    switchRecipient: "Continue with Komisio",
    clearPrice:
      "Your previous requested price is in another currency and will be cleared when you continue.",
    reviewIntro: "Check the item and send your photos to Komisio.",
    send: "Send to Komisio",
    success: "Sent to Komisio",
    waiting: "Waiting for Komisio",
    priceHint:
      "Komisio assesses the item and makes you an offer you can accept or decline.",
  },
  no: {
    title: "Komisio",
    intro:
      "Send bildene dine til Komisio. Vi tar foreløpig imot forespørsler fra personer bosatt i Sverige. Alle beløp er i SEK.",
    confirmCountry: "Jeg bor i Sverige",
    countryRequired: "Bekreft at du bor i Sverige før du sender.",
    unavailable:
      "Komisio tar ikke imot nye forespørsler akkurat nå. Utkastet er lagret.",
    changed: "Mottakeren er endret. Kontroller mottakeren før du sender.",
    continue: "Fortsett",
    switchRecipient: "Fortsett med Komisio",
    clearPrice:
      "Ditt tidligere ønskede pris er i en annen valuta og tømmes når du fortsetter.",
    reviewIntro: "Kontroller varen og send bildene til Komisio.",
    send: "Send til Komisio",
    success: "Sendt til Komisio",
    waiting: "Venter på Komisio",
    priceHint: "Komisio vurderer varen og gir deg et eget tilbud.",
  },
  da: {
    title: "Komisio",
    intro:
      "Send dine billeder til Komisio. Vi modtager foreløbig forespørgsler fra personer bosat i Sverige. Alle beløb er i SEK.",
    confirmCountry: "Jeg bor i Sverige",
    countryRequired: "Bekræft, at du bor i Sverige, før du sender.",
    unavailable:
      "Komisio modtager ikke nye forespørgsler lige nu. Din kladde er gemt.",
    changed: "Modtageren er ændret. Kontrollér modtageren, før du sender.",
    continue: "Fortsæt",
    switchRecipient: "Fortsæt med Komisio",
    clearPrice:
      "Din tidligere ønskede pris er i en anden valuta og ryddes, når du fortsætter.",
    reviewIntro: "Kontrollér varen, og send billederne til Komisio.",
    send: "Send til Komisio",
    success: "Sendt til Komisio",
    waiting: "Venter på Komisio",
    priceHint: "Komisio vurderer varen og giver dig et særskilt tilbud.",
  },
  de: {
    title: "Komisio",
    intro:
      "Sende deine Fotos an Komisio. Derzeit nehmen wir Anfragen von Personen mit Wohnsitz in Schweden an. Alle Beträge sind in SEK.",
    confirmCountry: "Ich wohne in Schweden",
    countryRequired: "Bestätige vor dem Senden, dass du in Schweden wohnst.",
    unavailable:
      "Komisio nimmt derzeit keine neuen Anfragen an. Dein Entwurf bleibt gespeichert.",
    changed:
      "Der Empfänger hat sich geändert. Prüfe den Empfänger vor dem Senden.",
    continue: "Weiter",
    switchRecipient: "Mit Komisio fortfahren",
    clearPrice:
      "Dein bisheriger Wunschpreis ist in einer anderen Währung und wird beim Fortfahren gelöscht.",
    reviewIntro: "Prüfe den Artikel und sende deine Fotos an Komisio.",
    send: "An Komisio senden",
    success: "An Komisio gesendet",
    waiting: "Wartet auf Komisio",
    priceHint:
      "Komisio bewertet den Artikel und macht dir ein separates Angebot.",
  },
  fi: {
    title: "Komisio",
    intro:
      "Lähetä kuvasi Komisiolle. Otamme tällä hetkellä vastaan pyyntöjä Ruotsissa asuvilta henkilöiltä. Kaikki summat ovat SEK-valuutassa.",
    confirmCountry: "Asun Ruotsissa",
    countryRequired: "Vahvista ennen lähettämistä, että asut Ruotsissa.",
    unavailable:
      "Komisio ei ota juuri nyt vastaan uusia pyyntöjä. Luonnoksesi on tallessa.",
    changed:
      "Vastaanottaja on muuttunut. Tarkista vastaanottaja ennen lähettämistä.",
    continue: "Jatka",
    switchRecipient: "Jatka Komision kanssa",
    clearPrice:
      "Aiempi hintatoiveesi on toisessa valuutassa ja tyhjennetään, kun jatkat.",
    reviewIntro: "Tarkista tuote ja lähetä kuvasi Komisiolle.",
    send: "Lähetä Komisiolle",
    success: "Lähetetty Komisiolle",
    waiting: "Odottaa Komisiota",
    priceHint: "Komisio arvioi tuotteen ja tekee sinulle erillisen tarjouksen.",
  },
  es: {
    title: "Komisio",
    intro:
      "Envía tus fotos a Komisio. Actualmente aceptamos solicitudes de residentes en Suecia. Todos los importes son en SEK.",
    confirmCountry: "Vivo en Suecia",
    countryRequired: "Confirma que vives en Suecia antes de enviar.",
    unavailable:
      "Komisio no acepta nuevas solicitudes en este momento. Tu borrador está guardado.",
    changed: "El destinatario ha cambiado. Compruébalo antes de enviar.",
    continue: "Continuar",
    switchRecipient: "Continuar con Komisio",
    clearPrice:
      "Tu precio deseado anterior está en otra moneda y se borrará al continuar.",
    reviewIntro: "Revisa el artículo y envía tus fotos a Komisio.",
    send: "Enviar a Komisio",
    success: "Enviado a Komisio",
    waiting: "Esperando a Komisio",
    priceHint: "Komisio valora el artículo y te hace una oferta por separado.",
  },
  it: {
    title: "Komisio",
    intro:
      "Invia le tue foto a Komisio. Al momento accettiamo richieste da residenti in Svezia. Tutti gli importi sono in SEK.",
    confirmCountry: "Vivo in Svezia",
    countryRequired: "Conferma di vivere in Svezia prima di inviare.",
    unavailable:
      "Komisio non accetta nuove richieste al momento. La bozza è salvata.",
    changed: "Il destinatario è cambiato. Controllalo prima di inviare.",
    continue: "Continua",
    switchRecipient: "Continua con Komisio",
    clearPrice:
      "Il prezzo desiderato precedente è in un’altra valuta e verrà cancellato quando continui.",
    reviewIntro: "Controlla l’articolo e invia le tue foto a Komisio.",
    send: "Invia a Komisio",
    success: "Inviato a Komisio",
    waiting: "In attesa di Komisio",
    priceHint: "Komisio valuta l’articolo e ti fa un’offerta separata.",
  },
} satisfies Record<Locale, Record<string, string>>;
export function centralIntakeCopy(locale: Locale) {
  return copies[locale];
}
