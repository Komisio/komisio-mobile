import type { Locale } from "./locale";
import type { ItemCondition } from "./item-draft-details";
const sv = {
  storeTitle: "Välj butik",
  storeIntro: "Välj butiken som du vill erbjuda din vara till.",
  storeEmpty:
    "Ingen butik matchar just nu. Ditt utkast finns kvar, så du kan försöka senare.",
  unavailable:
    "Fotoförfrågningar är inte öppna ännu. Ditt utkast finns kvar på den här enheten.",
  more: "Fler butiker",
  previous: "Föregående",
  choose: "Välj {name}",
  detailsTitle: "Om varan",
  detailsIntro: "Beskriv varan kort och visa gärna eventuella skador på bild.",
  description: "Vad är det?",
  brand: "Märke (valfritt)",
  condition: "Skick",
  notes: "Mer om varan (valfritt)",
  desiredPrice: "Önskat försäljningspris (valfritt), {currency}",
  priceHint:
    "Butiken bestämmer försäljningspriset och lämnar ett separat erbjudande till dig.",
  reviewTitle: "Ditt utkast",
  review: "Granska varan",
  changeStore: "Byt butik",
  editPhotos: "Ändra bilder",
  editDetails: "Ändra uppgifter",
  save: "Spara utkast",
  unsaved: "Du har osparade ändringar.",
  requiredDescription: "Beskriv vad det är för vara.",
  requiredCondition: "Välj vilket skick varan är i.",
  invalidPrice:
    "Ange ett positivt pris med högst två decimaler, eller lämna fältet tomt.",
  changed:
    "Utkastet har ändrats i en annan vy. Öppna det igen innan du fortsätter.",
  noPhotos: "Börja med minst en bild av varan.",
  notReceiving:
    "Butiken tar inte längre emot nya förfrågningar. Välj en annan butik.",
  currencyTitle: "Byta butik och valuta?",
  currencyMessage:
    "Den nya butiken använder {currency}. Ditt önskade pris behöver anges på nytt.",
  confirmCurrency: "Byt butik och töm priset",
  leaveTitle: "Spara ändringarna?",
  leaveMessage: "Dina senaste ändringar är inte sparade.",
  discard: "Lämna utan att spara",
  saveAndLeave: "Spara och lämna",
  conditions: {
    like_new: "Nyskick",
    very_good: "Mycket gott",
    good: "Gott",
    worn: "Slitet",
  } as Record<ItemCondition, string>,
};
type Copy = { [K in Exclude<keyof typeof sv, "conditions">]: string } & {
  conditions: Record<ItemCondition, string>;
};
const copies: Record<Locale, Copy> = {
  sv,
  en: {
    storeTitle: "Choose a store",
    storeIntro: "Choose the store you would like to offer your item to.",
    storeEmpty:
      "No stores match right now. Your draft is saved, so you can try later.",
    unavailable:
      "Photo requests are not open yet. Your draft is still on this device.",
    more: "More stores",
    previous: "Previous",
    choose: "Choose {name}",
    detailsTitle: "About the item",
    detailsIntro: "Describe the item briefly and include photos of any damage.",
    description: "What is it?",
    brand: "Brand (optional)",
    condition: "Condition",
    notes: "More about the item (optional)",
    desiredPrice: "Desired selling price (optional), {currency}",
    priceHint:
      "The store sets the selling price and makes a separate offer to you.",
    reviewTitle: "Your draft",
    review: "Review item",
    changeStore: "Change store",
    editPhotos: "Edit photos",
    editDetails: "Edit details",
    save: "Save draft",
    unsaved: "You have unsaved changes.",
    requiredDescription: "Describe what the item is.",
    requiredCondition: "Choose the item's condition.",
    invalidPrice:
      "Enter a positive price with up to two decimal places, or leave it blank.",
    changed: "The draft changed in another view. Reopen it before continuing.",
    noPhotos: "Start with at least one photo of the item.",
    notReceiving:
      "This store no longer accepts new requests. Choose another store.",
    currencyTitle: "Change store and currency?",
    currencyMessage:
      "The new store uses {currency}. You will need to enter your desired price again.",
    confirmCurrency: "Change store and clear price",
    leaveTitle: "Save changes?",
    leaveMessage: "Your latest changes have not been saved.",
    discard: "Leave without saving",
    saveAndLeave: "Save and leave",
    conditions: {
      like_new: "Like new",
      very_good: "Very good",
      good: "Good",
      worn: "Worn",
    },
  },
  no: {
    storeTitle: "Velg butikk",
    storeIntro: "Velg butikken du vil tilby varen din til.",
    storeEmpty:
      "Ingen butikker passer akkurat nå. Utkastet er lagret, så du kan prøve senere.",
    unavailable:
      "Fotoforespørsler er ikke åpnet ennå. Utkastet ligger fortsatt på denne enheten.",
    more: "Flere butikker",
    previous: "Forrige",
    choose: "Velg {name}",
    detailsTitle: "Om varen",
    detailsIntro:
      "Beskriv varen kort og legg gjerne ved bilder av eventuelle skader.",
    description: "Hva er det?",
    brand: "Merke (valgfritt)",
    condition: "Tilstand",
    notes: "Mer om varen (valgfritt)",
    desiredPrice: "Ønsket salgspris (valgfritt), {currency}",
    priceHint: "Butikken bestemmer salgsprisen og gir deg et eget tilbud.",
    reviewTitle: "Utkastet ditt",
    review: "Se over varen",
    changeStore: "Bytt butikk",
    editPhotos: "Endre bilder",
    editDetails: "Endre opplysninger",
    save: "Lagre utkast",
    unsaved: "Du har ulagrede endringer.",
    requiredDescription: "Beskriv hva slags vare det er.",
    requiredCondition: "Velg varens tilstand.",
    invalidPrice:
      "Angi en positiv pris med høyst to desimaler, eller la feltet stå tomt.",
    changed:
      "Utkastet er endret i en annen visning. Åpne det på nytt før du fortsetter.",
    noPhotos: "Start med minst ett bilde av varen.",
    notReceiving:
      "Butikken tar ikke lenger imot nye forespørsler. Velg en annen butikk.",
    currencyTitle: "Bytte butikk og valuta?",
    currencyMessage:
      "Den nye butikken bruker {currency}. Du må angi ønsket pris på nytt.",
    confirmCurrency: "Bytt butikk og tøm prisen",
    leaveTitle: "Lagre endringene?",
    leaveMessage: "De siste endringene er ikke lagret.",
    discard: "Forlat uten å lagre",
    saveAndLeave: "Lagre og forlat",
    conditions: {
      like_new: "Som ny",
      very_good: "Svært god",
      good: "God",
      worn: "Slitt",
    },
  },
  da: {
    storeTitle: "Vælg butik",
    storeIntro: "Vælg den butik, du vil tilbyde din vare til.",
    storeEmpty:
      "Ingen butikker matcher lige nu. Dit udkast er gemt, så du kan prøve senere.",
    unavailable:
      "Fotoforespørgsler er ikke åbnet endnu. Dit udkast er stadig på denne enhed.",
    more: "Flere butikker",
    previous: "Forrige",
    choose: "Vælg {name}",
    detailsTitle: "Om varen",
    detailsIntro:
      "Beskriv varen kort og tilføj gerne billeder af eventuelle skader.",
    description: "Hvad er det?",
    brand: "Mærke (valgfrit)",
    condition: "Stand",
    notes: "Mere om varen (valgfrit)",
    desiredPrice: "Ønsket salgspris (valgfrit), {currency}",
    priceHint:
      "Butikken bestemmer salgsprisen og giver dig et særskilt tilbud.",
    reviewTitle: "Dit udkast",
    review: "Gennemse varen",
    changeStore: "Skift butik",
    editPhotos: "Rediger billeder",
    editDetails: "Rediger oplysninger",
    save: "Gem udkast",
    unsaved: "Du har ændringer, der ikke er gemt.",
    requiredDescription: "Beskriv, hvad det er for en vare.",
    requiredCondition: "Vælg varens stand.",
    invalidPrice:
      "Angiv en positiv pris med højst to decimaler, eller lad feltet være tomt.",
    changed:
      "Udkastet er ændret i en anden visning. Åbn det igen, før du fortsætter.",
    noPhotos: "Start med mindst ét billede af varen.",
    notReceiving:
      "Butikken modtager ikke længere nye forespørgsler. Vælg en anden butik.",
    currencyTitle: "Skift butik og valuta?",
    currencyMessage:
      "Den nye butik bruger {currency}. Du skal angive din ønskede pris igen.",
    confirmCurrency: "Skift butik og ryd prisen",
    leaveTitle: "Gem ændringerne?",
    leaveMessage: "Dine seneste ændringer er ikke gemt.",
    discard: "Forlad uden at gemme",
    saveAndLeave: "Gem og forlad",
    conditions: {
      like_new: "Som ny",
      very_good: "Meget god",
      good: "God",
      worn: "Slidt",
    },
  },
  fi: {
    storeTitle: "Valitse myymälä",
    storeIntro: "Valitse myymälä, jolle haluat tarjota tuotettasi.",
    storeEmpty:
      "Sopivia myymälöitä ei juuri nyt löytynyt. Luonnoksesi on tallessa, joten voit yrittää myöhemmin.",
    unavailable:
      "Kuvalliset tuotepyynnöt eivät ole vielä käytössä. Luonnos on edelleen tällä laitteella.",
    more: "Lisää myymälöitä",
    previous: "Edellinen",
    choose: "Valitse {name}",
    detailsTitle: "Tietoa tuotteesta",
    detailsIntro:
      "Kuvaile tuote lyhyesti ja lisää kuvia mahdollisista vaurioista.",
    description: "Mikä tuote on kyseessä?",
    brand: "Merkki (valinnainen)",
    condition: "Kunto",
    notes: "Lisätiedot (valinnainen)",
    desiredPrice: "Toivottu myyntihinta (valinnainen), {currency}",
    priceHint:
      "Myymälä päättää myyntihinnan ja tekee sinulle erillisen tarjouksen.",
    reviewTitle: "Luonnoksesi",
    review: "Tarkista tuote",
    changeStore: "Vaihda myymälää",
    editPhotos: "Muokkaa kuvia",
    editDetails: "Muokkaa tietoja",
    save: "Tallenna luonnos",
    unsaved: "Sinulla on tallentamattomia muutoksia.",
    requiredDescription: "Kerro, mikä tuote on kyseessä.",
    requiredCondition: "Valitse tuotteen kunto.",
    invalidPrice:
      "Syötä positiivinen hinta enintään kahdella desimaalilla tai jätä kenttä tyhjäksi.",
    changed:
      "Luonnosta on muutettu toisessa näkymässä. Avaa se uudelleen ennen jatkamista.",
    noPhotos: "Aloita vähintään yhdellä tuotekuvalla.",
    notReceiving:
      "Myymälä ei enää vastaanota uusia pyyntöjä. Valitse toinen myymälä.",
    currencyTitle: "Vaihda myymälää ja valuuttaa?",
    currencyMessage:
      "Uuden myymälän valuutta on {currency}. Toivottu hinta on syötettävä uudelleen.",
    confirmCurrency: "Vaihda myymälää ja tyhjennä hinta",
    leaveTitle: "Tallennetaanko muutokset?",
    leaveMessage: "Viimeisimpiä muutoksiasi ei ole tallennettu.",
    discard: "Poistu tallentamatta",
    saveAndLeave: "Tallenna ja poistu",
    conditions: {
      like_new: "Uudenveroinen",
      very_good: "Erittäin hyvä",
      good: "Hyvä",
      worn: "Kulunut",
    },
  },
  de: {
    storeTitle: "Geschäft auswählen",
    storeIntro: "Wähle das Geschäft, dem du deinen Artikel anbieten möchtest.",
    storeEmpty:
      "Derzeit passt kein Geschäft. Dein Entwurf ist gespeichert; versuche es später erneut.",
    unavailable:
      "Fotoanfragen sind noch nicht verfügbar. Dein Entwurf bleibt auf diesem Gerät.",
    more: "Weitere Geschäfte",
    previous: "Zurück",
    choose: "{name} auswählen",
    detailsTitle: "Zum Artikel",
    detailsIntro:
      "Beschreibe den Artikel kurz und zeige mögliche Schäden auf Fotos.",
    description: "Was ist es?",
    brand: "Marke (optional)",
    condition: "Zustand",
    notes: "Weitere Angaben (optional)",
    desiredPrice: "Gewünschter Verkaufspreis (optional), {currency}",
    priceHint:
      "Das Geschäft legt den Verkaufspreis fest und macht dir ein separates Angebot.",
    reviewTitle: "Dein Entwurf",
    review: "Artikel prüfen",
    changeStore: "Geschäft wechseln",
    editPhotos: "Fotos bearbeiten",
    editDetails: "Angaben bearbeiten",
    save: "Entwurf speichern",
    unsaved: "Du hast ungespeicherte Änderungen.",
    requiredDescription: "Beschreibe, um welchen Artikel es sich handelt.",
    requiredCondition: "Wähle den Zustand des Artikels.",
    invalidPrice:
      "Gib einen positiven Preis mit höchstens zwei Nachkommastellen ein oder lasse das Feld leer.",
    changed:
      "Der Entwurf wurde in einer anderen Ansicht geändert. Öffne ihn erneut, bevor du fortfährst.",
    noPhotos: "Beginne mit mindestens einem Foto des Artikels.",
    notReceiving:
      "Dieses Geschäft nimmt keine neuen Anfragen mehr an. Wähle ein anderes Geschäft.",
    currencyTitle: "Geschäft und Währung wechseln?",
    currencyMessage:
      "Das neue Geschäft verwendet {currency}. Deinen Wunschpreis musst du erneut eingeben.",
    confirmCurrency: "Geschäft wechseln und Preis leeren",
    leaveTitle: "Änderungen speichern?",
    leaveMessage: "Deine letzten Änderungen wurden nicht gespeichert.",
    discard: "Ohne Speichern verlassen",
    saveAndLeave: "Speichern und verlassen",
    conditions: {
      like_new: "Wie neu",
      very_good: "Sehr gut",
      good: "Gut",
      worn: "Abgenutzt",
    },
  },
  es: {
    storeTitle: "Elige una tienda",
    storeIntro: "Elige la tienda a la que quieres ofrecer tu artículo.",
    storeEmpty:
      "No hay tiendas que coincidan ahora. Tu borrador está guardado; puedes intentarlo más tarde.",
    unavailable:
      "Las solicitudes con fotos aún no están disponibles. Tu borrador sigue en este dispositivo.",
    more: "Más tiendas",
    previous: "Anterior",
    choose: "Elegir {name}",
    detailsTitle: "Sobre el artículo",
    detailsIntro:
      "Describe brevemente el artículo y añade fotos de los posibles daños.",
    description: "¿Qué es?",
    brand: "Marca (opcional)",
    condition: "Estado",
    notes: "Más información (opcional)",
    desiredPrice: "Precio de venta deseado (opcional), {currency}",
    priceHint:
      "La tienda fija el precio de venta y te hace una oferta por separado.",
    reviewTitle: "Tu borrador",
    review: "Revisar artículo",
    changeStore: "Cambiar de tienda",
    editPhotos: "Editar fotos",
    editDetails: "Editar información",
    save: "Guardar borrador",
    unsaved: "Tienes cambios sin guardar.",
    requiredDescription: "Describe de qué artículo se trata.",
    requiredCondition: "Elige el estado del artículo.",
    invalidPrice:
      "Introduce un precio positivo con hasta dos decimales o deja el campo vacío.",
    changed:
      "El borrador ha cambiado en otra vista. Vuelve a abrirlo antes de continuar.",
    noPhotos: "Empieza con al menos una foto del artículo.",
    notReceiving:
      "Esta tienda ya no acepta nuevas solicitudes. Elige otra tienda.",
    currencyTitle: "¿Cambiar de tienda y moneda?",
    currencyMessage:
      "La nueva tienda usa {currency}. Tendrás que introducir de nuevo el precio deseado.",
    confirmCurrency: "Cambiar de tienda y borrar precio",
    leaveTitle: "¿Guardar los cambios?",
    leaveMessage: "Tus últimos cambios no se han guardado.",
    discard: "Salir sin guardar",
    saveAndLeave: "Guardar y salir",
    conditions: {
      like_new: "Como nuevo",
      very_good: "Muy bueno",
      good: "Bueno",
      worn: "Desgastado",
    },
  },
  it: {
    storeTitle: "Scegli un negozio",
    storeIntro: "Scegli il negozio a cui vuoi proporre il tuo articolo.",
    storeEmpty:
      "Nessun negozio corrisponde al momento. La bozza è salvata; puoi riprovare più tardi.",
    unavailable:
      "Le richieste con foto non sono ancora disponibili. La bozza rimane su questo dispositivo.",
    more: "Altri negozi",
    previous: "Precedente",
    choose: "Scegli {name}",
    detailsTitle: "Informazioni sull'articolo",
    detailsIntro:
      "Descrivi brevemente l'articolo e aggiungi foto di eventuali danni.",
    description: "Di che cosa si tratta?",
    brand: "Marca (facoltativa)",
    condition: "Condizioni",
    notes: "Altre informazioni (facoltative)",
    desiredPrice: "Prezzo di vendita desiderato (facoltativo), {currency}",
    priceHint:
      "Il negozio stabilisce il prezzo di vendita e ti fa un'offerta separata.",
    reviewTitle: "La tua bozza",
    review: "Controlla l'articolo",
    changeStore: "Cambia negozio",
    editPhotos: "Modifica foto",
    editDetails: "Modifica informazioni",
    save: "Salva bozza",
    unsaved: "Hai modifiche non salvate.",
    requiredDescription: "Descrivi di quale articolo si tratta.",
    requiredCondition: "Scegli le condizioni dell'articolo.",
    invalidPrice:
      "Inserisci un prezzo positivo con al massimo due decimali oppure lascia vuoto il campo.",
    changed:
      "La bozza è cambiata in un'altra schermata. Riaprila prima di continuare.",
    noPhotos: "Inizia con almeno una foto dell'articolo.",
    notReceiving:
      "Questo negozio non accetta più nuove richieste. Scegli un altro negozio.",
    currencyTitle: "Cambiare negozio e valuta?",
    currencyMessage:
      "Il nuovo negozio usa {currency}. Dovrai inserire nuovamente il prezzo desiderato.",
    confirmCurrency: "Cambia negozio e cancella prezzo",
    leaveTitle: "Salvare le modifiche?",
    leaveMessage: "Le ultime modifiche non sono state salvate.",
    discard: "Esci senza salvare",
    saveAndLeave: "Salva ed esci",
    conditions: {
      like_new: "Come nuovo",
      very_good: "Ottime",
      good: "Buone",
      worn: "Usurato",
    },
  },
};
export function itemDraftCopy(locale: Locale): Copy {
  return copies[locale];
}
