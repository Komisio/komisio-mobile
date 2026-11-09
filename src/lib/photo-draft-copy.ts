import type { Locale } from "./locale";

const sv = {
  entry: "Prova fotoinlämning",
  title: "Fota en vara",
  intro: "Ett utkast på den här enheten. Inget skickas till någon butik ännu.",
  empty: "Börja med en bild av hela varan",
  tips: "Lägg gärna till bilder på märke, etikett och eventuella skador.",
  count: "{count} av 8 bilder",
  camera: "Ta en bild",
  library: "Välj bilder",
  saved: "Utkastet är sparat på den här enheten.",
  working: "Sparar bilder…",
  remove: "Ta bort bild {count}",
  clear: "Radera utkast",
  clearTitle: "Radera fotoutkastet?",
  clearBody:
    "Bilderna tas bort från utkastet. Originalen i ditt bildbibliotek påverkas inte.",
  keep: "Behåll utkastet",
  error: "Det gick inte att läsa eller spara utkastet. Försök igen.",
  limit: "Du kan ha högst 8 bilder. Ta bort en bild för att lägga till en ny.",
  invalid: "Bilden kunde inte läggas till. Välj en annan bild, högst 25 MB.",
  denied:
    "Tillåt kameraåtkomst för att ta en bild. Du kan också välja från dina bilder.",
  settings: "Öppna inställningar",
};
type Copy = { [K in keyof typeof sv]: string };
const copies: Record<Locale, Copy> = {
  sv,
  en: {
    entry: "Try photo intake",
    title: "Photograph an item",
    intro: "A draft on this device. Nothing is sent to a store yet.",
    empty: "Start with a photo of the whole item",
    tips: "Add photos of the brand, label and any damage.",
    count: "{count} of 8 photos",
    camera: "Take a photo",
    library: "Choose photos",
    saved: "Your draft is saved on this device.",
    working: "Saving photos…",
    remove: "Remove photo {count}",
    clear: "Delete draft",
    clearTitle: "Delete the photo draft?",
    clearBody:
      "Photos will be removed from the draft. Originals in your photo library are unaffected.",
    keep: "Keep draft",
    error: "The draft could not be read or saved. Please try again.",
    limit: "You can have up to 8 photos. Remove one to add another.",
    invalid: "The photo could not be added. Choose another image, up to 25 MB.",
    denied:
      "Allow camera access to take a photo. You can also choose from your photos.",
    settings: "Open settings",
  },
  no: {
    entry: "Prøv fotoinnlevering",
    title: "Ta bilde av en vare",
    intro: "Et utkast på denne enheten. Ingenting sendes til en butikk ennå.",
    empty: "Start med et bilde av hele varen",
    tips: "Legg gjerne til bilder av merke, etikett og eventuelle skader.",
    count: "{count} av 8 bilder",
    camera: "Ta et bilde",
    library: "Velg bilder",
    saved: "Utkastet er lagret på denne enheten.",
    working: "Lagrer bilder…",
    remove: "Fjern bilde {count}",
    clear: "Slett utkast",
    clearTitle: "Slette fotoutkastet?",
    clearBody:
      "Bildene fjernes fra utkastet. Originalene i bildebiblioteket påvirkes ikke.",
    keep: "Behold utkastet",
    error: "Utkastet kunne ikke leses eller lagres. Prøv igjen.",
    limit: "Du kan ha opptil 8 bilder. Fjern et bilde for å legge til et nytt.",
    invalid:
      "Bildet kunne ikke legges til. Velg et annet bilde på høyst 25 MB.",
    denied:
      "Tillat kameratilgang for å ta et bilde. Du kan også velge fra bildene dine.",
    settings: "Åpne innstillinger",
  },
  da: {
    entry: "Prøv fotoindlevering",
    title: "Tag et billede af en vare",
    intro: "En kladde på denne enhed. Intet sendes til en butik endnu.",
    empty: "Start med et billede af hele varen",
    tips: "Tilføj gerne billeder af mærke, etiket og eventuelle skader.",
    count: "{count} af 8 billeder",
    camera: "Tag et billede",
    library: "Vælg billeder",
    saved: "Kladden er gemt på denne enhed.",
    working: "Gemmer billeder…",
    remove: "Fjern billede {count}",
    clear: "Slet kladde",
    clearTitle: "Slet fotokladden?",
    clearBody:
      "Billederne fjernes fra kladden. Originalerne i dit billedbibliotek påvirkes ikke.",
    keep: "Behold kladden",
    error: "Kladden kunne ikke læses eller gemmes. Prøv igen.",
    limit:
      "Du kan have op til 8 billeder. Fjern et billede for at tilføje et nyt.",
    invalid:
      "Billedet kunne ikke tilføjes. Vælg et andet billede på højst 25 MB.",
    denied:
      "Tillad kameraadgang for at tage et billede. Du kan også vælge fra dine billeder.",
    settings: "Åbn indstillinger",
  },
  fi: {
    entry: "Kokeile kuvien lisäämistä",
    title: "Kuvaa tuote",
    intro: "Luonnos tällä laitteella. Mitään ei vielä lähetetä myymälään.",
    empty: "Aloita kuvalla koko tuotteesta",
    tips: "Lisää kuvia merkistä, etiketistä ja mahdollisista vaurioista.",
    count: "{count}/8 kuvaa",
    camera: "Ota kuva",
    library: "Valitse kuvia",
    saved: "Luonnos on tallennettu tälle laitteelle.",
    working: "Tallennetaan kuvia…",
    remove: "Poista kuva {count}",
    clear: "Poista luonnos",
    clearTitle: "Poistetaanko kuvaluonnos?",
    clearBody:
      "Kuvat poistetaan luonnoksesta. Kuvakirjastosi alkuperäiset kuvat säilyvät.",
    keep: "Säilytä luonnos",
    error: "Luonnosta ei voitu lukea tai tallentaa. Yritä uudelleen.",
    limit: "Voit lisätä enintään 8 kuvaa. Poista kuva lisätäksesi uuden.",
    invalid: "Kuvaa ei voitu lisätä. Valitse toinen kuva, enintään 25 Mt.",
    denied:
      "Salli kameran käyttö kuvan ottamista varten. Voit myös valita kuvia kirjastostasi.",
    settings: "Avaa asetukset",
  },
  de: {
    entry: "Fotoeinreichung ausprobieren",
    title: "Artikel fotografieren",
    intro:
      "Ein Entwurf auf diesem Gerät. Es wird noch nichts an ein Geschäft gesendet.",
    empty: "Beginnen Sie mit einem Foto des ganzen Artikels",
    tips: "Ergänzen Sie Fotos von Marke, Etikett und möglichen Schäden.",
    count: "{count} von 8 Fotos",
    camera: "Foto aufnehmen",
    library: "Fotos auswählen",
    saved: "Der Entwurf ist auf diesem Gerät gespeichert.",
    working: "Fotos werden gespeichert…",
    remove: "Foto {count} entfernen",
    clear: "Entwurf löschen",
    clearTitle: "Fotoentwurf löschen?",
    clearBody:
      "Die Fotos werden aus dem Entwurf entfernt. Originale in Ihrer Fotomediathek bleiben erhalten.",
    keep: "Entwurf behalten",
    error:
      "Der Entwurf konnte nicht gelesen oder gespeichert werden. Versuchen Sie es erneut.",
    limit:
      "Sie können bis zu 8 Fotos hinzufügen. Entfernen Sie eines, um ein neues hinzuzufügen.",
    invalid:
      "Das Foto konnte nicht hinzugefügt werden. Wählen Sie ein anderes Bild mit höchstens 25 MB.",
    denied:
      "Erlauben Sie den Kamerazugriff, um ein Foto aufzunehmen. Sie können auch vorhandene Fotos auswählen.",
    settings: "Einstellungen öffnen",
  },
  es: {
    entry: "Probar envío de fotos",
    title: "Fotografía un artículo",
    intro:
      "Un borrador en este dispositivo. Todavía no se envía nada a ninguna tienda.",
    empty: "Empieza con una foto del artículo completo",
    tips: "Añade fotos de la marca, la etiqueta y los posibles desperfectos.",
    count: "{count} de 8 fotos",
    camera: "Hacer una foto",
    library: "Elegir fotos",
    saved: "El borrador está guardado en este dispositivo.",
    working: "Guardando fotos…",
    remove: "Quitar foto {count}",
    clear: "Eliminar borrador",
    clearTitle: "¿Eliminar el borrador de fotos?",
    clearBody:
      "Las fotos se quitarán del borrador. Los originales de tu biblioteca no se modificarán.",
    keep: "Conservar borrador",
    error: "No se ha podido leer o guardar el borrador. Inténtalo de nuevo.",
    limit: "Puedes añadir hasta 8 fotos. Quita una para añadir otra.",
    invalid:
      "No se ha podido añadir la foto. Elige otra imagen de hasta 25 MB.",
    denied:
      "Permite el acceso a la cámara para hacer una foto. También puedes elegir fotos de tu biblioteca.",
    settings: "Abrir ajustes",
  },
  it: {
    entry: "Prova l’invio di foto",
    title: "Fotografa un articolo",
    intro:
      "Una bozza su questo dispositivo. Non viene ancora inviato nulla ai negozi.",
    empty: "Inizia con una foto dell’intero articolo",
    tips: "Aggiungi foto del marchio, dell’etichetta e di eventuali difetti.",
    count: "{count} di 8 foto",
    camera: "Scatta una foto",
    library: "Scegli foto",
    saved: "La bozza è salvata su questo dispositivo.",
    working: "Salvataggio delle foto…",
    remove: "Rimuovi foto {count}",
    clear: "Elimina bozza",
    clearTitle: "Eliminare la bozza fotografica?",
    clearBody:
      "Le foto verranno rimosse dalla bozza. Gli originali nella libreria non verranno modificati.",
    keep: "Conserva bozza",
    error: "Impossibile leggere o salvare la bozza. Riprova.",
    limit:
      "Puoi aggiungere fino a 8 foto. Rimuovine una per aggiungerne un’altra.",
    invalid:
      "Impossibile aggiungere la foto. Scegli un’altra immagine, fino a 25 MB.",
    denied:
      "Consenti l’accesso alla fotocamera per scattare una foto. Puoi anche scegliere foto dalla libreria.",
    settings: "Apri impostazioni",
  },
};
export function photoDraftCopy(locale: Locale): Copy {
  return copies[locale];
}
