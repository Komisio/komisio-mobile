import type { Locale } from "./locale";

const sv = {
  title: "Skicka till Komisio",
  intro: "Komisio betalar frakten. Ditt avtalade belopp påverkas inte.",
  selectItems: "Välj varor till paketet",
  selectionHint:
    "Den här varan ingår. Lägg till fler godkända varor som du vill skicka samtidigt.",
  selectedCount: "{count} varor i ett paket",
  contents: "Paketets innehåll ({count})",
  address: "Din avsändaradress i Sverige",
  street: "Gatuadress",
  postalCode: "Postnummer",
  city: "Ort",
  parcel: "Det färdigpackade paketet",
  weight: "Vikt (kg)",
  length: "Längsta sidan (cm)",
  width: "Mellersta sidan (cm)",
  height: "Kortaste sidan (cm)",
  limits:
    "Väg och mät paketet. Max 20 kg och 150 cm på längsta sidan. Längd + omkrets får vara högst 300 cm.",
  book: "Hämta fraktkod",
  invalid: "Kontrollera adressen och paketets vikt och mått.",
  contactUnsupported:
    "Namnet eller e-postadressen i din profil ryms inte på PostNords fraktunderlag. Kontakta Komisio så hjälper vi dig.",
  unavailable:
    "Fraktbokningen är inte tillgänglig just nu. Försök igen senare eller kontakta Komisio.",
  error: "Fraktinformationen kunde inte hämtas.",
  pending:
    "Bokningen behöver kontrolleras. Uppdatera för att hämta resultatet. Boka inte en ny frakt på egen hand.",
  review:
    "Vi behöver kontrollera bokningen hos PostNord. Kontakta Komisio och ange paketreferensen nedan innan du skickar.",
  packageTitle: "Paket {reference}",
  sharedCode:
    "Alla {count} varor ska ligga i ett gemensamt ytterpaket. Samma QR-kod visas från varje vara och gäller bara detta paket.",
  packTogether:
    "Packa de valda varorna tillsammans i ett ytterpaket. Du får en gemensam fraktkod.",
  bookTogether: "Hämta kod för ett paket",
  code: "Fraktkod för paketet",
  instructions:
    "Ta med det förslutna paketet till ett PostNord-ombud och visa koden. Ombudet skriver ut fraktetiketten. Spara inlämningskvittot.",
  tracking: "Spåra paketet",
  recipient: "Paketet skickas till",
  sandbox: "Testbokning – använd inte koden för att skicka ett riktigt paket.",
  grouped:
    "Den här äldre inlämningen innehåller flera varor. Kontakta Komisio för att ordna frakten tillsammans.",
};
type Copy = { [K in keyof typeof sv]: string };
const copy: Record<Locale, Copy> = {
  sv,
  en: {
    title: "Ship to Komisio",
    intro: "Komisio pays for shipping. Your agreed amount stays the same.",
    selectItems: "Choose items for the parcel",
    selectionHint:
      "This item is included. Add other accepted items to send together.",
    selectedCount: "{count} items in one parcel",
    contents: "Parcel contents ({count})",
    address: "Your sender address in Sweden",
    street: "Street address",
    postalCode: "Postal code",
    city: "City",
    parcel: "Your packed parcel",
    weight: "Weight (kg)",
    length: "Longest side (cm)",
    width: "Middle side (cm)",
    height: "Shortest side (cm)",
    limits:
      "Weigh and measure the parcel. Max 20 kg and 150 cm on the longest side. Length + circumference must not exceed 300 cm.",
    book: "Get shipping code",
    invalid: "Check the address, parcel weight and dimensions.",
    contactUnsupported:
      "Your profile name or email is too long for PostNord's shipping details. Contact Komisio for help.",
    unavailable:
      "Shipping is currently unavailable. Try again later or contact Komisio.",
    error: "Could not load shipping information.",
    pending:
      "The booking needs checking. Refresh to get the result. Do not book another shipment yourself.",
    review:
      "We need to check the booking with PostNord. Contact Komisio with the parcel reference below before shipping.",
    packageTitle: "Parcel {reference}",
    sharedCode:
      "Pack all {count} items in one outer parcel. Each item shows the same QR code, which is only for this parcel.",
    packTogether:
      "Pack the selected items together in one outer parcel. You will receive one shared shipping code.",
    bookTogether: "Get code for one parcel",
    code: "Shipping code for this parcel",
    instructions:
      "Take the sealed parcel to a PostNord service point and show this code. They will print the shipping label. Keep the drop-off receipt.",
    tracking: "Track parcel",
    recipient: "Ship to",
    sandbox: "Test booking – do not use this code to send a real parcel.",
    grouped:
      "This older handover contains several items. Contact Komisio to arrange shipping together.",
  },
  no: {
    title: "Send til Komisio",
    intro: "Komisio betaler frakten. Det avtalte beløpet ditt endres ikke.",
    selectItems: "Velg varer til pakken",
    selectionHint:
      "Denne varen er med. Legg til flere godkjente varer du vil sende sammen.",
    selectedCount: "{count} varer i én pakke",
    contents: "Pakkens innhold ({count})",
    address: "Din avsenderadresse i Sverige",
    street: "Gateadresse",
    postalCode: "Postnummer",
    city: "Poststed",
    parcel: "Den ferdigpakkede pakken",
    weight: "Vekt (kg)",
    length: "Lengste side (cm)",
    width: "Mellomste side (cm)",
    height: "Korteste side (cm)",
    limits:
      "Vei og mål pakken. Maks 20 kg og 150 cm på lengste side. Lengde + omkrets kan være høyst 300 cm.",
    book: "Hent fraktkode",
    invalid: "Kontroller adressen, pakkens vekt og mål.",
    contactUnsupported:
      "Navnet eller e-postadressen i profilen din er for lang for PostNords fraktopplysninger. Kontakt Komisio for hjelp.",
    unavailable:
      "Fraktbestilling er ikke tilgjengelig nå. Prøv senere eller kontakt Komisio.",
    error: "Kunne ikke hente fraktinformasjon.",
    pending:
      "Bestillingen må kontrolleres. Oppdater for å hente resultatet. Ikke bestill en ny frakt selv.",
    review:
      "Vi må kontrollere bestillingen hos PostNord. Kontakt Komisio med pakkereferansen nedenfor før du sender.",
    packageTitle: "Pakke {reference}",
    sharedCode:
      "Alle {count} varene skal ligge i én felles ytterpakke. Den samme QR-koden vises fra hver vare og gjelder bare denne pakken.",
    packTogether:
      "Pakk de valgte varene sammen i én ytterpakke. Du får én felles fraktkode.",
    bookTogether: "Hent kode for én pakke",
    code: "Fraktkode for pakken",
    instructions:
      "Ta den lukkede pakken til et PostNord-utleveringssted og vis koden. De skriver ut fraktetiketten. Ta vare på innleveringskvitteringen.",
    tracking: "Spor pakken",
    recipient: "Pakken sendes til",
    sandbox: "Testbestilling – ikke bruk koden til å sende en ekte pakke.",
    grouped:
      "Denne eldre innleveringen inneholder flere varer. Kontakt Komisio for å ordne frakten samlet.",
  },
  da: {
    title: "Send til Komisio",
    intro: "Komisio betaler fragten. Dit aftalte beløb ændres ikke.",
    selectItems: "Vælg varer til pakken",
    selectionHint:
      "Denne vare er med. Tilføj flere godkendte varer, du vil sende sammen.",
    selectedCount: "{count} varer i én pakke",
    contents: "Pakkens indhold ({count})",
    address: "Din afsenderadresse i Sverige",
    street: "Adresse",
    postalCode: "Postnummer",
    city: "By",
    parcel: "Den færdigpakkede pakke",
    weight: "Vægt (kg)",
    length: "Længste side (cm)",
    width: "Mellemste side (cm)",
    height: "Korteste side (cm)",
    limits:
      "Vej og mål pakken. Maks. 20 kg og 150 cm på længste side. Længde + omkreds må højst være 300 cm.",
    book: "Hent fragtkode",
    invalid: "Kontrollér adressen og pakkens vægt og mål.",
    contactUnsupported:
      "Navnet eller e-mailadressen i din profil er for lang til PostNords fragtoplysninger. Kontakt Komisio for hjælp.",
    unavailable:
      "Fragtbestilling er ikke tilgængelig nu. Prøv senere, eller kontakt Komisio.",
    error: "Fragtinformationen kunne ikke hentes.",
    pending:
      "Bestillingen skal kontrolleres. Opdater for at hente resultatet. Bestil ikke selv en ny fragt.",
    review:
      "Vi skal kontrollere bestillingen hos PostNord. Kontakt Komisio med pakkereferencen nedenfor, før du sender.",
    packageTitle: "Pakke {reference}",
    sharedCode:
      "Alle {count} varer skal ligge i én fælles yderpakke. Samme QR-kode vises fra hver vare og gælder kun denne pakke.",
    packTogether:
      "Pak de valgte varer sammen i én yderpakke. Du får én fælles fragtkode.",
    bookTogether: "Hent kode til én pakke",
    code: "Fragtkode til pakken",
    instructions:
      "Tag den lukkede pakke til et PostNord-indleveringssted, og vis koden. De udskriver fragtetiketten. Gem indleveringskvitteringen.",
    tracking: "Spor pakken",
    recipient: "Pakken sendes til",
    sandbox: "Testbestilling – brug ikke koden til at sende en rigtig pakke.",
    grouped:
      "Denne ældre indlevering indeholder flere varer. Kontakt Komisio for at arrangere fragten samlet.",
  },
  fi: {
    title: "Lähetä Komisioon",
    intro: "Komisio maksaa toimituksen. Sovittu korvauksesi ei muutu.",
    selectItems: "Valitse paketin tuotteet",
    selectionHint:
      "Tämä tuote on mukana. Lisää muita hyväksyttyjä tuotteita samaan lähetykseen.",
    selectedCount: "{count} tuotetta yhdessä paketissa",
    contents: "Paketin sisältö ({count})",
    address: "Lähettäjän osoitteesi Ruotsissa",
    street: "Katuosoite",
    postalCode: "Postinumero",
    city: "Postitoimipaikka",
    parcel: "Valmiiksi pakattu paketti",
    weight: "Paino (kg)",
    length: "Pisin sivu (cm)",
    width: "Keskipitkä sivu (cm)",
    height: "Lyhin sivu (cm)",
    limits:
      "Punnitse ja mittaa paketti. Enintään 20 kg ja pisin sivu 150 cm. Pituus + ympärysmitta enintään 300 cm.",
    book: "Hae lähetyskoodi",
    invalid: "Tarkista osoite sekä paketin paino ja mitat.",
    contactUnsupported:
      "Profiilisi nimi tai sähköpostiosoite on liian pitkä PostNordin lähetystietoihin. Ota yhteyttä Komisioon.",
    unavailable:
      "Lähetyksen varaus ei ole nyt käytettävissä. Yritä myöhemmin tai ota yhteyttä Komisioon.",
    error: "Lähetystietoja ei voitu hakea.",
    pending:
      "Varaus täytyy tarkistaa. Päivitä tuloksen hakemiseksi. Älä varaa itse uutta lähetystä.",
    review:
      "Meidän täytyy tarkistaa varaus PostNordilta. Ota yhteyttä Komisioon alla olevalla pakettiviitteellä ennen lähettämistä.",
    packageTitle: "Paketti {reference}",
    sharedCode:
      "Pakkaa kaikki {count} tuotetta yhteen ulkopakkaukseen. Jokaisen tuotteen kohdalla näkyy sama QR-koodi, joka koskee vain tätä pakettia.",
    packTogether:
      "Pakkaa valitut tuotteet samaan ulkopakkaukseen. Saat yhden yhteisen lähetyskoodin.",
    bookTogether: "Hae koodi yhdelle paketille",
    code: "Tämän paketin lähetyskoodi",
    instructions:
      "Vie suljettu paketti PostNordin palvelupisteeseen ja näytä koodi. Palvelupiste tulostaa osoitekortin. Säilytä lähetyskuitti.",
    tracking: "Seuraa pakettia",
    recipient: "Paketin vastaanottaja",
    sandbox: "Testivaraus – älä käytä koodia oikean paketin lähettämiseen.",
    grouped:
      "Tämä aiempi toimitus sisältää useita tuotteita. Ota yhteyttä Komisioon yhteisen toimituksen järjestämiseksi.",
  },
  de: {
    title: "An Komisio senden",
    intro: "Komisio zahlt den Versand. Dein vereinbarter Betrag bleibt gleich.",
    selectItems: "Artikel für das Paket wählen",
    selectionHint:
      "Dieser Artikel ist dabei. Füge weitere angenommene Artikel für den gemeinsamen Versand hinzu.",
    selectedCount: "{count} Artikel in einem Paket",
    contents: "Paketinhalt ({count})",
    address: "Deine Absenderadresse in Schweden",
    street: "Straße und Hausnummer",
    postalCode: "Postleitzahl",
    city: "Ort",
    parcel: "Das fertig gepackte Paket",
    weight: "Gewicht (kg)",
    length: "Längste Seite (cm)",
    width: "Mittlere Seite (cm)",
    height: "Kürzeste Seite (cm)",
    limits:
      "Wiege und miss das Paket. Max. 20 kg und 150 cm an der längsten Seite. Länge + Umfang höchstens 300 cm.",
    book: "Versandcode abrufen",
    invalid: "Prüfe Adresse, Gewicht und Paketmaße.",
    contactUnsupported:
      "Dein Profilname oder deine E-Mail-Adresse ist zu lang für PostNords Versanddaten. Kontaktiere Komisio für Hilfe.",
    unavailable:
      "Versandbuchung derzeit nicht verfügbar. Versuche es später oder kontaktiere Komisio.",
    error: "Versandinformationen konnten nicht geladen werden.",
    pending:
      "Die Buchung muss geprüft werden. Aktualisiere für das Ergebnis. Buche nicht selbst einen weiteren Versand.",
    review:
      "Wir müssen die Buchung bei PostNord prüfen. Kontaktiere Komisio vor dem Versand mit der folgenden Paketreferenz.",
    packageTitle: "Paket {reference}",
    sharedCode:
      "Verpacke alle {count} Artikel in einem gemeinsamen Außenpaket. Bei jedem Artikel erscheint derselbe QR-Code, der nur für dieses Paket gilt.",
    packTogether:
      "Verpacke die ausgewählten Artikel gemeinsam in einem Außenpaket. Du erhältst einen gemeinsamen Versandcode.",
    bookTogether: "Code für ein Paket abrufen",
    code: "Versandcode für dieses Paket",
    instructions:
      "Bringe das verschlossene Paket zu einer PostNord-Annahmestelle und zeige den Code. Dort wird das Versandetikett gedruckt. Bewahre den Einlieferungsbeleg auf.",
    tracking: "Paket verfolgen",
    recipient: "Empfänger",
    sandbox: "Testbuchung – verwende den Code nicht für ein echtes Paket.",
    grouped:
      "Diese ältere Abgabe enthält mehrere Artikel. Kontaktiere Komisio, um den gemeinsamen Versand zu vereinbaren.",
  },
  es: {
    title: "Enviar a Komisio",
    intro: "Komisio paga el envío. Tu importe acordado no cambia.",
    selectItems: "Elige los artículos del paquete",
    selectionHint:
      "Este artículo está incluido. Añade otros artículos aceptados para enviarlos juntos.",
    selectedCount: "{count} artículos en un paquete",
    contents: "Contenido del paquete ({count})",
    address: "Tu dirección de remitente en Suecia",
    street: "Dirección",
    postalCode: "Código postal",
    city: "Ciudad",
    parcel: "El paquete preparado",
    weight: "Peso (kg)",
    length: "Lado más largo (cm)",
    width: "Lado intermedio (cm)",
    height: "Lado más corto (cm)",
    limits:
      "Pesa y mide el paquete. Máximo 20 kg y 150 cm en el lado más largo. Longitud + perímetro: máximo 300 cm.",
    book: "Obtener código de envío",
    invalid: "Comprueba la dirección, el peso y las medidas.",
    contactUnsupported:
      "El nombre o correo de tu perfil es demasiado largo para los datos de envío de PostNord. Contacta con Komisio.",
    unavailable:
      "La reserva de envío no está disponible. Inténtalo más tarde o contacta con Komisio.",
    error: "No se pudo cargar la información de envío.",
    pending:
      "La reserva debe comprobarse. Actualiza para obtener el resultado. No reserves otro envío por tu cuenta.",
    review:
      "Debemos comprobar la reserva con PostNord. Contacta con Komisio con la referencia siguiente antes de enviar.",
    packageTitle: "Paquete {reference}",
    sharedCode:
      "Coloca los {count} artículos en un único paquete exterior. Cada artículo muestra el mismo código QR, válido solo para este paquete.",
    packTogether:
      "Coloca los artículos seleccionados juntos en un único paquete exterior. Recibirás un solo código de envío.",
    bookTogether: "Obtener código para un paquete",
    code: "Código de envío de este paquete",
    instructions:
      "Lleva el paquete cerrado a un punto de PostNord y muestra el código. Allí imprimirán la etiqueta. Guarda el resguardo de entrega.",
    tracking: "Seguir paquete",
    recipient: "Destinatario",
    sandbox:
      "Reserva de prueba: no uses el código para enviar un paquete real.",
    grouped:
      "Esta entrega anterior contiene varios artículos. Contacta con Komisio para organizar el envío conjunto.",
  },
  it: {
    title: "Spedisci a Komisio",
    intro: "Komisio paga la spedizione. Il tuo importo concordato non cambia.",
    selectItems: "Scegli gli articoli del pacco",
    selectionHint:
      "Questo articolo è incluso. Aggiungi altri articoli accettati da spedire insieme.",
    selectedCount: "{count} articoli in un pacco",
    contents: "Contenuto del pacco ({count})",
    address: "Il tuo indirizzo di mittente in Svezia",
    street: "Indirizzo",
    postalCode: "CAP",
    city: "Città",
    parcel: "Il pacco pronto",
    weight: "Peso (kg)",
    length: "Lato più lungo (cm)",
    width: "Lato intermedio (cm)",
    height: "Lato più corto (cm)",
    limits:
      "Pesa e misura il pacco. Massimo 20 kg e 150 cm sul lato più lungo. Lunghezza + circonferenza: massimo 300 cm.",
    book: "Ottieni codice di spedizione",
    invalid: "Controlla indirizzo, peso e dimensioni del pacco.",
    contactUnsupported:
      "Il nome o l'indirizzo email del profilo è troppo lungo per i dati di spedizione PostNord. Contatta Komisio.",
    unavailable:
      "La prenotazione non è disponibile. Riprova più tardi o contatta Komisio.",
    error: "Impossibile caricare le informazioni di spedizione.",
    pending:
      "La prenotazione va verificata. Aggiorna per vedere il risultato. Non prenotare un’altra spedizione autonomamente.",
    review:
      "Dobbiamo verificare la prenotazione con PostNord. Contatta Komisio con il riferimento seguente prima di spedire.",
    packageTitle: "Pacco {reference}",
    sharedCode:
      "Metti tutti i {count} articoli in un unico imballaggio esterno. Ogni articolo mostra lo stesso codice QR, valido solo per questo pacco.",
    packTogether:
      "Imballa insieme gli articoli selezionati in un unico pacco. Riceverai un solo codice di spedizione.",
    bookTogether: "Ottieni il codice per un pacco",
    code: "Codice di spedizione del pacco",
    instructions:
      "Porta il pacco chiuso a un punto PostNord e mostra il codice. Stamperanno l’etichetta. Conserva la ricevuta di consegna.",
    tracking: "Traccia il pacco",
    recipient: "Destinatario del pacco",
    sandbox: "Prenotazione di prova: non usare il codice per un pacco reale.",
    grouped:
      "Questa consegna precedente contiene più articoli. Contatta Komisio per organizzare la spedizione insieme.",
  },
};
export const centralShippingCopy = (locale: Locale): Copy => copy[locale];
