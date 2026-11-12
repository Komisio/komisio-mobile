import type { Locale } from "./locale";
import { MAX_DRAFT_PHOTOS, MAX_PHOTO_BYTES } from "./photo-draft.ts";

const sv = {
  title: "Fota en vara",
  intro: "Ett utkast på den här enheten. Inget skickas till någon butik ännu.",
  empty: "Börja med en bild av hela varan",
  tips: "Fota varan från olika vinklar. Ta gärna närbilder på etikett, märke och eventuella skador.",
  infoTitle: "Fototips",
  infoUsage:
    "Komisio använder bilderna för bedömning, prissättning och som underlag vid inlämningen.",
  count: "{count} av max {maxPhotos} bilder",
  camera: "Ta en bild",
  cameraStart: "Börja fota",
  cameraMore: "Fota fler bilder",
  library: "…eller välj från telefonen",
  saved: "Utkastet är sparat på den här enheten.",
  working: "Sparar bilder…",
  remove: "Ta bort bild {count}",
  photo: "Bild {count}",
  previewError: "Bilden kunde inte visas. Försök igen eller ta bort den.",
  clear: "Radera utkast",
  clearTitle: "Radera fotoutkastet?",
  clearBody:
    "Utkastet med bilder och uppgifter raderas. Originalen i ditt bildbibliotek påverkas inte.",
  keep: "Behåll utkastet",
  error: "Det gick inte att läsa eller spara utkastet. Försök igen.",
  limit:
    "Du kan ha högst {maxPhotos} bilder. Ta bort en bild för att lägga till en ny.",
  invalid:
    "Bilden kunde inte läggas till. Välj en annan bild, högst {maxMB} MB.",
  denied:
    "Tillåt kameraåtkomst för att ta en bild. Du kan också välja från dina bilder.",
  settings: "Öppna inställningar",
};
type Copy = { [K in keyof typeof sv]: string };
const copies: Record<Locale, Copy> = {
  sv,
  en: {
    title: "Photograph an item",
    intro: "A draft on this device. Nothing is sent to a store yet.",
    empty: "Start with a photo of the whole item",
    tips: "Photograph the item from different angles. Add close-ups of the label, brand and any damage.",
    infoTitle: "Photo tips",
    infoUsage:
      "Komisio uses the photos for assessment, pricing and as a record when you hand in the item.",
    count: "{count} of up to {maxPhotos} photos",
    camera: "Take a photo",
    cameraStart: "Start taking photos",
    cameraMore: "Take more photos",
    library: "…or choose from your phone",
    saved: "Your draft is saved on this device.",
    working: "Saving photos…",
    remove: "Remove photo {count}",
    photo: "Photo {count}",
    previewError: "The photo could not be displayed. Try again or remove it.",
    clear: "Delete draft",
    clearTitle: "Delete the photo draft?",
    clearBody:
      "The draft, including its photos and item details, will be deleted. Originals in your photo library are unaffected.",
    keep: "Keep draft",
    error: "The draft could not be read or saved. Please try again.",
    limit: "You can have up to {maxPhotos} photos. Remove one to add another.",
    invalid:
      "The photo could not be added. Choose another image, up to {maxMB} MB.",
    denied:
      "Allow camera access to take a photo. You can also choose from your photos.",
    settings: "Open settings",
  },
  no: {
    title: "Ta bilde av en vare",
    intro: "Et utkast på denne enheten. Ingenting sendes til en butikk ennå.",
    empty: "Start med et bilde av hele varen",
    tips: "Ta bilder av varen fra ulike vinkler. Ta gjerne nærbilder av etikett, merke og eventuelle skader.",
    infoTitle: "Fototips",
    infoUsage:
      "Komisio bruker bildene til vurdering, prissetting og som dokumentasjon ved innlevering.",
    count: "{count} av maks {maxPhotos} bilder",
    camera: "Ta et bilde",
    cameraStart: "Begynn å ta bilder",
    cameraMore: "Ta flere bilder",
    library: "…eller velg fra telefonen",
    saved: "Utkastet er lagret på denne enheten.",
    working: "Lagrer bilder…",
    remove: "Fjern bilde {count}",
    photo: "Bilde {count}",
    previewError: "Bildet kunne ikke vises. Prøv igjen eller fjern det.",
    clear: "Slett utkast",
    clearTitle: "Slette fotoutkastet?",
    clearBody:
      "Utkastet med bilder og opplysninger slettes. Originalene i bildebiblioteket påvirkes ikke.",
    keep: "Behold utkastet",
    error: "Utkastet kunne ikke leses eller lagres. Prøv igjen.",
    limit:
      "Du kan ha opptil {maxPhotos} bilder. Fjern et bilde for å legge til et nytt.",
    invalid:
      "Bildet kunne ikke legges til. Velg et annet bilde på høyst {maxMB} MB.",
    denied:
      "Tillat kameratilgang for å ta et bilde. Du kan også velge fra bildene dine.",
    settings: "Åpne innstillinger",
  },
  da: {
    title: "Tag et billede af en vare",
    intro: "En kladde på denne enhed. Intet sendes til en butik endnu.",
    empty: "Start med et billede af hele varen",
    tips: "Tag billeder af varen fra forskellige vinkler. Tag gerne nærbilleder af etiket, mærke og eventuelle skader.",
    infoTitle: "Fototips",
    infoUsage:
      "Komisio bruger billederne til vurdering, prissætning og som dokumentation ved indlevering.",
    count: "{count} af maks. {maxPhotos} billeder",
    camera: "Tag et billede",
    cameraStart: "Begynd at tage billeder",
    cameraMore: "Tag flere billeder",
    library: "…eller vælg fra telefonen",
    saved: "Kladden er gemt på denne enhed.",
    working: "Gemmer billeder…",
    remove: "Fjern billede {count}",
    photo: "Billede {count}",
    previewError: "Billedet kunne ikke vises. Prøv igen eller fjern det.",
    clear: "Slet kladde",
    clearTitle: "Slet fotokladden?",
    clearBody:
      "Kladden med billeder og oplysninger slettes. Originalerne i dit billedbibliotek påvirkes ikke.",
    keep: "Behold kladden",
    error: "Kladden kunne ikke læses eller gemmes. Prøv igen.",
    limit:
      "Du kan have op til {maxPhotos} billeder. Fjern et billede for at tilføje et nyt.",
    invalid:
      "Billedet kunne ikke tilføjes. Vælg et andet billede på højst {maxMB} MB.",
    denied:
      "Tillad kameraadgang for at tage et billede. Du kan også vælge fra dine billeder.",
    settings: "Åbn indstillinger",
  },
  fi: {
    title: "Kuvaa tuote",
    intro: "Luonnos tällä laitteella. Mitään ei vielä lähetetä myymälään.",
    empty: "Aloita kuvalla koko tuotteesta",
    tips: "Kuvaa tuote eri kulmista. Ota lähikuvia etiketistä, merkistä ja mahdollisista vaurioista.",
    infoTitle: "Kuvausvinkit",
    infoUsage:
      "Komisio käyttää kuvia arviointiin, hinnoitteluun ja dokumentointiin tuotteen luovutuksen yhteydessä.",
    count: "{count} kuvaa, enintään {maxPhotos}",
    camera: "Ota kuva",
    cameraStart: "Aloita kuvaaminen",
    cameraMore: "Ota lisää kuvia",
    library: "…tai valitse puhelimesta",
    saved: "Luonnos on tallennettu tälle laitteelle.",
    working: "Tallennetaan kuvia…",
    remove: "Poista kuva {count}",
    photo: "Kuva {count}",
    previewError: "Kuvaa ei voitu näyttää. Yritä uudelleen tai poista se.",
    clear: "Poista luonnos",
    clearTitle: "Poistetaanko kuvaluonnos?",
    clearBody:
      "Luonnos kuvineen ja tuotetietoineen poistetaan. Kuvakirjastosi alkuperäiset kuvat säilyvät.",
    keep: "Säilytä luonnos",
    error: "Luonnosta ei voitu lukea tai tallentaa. Yritä uudelleen.",
    limit:
      "Voit lisätä enintään {maxPhotos} kuvaa. Poista kuva lisätäksesi uuden.",
    invalid: "Kuvaa ei voitu lisätä. Valitse toinen kuva, enintään {maxMB} Mt.",
    denied:
      "Salli kameran käyttö kuvan ottamista varten. Voit myös valita kuvia kirjastostasi.",
    settings: "Avaa asetukset",
  },
  de: {
    title: "Artikel fotografieren",
    intro:
      "Ein Entwurf auf diesem Gerät. Es wird noch nichts an ein Geschäft gesendet.",
    empty: "Beginnen Sie mit einem Foto des ganzen Artikels",
    tips: "Fotografieren Sie den Artikel aus verschiedenen Winkeln. Ergänzen Sie Nahaufnahmen von Etikett, Marke und möglichen Schäden.",
    infoTitle: "Fototipps",
    infoUsage:
      "Komisio nutzt die Fotos zur Beurteilung, Preisfindung und als Dokumentation bei der Abgabe.",
    count: "{count} von maximal {maxPhotos} Fotos",
    camera: "Foto aufnehmen",
    cameraStart: "Mit Fotos beginnen",
    cameraMore: "Weitere Fotos aufnehmen",
    library: "…oder vom Smartphone auswählen",
    saved: "Der Entwurf ist auf diesem Gerät gespeichert.",
    working: "Fotos werden gespeichert…",
    remove: "Foto {count} entfernen",
    photo: "Foto {count}",
    previewError:
      "Das Foto konnte nicht angezeigt werden. Versuchen Sie es erneut oder entfernen Sie es.",
    clear: "Entwurf löschen",
    clearTitle: "Fotoentwurf löschen?",
    clearBody:
      "Der Entwurf mit Fotos und Artikelangaben wird gelöscht. Originale in Ihrer Fotomediathek bleiben erhalten.",
    keep: "Entwurf behalten",
    error:
      "Der Entwurf konnte nicht gelesen oder gespeichert werden. Versuchen Sie es erneut.",
    limit:
      "Sie können bis zu {maxPhotos} Fotos hinzufügen. Entfernen Sie eines, um ein neues hinzuzufügen.",
    invalid:
      "Das Foto konnte nicht hinzugefügt werden. Wählen Sie ein anderes Bild mit höchstens {maxMB} MB.",
    denied:
      "Erlauben Sie den Kamerazugriff, um ein Foto aufzunehmen. Sie können auch vorhandene Fotos auswählen.",
    settings: "Einstellungen öffnen",
  },
  es: {
    title: "Fotografía un artículo",
    intro:
      "Un borrador en este dispositivo. Todavía no se envía nada a ninguna tienda.",
    empty: "Empieza con una foto del artículo completo",
    tips: "Fotografía el artículo desde distintos ángulos. Añade primeros planos de la etiqueta, la marca y los posibles desperfectos.",
    infoTitle: "Consejos para las fotos",
    infoUsage:
      "Komisio utiliza las fotos para valorar el artículo, fijar el precio y documentar la entrega.",
    count: "{count} de un máximo de {maxPhotos} fotos",
    camera: "Hacer una foto",
    cameraStart: "Empezar a hacer fotos",
    cameraMore: "Hacer más fotos",
    library: "…o elegir del teléfono",
    saved: "El borrador está guardado en este dispositivo.",
    working: "Guardando fotos…",
    remove: "Quitar foto {count}",
    photo: "Foto {count}",
    previewError:
      "No se ha podido mostrar la foto. Inténtalo de nuevo o elimínala.",
    clear: "Eliminar borrador",
    clearTitle: "¿Eliminar el borrador de fotos?",
    clearBody:
      "Se eliminará el borrador con sus fotos y los datos del artículo. Los originales de tu biblioteca no se modificarán.",
    keep: "Conservar borrador",
    error: "No se ha podido leer o guardar el borrador. Inténtalo de nuevo.",
    limit: "Puedes añadir hasta {maxPhotos} fotos. Quita una para añadir otra.",
    invalid:
      "No se ha podido añadir la foto. Elige otra imagen de hasta {maxMB} MB.",
    denied:
      "Permite el acceso a la cámara para hacer una foto. También puedes elegir fotos de tu biblioteca.",
    settings: "Abrir ajustes",
  },
  it: {
    title: "Fotografa un articolo",
    intro:
      "Una bozza su questo dispositivo. Non viene ancora inviato nulla ai negozi.",
    empty: "Inizia con una foto dell’intero articolo",
    tips: "Fotografa l’articolo da diverse angolazioni. Aggiungi primi piani dell’etichetta, del marchio e di eventuali difetti.",
    infoTitle: "Consigli per le foto",
    infoUsage:
      "Komisio usa le foto per valutare l’articolo, stabilire il prezzo e documentare la consegna.",
    count: "{count} di massimo {maxPhotos} foto",
    camera: "Scatta una foto",
    cameraStart: "Inizia a fotografare",
    cameraMore: "Scatta altre foto",
    library: "…oppure scegli dal telefono",
    saved: "La bozza è salvata su questo dispositivo.",
    working: "Salvataggio delle foto…",
    remove: "Rimuovi foto {count}",
    photo: "Foto {count}",
    previewError: "Impossibile visualizzare la foto. Riprova o rimuovila.",
    clear: "Elimina bozza",
    clearTitle: "Eliminare la bozza fotografica?",
    clearBody:
      "La bozza con le foto e i dettagli dell'articolo verrà eliminata. Gli originali nella libreria non verranno modificati.",
    keep: "Conserva bozza",
    error: "Impossibile leggere o salvare la bozza. Riprova.",
    limit:
      "Puoi aggiungere fino a {maxPhotos} foto. Rimuovine una per aggiungerne un’altra.",
    invalid:
      "Impossibile aggiungere la foto. Scegli un’altra immagine, fino a {maxMB} MB.",
    denied:
      "Consenti l’accesso alla fotocamera per scattare una foto. Puoi anche scegliere foto dalla libreria.",
    settings: "Apri impostazioni",
  },
};
export function photoDraftCopy(locale: Locale): Copy {
  const t = copies[locale];
  const limits = (text: string) =>
    text
      .replaceAll("{maxPhotos}", String(MAX_DRAFT_PHOTOS))
      .replaceAll("{maxMB}", String(MAX_PHOTO_BYTES / 1024 / 1024));
  return {
    ...t,
    count: limits(t.count),
    limit: limits(t.limit),
    invalid: limits(t.invalid),
  };
}
