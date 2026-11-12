import type { Locale } from "./locale";
const sv = {
  title: "Få hjälp av bilderna",
  upload: "Ladda upp bilder för AI-förslag",
  verify: "Verifiera dig för AI-förslag",
  uploading: "Laddar upp bild {done} av {total}…",
  uploaded: "Alla bilder är uppladdade.",
  analyze: "Få förslag med AI",
  analyzing: "AI tittar på dina bilder…",
  ready:
    "Förslag från dina bilder. Kontrollera och ändra vid behov. Det du redan skrivit är kvar.",
  pending:
    "Analysen är påbörjad. Hämta resultatet igen om en stund, eller fyll i själv.",
  check: "Hämta resultat",
  failed: "AI kunde inte ge några förslag. Du kan fylla i uppgifterna själv.",
  error: "Det gick inte just nu. Försök igen eller fyll i uppgifterna själv.",
  unavailable:
    "AI-förslag är inte tillgängliga just nu. Du kan fylla i uppgifterna själv.",
  retry: "Försök igen",
};
type Copy = { [K in keyof typeof sv]: string };
const en: Copy = {
  title: "Let your photos help",
  upload: "Upload photos for AI suggestions",
  verify: "Verify to get AI suggestions",
  uploading: "Uploading photo {done} of {total}…",
  uploaded: "All photos uploaded.",
  analyze: "Get AI suggestions",
  analyzing: "AI is looking at your photos…",
  ready:
    "Suggestions from your photos. Check and edit as needed. Your own entries are kept.",
  pending:
    "Analysis has started. Check again shortly, or enter the details yourself.",
  check: "Check results",
  failed: "AI could not suggest details. You can enter them yourself.",
  error: "Something went wrong. Try again or enter the details yourself.",
  unavailable:
    "AI suggestions are currently unavailable. You can enter the details yourself.",
  retry: "Try again",
};
const copies: Record<Locale, Copy> = {
  sv,
  en,
  no: {
    title: "Få hjelp av bildene",
    upload: "Last opp bilder for AI-forslag",
    verify: "Bekreft deg for AI-forslag",
    uploading: "Laster opp bilde {done} av {total}…",
    uploaded: "Alle bildene er lastet opp.",
    analyze: "Få forslag med AI",
    analyzing: "AI ser på bildene dine…",
    ready:
      "Forslag fra bildene. Kontroller og endre ved behov. Det du har skrevet, beholdes.",
    pending:
      "Analysen har startet. Hent resultatet snart, eller fyll inn selv.",
    check: "Hent resultat",
    failed: "AI kunne ikke gi forslag. Du kan fylle inn selv.",
    error: "Noe gikk galt. Prøv igjen eller fyll inn selv.",
    unavailable: "AI-forslag er ikke tilgjengelige nå. Du kan fylle inn selv.",
    retry: "Prøv igjen",
  },
  da: {
    title: "Få hjælp af billederne",
    upload: "Upload billeder til AI-forslag",
    verify: "Bekræft dig for AI-forslag",
    uploading: "Uploader billede {done} af {total}…",
    uploaded: "Alle billeder er uploadet.",
    analyze: "Få forslag med AI",
    analyzing: "AI ser på dine billeder…",
    ready:
      "Forslag fra dine billeder. Tjek og ret efter behov. Din egen tekst bevares.",
    pending: "Analysen er startet. Hent resultatet om lidt, eller udfyld selv.",
    check: "Hent resultat",
    failed: "AI kunne ikke give forslag. Du kan udfylde selv.",
    error: "Noget gik galt. Prøv igen eller udfyld selv.",
    unavailable: "AI-forslag er ikke tilgængelige nu. Du kan udfylde selv.",
    retry: "Prøv igen",
  },
  fi: {
    title: "Apua kuvistasi",
    upload: "Lataa kuvat tekoälyehdotuksia varten",
    verify: "Vahvista itsesi tekoälyehdotuksia varten",
    uploading: "Ladataan kuvaa {done}/{total}…",
    uploaded: "Kaikki kuvat on ladattu.",
    analyze: "Pyydä tekoälyehdotuksia",
    analyzing: "Tekoäly tarkastelee kuviasi…",
    ready:
      "Ehdotuksia kuvistasi. Tarkista ja muokkaa tarvittaessa. Omat tietosi säilyvät.",
    pending:
      "Analyysi on alkanut. Tarkista tulos hetken kuluttua tai täytä itse.",
    check: "Tarkista tulos",
    failed: "Tekoäly ei voinut ehdottaa tietoja. Voit täyttää ne itse.",
    error: "Jokin meni vikaan. Yritä uudelleen tai täytä itse.",
    unavailable: "Tekoälyehdotuksia ei ole nyt saatavilla. Voit täyttää itse.",
    retry: "Yritä uudelleen",
  },
  de: {
    title: "Hilfe anhand deiner Fotos",
    upload: "Fotos für KI-Vorschläge hochladen",
    verify: "Für KI-Vorschläge verifizieren",
    uploading: "Foto {done} von {total} wird hochgeladen…",
    uploaded: "Alle Fotos sind hochgeladen.",
    analyze: "KI-Vorschläge erhalten",
    analyzing: "Die KI prüft deine Fotos…",
    ready:
      "Vorschläge aus deinen Fotos. Prüfe und ändere sie bei Bedarf. Deine Eingaben bleiben erhalten.",
    pending:
      "Die Analyse läuft. Prüfe das Ergebnis gleich erneut oder fülle die Angaben selbst aus.",
    check: "Ergebnis abrufen",
    failed:
      "Die KI konnte keine Vorschläge machen. Du kannst die Angaben selbst ausfüllen.",
    error:
      "Das hat nicht geklappt. Versuche es erneut oder fülle die Angaben selbst aus.",
    unavailable:
      "KI-Vorschläge sind derzeit nicht verfügbar. Du kannst die Angaben selbst ausfüllen.",
    retry: "Erneut versuchen",
  },
  es: {
    title: "Recibe ayuda con tus fotos",
    upload: "Subir fotos para sugerencias de IA",
    verify: "Verifícate para recibir sugerencias de IA",
    uploading: "Subiendo foto {done} de {total}…",
    uploaded: "Todas las fotos están subidas.",
    analyze: "Obtener sugerencias de IA",
    analyzing: "La IA está mirando tus fotos…",
    ready:
      "Sugerencias a partir de tus fotos. Revísalas y edítalas. Se conservan tus datos.",
    pending:
      "El análisis ha comenzado. Consulta el resultado en un momento o completa los datos.",
    check: "Consultar resultado",
    failed: "La IA no pudo sugerir datos. Puedes completarlos tú.",
    error: "Algo salió mal. Inténtalo de nuevo o completa los datos.",
    unavailable:
      "Las sugerencias de IA no están disponibles ahora. Puedes completar los datos.",
    retry: "Reintentar",
  },
  it: {
    title: "Un aiuto dalle tue foto",
    upload: "Carica foto per i suggerimenti IA",
    verify: "Verifica la tua identità per i suggerimenti IA",
    uploading: "Caricamento foto {done} di {total}…",
    uploaded: "Tutte le foto sono caricate.",
    analyze: "Ottieni suggerimenti IA",
    analyzing: "L’IA sta esaminando le tue foto…",
    ready:
      "Suggerimenti dalle tue foto. Controlla e modifica se necessario. I tuoi dati sono conservati.",
    pending: "L’analisi è iniziata. Controlla tra poco o compila i dati.",
    check: "Controlla risultato",
    failed: "L’IA non ha potuto suggerire i dati. Puoi compilarli tu.",
    error: "Qualcosa è andato storto. Riprova o compila i dati.",
    unavailable:
      "I suggerimenti IA non sono disponibili ora. Puoi compilare i dati.",
    retry: "Riprova",
  },
};
export const photoAnalysisCopy = (locale: Locale) => copies[locale];
