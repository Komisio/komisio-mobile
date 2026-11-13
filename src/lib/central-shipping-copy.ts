import type { Locale } from "./locale";

const sv = {
  title: "Skicka till Komisio",
  intro:
    "Packa en vara per paket. Komisio betalar frakten – ditt avtalade belopp påverkas inte.",
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
  code: "Din fraktkod hos PostNord",
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
    intro:
      "Pack one item per parcel. Komisio pays for shipping – your agreed amount stays the same.",
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
    code: "Your PostNord shipping code",
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
    intro:
      "Pakk én vare per pakke. Komisio betaler frakten – det avtalte beløpet ditt endres ikke.",
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
    code: "Din fraktkode hos PostNord",
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
    intro:
      "Pak én vare pr. pakke. Komisio betaler fragten – dit aftalte beløb ændres ikke.",
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
    code: "Din fragtkode hos PostNord",
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
    intro:
      "Pakkaa yksi tuote pakettia kohden. Komisio maksaa toimituksen – sovittu korvauksesi ei muutu.",
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
    code: "PostNordin lähetyskoodisi",
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
    intro:
      "Packe einen Artikel pro Paket. Komisio zahlt den Versand – dein vereinbarter Betrag bleibt gleich.",
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
    code: "Dein PostNord-Versandcode",
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
    intro:
      "Empaqueta un artículo por paquete. Komisio paga el envío; tu importe acordado no cambia.",
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
    code: "Tu código de envío de PostNord",
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
    intro:
      "Imballa un articolo per pacco. Komisio paga la spedizione: l’importo concordato non cambia.",
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
    code: "Il tuo codice di spedizione PostNord",
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
