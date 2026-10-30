import type { Dictionary } from "../dictionary-base.ts";

export default {
  storeInfo: {
    title: "Geschäftsinformationen",
    back: "Zurück zum Geschäft",
    missing: "Das Geschäft hat noch keine Informationen veröffentlicht.",
    failed:
      "Die Geschäftsinformationen konnten nicht geladen werden. Versuche es erneut.",
    concept: "Über das Geschäft",
    accepts: "Was das Geschäft annimmt",
    address: "Anfahrt",
    noAddress: "Das Geschäft hat keine Adresse angegeben.",
    map: "Auf Karte anzeigen",
    externalMap: "Die Karte wird außerhalb von Komisio geöffnet.",
    contact: "Kontakt",
    noContact: "Das Geschäft hat keine Kontaktdaten angegeben.",
    email: "E-Mail senden",
    phone: "Geschäft anrufen",
    website: "Website öffnen",
    hours: "Öffnungszeiten",
    unknown: "Nicht angegeben",
    days: {
      mon: "Montag",
      tue: "Dienstag",
      wed: "Mittwoch",
      thu: "Donnerstag",
      fri: "Freitag",
      sat: "Samstag",
      sun: "Sonntag",
    },
    linkFailed:
      "Der Link konnte nicht geöffnet werden. Versuche es erneut oder nutze die Kontaktdaten oben.",
  },
  agreementAccept: {
    confirm:
      "Ich habe {title}, Version {version}, auf {language} gelesen und stimme zu.",
    accept: "Diesem Vertrag zustimmen",
    registered:
      "Die Zustimmung wurde erfasst. Lade den Vertrag erneut, um die aktuellen Angaben zu sehen.",
    pending:
      "Diese Zustimmung wartet auf Bestätigung. Wiederhole dieselbe Zustimmung, bevor du eine neue abgibst.",
    pendingDocument: "Für Version {version} auf {language}: {title}",
    viewPending: "Ausstehenden Vertrag anzeigen",
    retrySame: "Dieselbe Zustimmung wiederholen",
    changed:
      "Das Geschäft hat den aktuellen Vertrag geändert. Lade und prüfe ihn vor der Zustimmung.",
    refresh: "Aktuellen Vertrag laden",
    cleanupSuccess:
      "Die Zustimmung wurde erfasst. Die App muss die lokale Verarbeitung abschließen, bevor du fortfährst.",
    cleanupConflict:
      "Der Vertrag wurde geändert. Schließe die lokale Verarbeitung ab und lade dann den aktuellen Vertrag.",
    finish: "Zustimmung abschließen",
    unavailable:
      "Du kannst den Vertrag hier lesen. Die Zustimmung in der App ist derzeit nicht möglich. Nutze das Verkäuferportal.",
    unsupported:
      "Dieser Browser kann Zustimmungen nicht sicher speichern. Nutze das Verkäuferportal.",
  },
  payouts: {
    title: "Auszahlungen",
    request: "Auszahlung beantragen",
    history: "Auszahlungsverlauf",
    historyShort: "Verlauf",
    notice:
      "Das Geschäft prüft deinen Antrag und veranlasst die Bankauszahlung. Ein Antrag überweist kein Geld und reserviert das Guthaben erst nach Genehmigung.",
    amount: "Betrag ({currency})",
    useAll: "Gesamtes Guthaben verwenden",
    threshold: "Mindestauszahlung",
    submit: "Antrag bestätigen",
    invalid:
      "Gib einen positiven Betrag mit höchstens zwei Nachkommastellen ein.",
    below: "Der Betrag liegt unter der Mindestauszahlung des Geschäfts.",
    above: "Der Betrag übersteigt dein verfügbares Guthaben.",
    insufficient:
      "Dein verfügbares Guthaben reicht noch nicht für eine Auszahlung.",
    empty: "Du hast noch keine Auszahlungen beantragt.",
    failed:
      "Die Auszahlungen konnten nicht geladen werden. Versuche es erneut.",
    denied: "Du hast keinen Zugriff mehr auf dieses Verkäuferkonto.",
    notConfigured:
      "Auszahlungen können derzeit nicht in der App beantragt werden. Nutze das Verkäuferportal oder kontaktiere das Geschäft.",
    pending:
      "Dieser Antrag wartet auf Bestätigung. Wiederhole denselben Antrag, bevor du einen neuen stellst.",
    retrySame: "Denselben Antrag wiederholen",
    saved:
      "Dein Antrag wurde erfasst. Aktualisiere den Verlauf, um den Bearbeitungsstand zu sehen.",
    changed:
      "Das Guthaben oder der Mindestbetrag wurde geändert. Lade die aktuellen Angaben vor einem neuen Antrag.",
    cleanupSuccess:
      "Der Antrag wurde erfasst. Die App muss die lokale Verarbeitung abschließen, bevor du einen neuen stellst.",
    cleanupConflict:
      "Der Antrag konnte mit diesem Betrag nicht erfasst werden. Schließe die lokale Verarbeitung ab und lade die aktuellen Angaben.",
    finish: "Antrag abschließen",
    refresh: "Auszahlungen aktualisieren",
    unsupported:
      "Dieser Browser kann Auszahlungsanträge nicht sicher speichern. Nutze das Verkäuferportal.",
    previous: "Vorherige Seite",
    next: "Nächste Seite",
    page: "Seite {page} von {pages} · {total} Anträge",
    first: "Zur ersten Seite",
    pastEnd: "Auf dieser Seite gibt es keine Anträge.",
  },
  bank: {
    title: "Auszahlungskonto",
    discard: "Ausstehenden Antrag freigeben",
    discardWarning:
      "Dadurch wird beim Geschäft nichts storniert. Der Antrag kann bereits gespeichert sein. Prüfe zuerst das aktuelle Konto, den Vertrag oder den Auszahlungsverlauf, oder kontaktiere das Geschäft. Ein neuer Antrag ist eigenständig und kann ein Duplikat erzeugen.",
    confirmDiscard: "Ich habe geprüft – Antrag freigeben",
    keepPending: "Antrag beibehalten",
    discarded:
      "Der lokale Antrag wurde entfernt. Lade vor dem Fortfahren die aktuellen Angaben. Beim Geschäft wurde nichts storniert.",
    rejected:
      "Der Antrag wurde abgelehnt und wird nicht automatisch erneut gesendet. Lade die aktuellen Angaben und prüfe deinen Zugriff, bevor du es erneut versuchst.",
    back: "Zurück",
    intro: "Das Konto, das das Geschäft für Bankauszahlungen verwendet.",
    holder: "Kontoinhaber",
    country: "Land des Kontos",
    chooseCountry: "Land auswählen",
    countrySearch: "Land suchen",
    noCountries: "Keine Länder entsprechen der Suche.",
    moreCountries: "Suche, um die Liste einzugrenzen.",
    kind: "Kontotyp",
    iban: "IBAN",
    local: "Lokales Bankkonto",
    account: "Kontonummer",
    routing: "Bankleitzahl (falls erforderlich)",
    save: "Konto speichern",
    missing: "Du hast noch kein Auszahlungskonto gespeichert.",
    invalid:
      "Prüfe Kontoinhaber, Land und Kontonummer. Die IBAN muss gültig sein und zum gewählten Land gehören.",
    failed: "Das Konto konnte nicht geladen werden. Versuche es erneut.",
    denied: "Du hast keinen Zugriff mehr auf dieses Verkäuferkonto.",
    notConfigured:
      "Kontoänderungen sind derzeit nicht in der App möglich. Nutze das Verkäuferportal oder kontaktiere das Geschäft.",
    pending:
      "Diese Änderung wartet auf Bestätigung. Wiederhole dieselbe Änderung, bevor du eine neue vornimmst.",
    pendingTitle: "Ausstehende Änderung",
    retrySame: "Dieselbe Änderung wiederholen",
    saved: "Dein Auszahlungskonto wurde gespeichert.",
    changed:
      "Das Konto wurde an anderer Stelle geändert. Lade und prüfe die neuesten Angaben, bevor du erneut speicherst.",
    refresh: "Aktuelles Konto laden",
    cleanupSuccess:
      "Das Konto wurde gespeichert, aber die App konnte die lokale Verarbeitung nicht abschließen. Versuche es vor weiteren Änderungen erneut.",
    cleanupConflict:
      "Das Konto wurde an anderer Stelle geändert. Die App muss die lokale Verarbeitung abschließen, bevor du fortfahren kannst.",
    finish: "Änderung abschließen",
    storage:
      "Die App kann die ausstehende Änderung nicht lesen oder sicher speichern. Versuche es erneut. Lösche den App-Speicher nicht, solange eine Änderung auf Bestätigung wartet.",
    busy: "Eine andere Ansicht verarbeitet bereits eine Änderung. Warte und versuche es erneut.",
    unsupported:
      "Dieser Browser kann Kontoänderungen nicht sicher speichern. Nutze das Verkäuferportal.",
    auth: "Melde dich erneut mit demselben Konto an und kehre hierher zurück, um die ausstehende Änderung zu bestätigen.",
    mfa: "Bestätige deine Anmeldung mit der Zwei-Faktor-Authentifizierung und kehre hierher zurück, um es erneut zu versuchen.",
    verify: "Anmeldung prüfen",
    recovery:
      "Schließe das Zurücksetzen des Passworts im Portal ab, melde dich erneut an und kehre hierher zurück.",
  },
  agreement: {
    title: "Mein Vertrag",
    back: "Zurück zum Profil",
    current: "Aktueller Vertrag",
    historical: "Frühere Vertragsversion",
    version: "Version {version}",
    language: "Vertragssprache",
    asPublished:
      "Der Vertrag wird so angezeigt, wie ihn das Geschäft veröffentlicht hat.",
    verbatim:
      "Der Vertrag wird so angezeigt, wie ihn das Geschäft veröffentlicht hat. Die Sprachwahl ändert deine erfasste Zustimmung nicht.",
    accepted: "Erfasste Zustimmung",
    notAccepted: "Für diese Version ist keine Zustimmung erfasst.",
    acceptanceLanguage: "Sprache der Zustimmung",
    staff: "Vom Geschäft erfasst",
    seller: "Im Verkäuferportal zugestimmt",
    readOnly:
      "Nutze das Verkäuferportal von Komisio, um einem neuen Vertrag zuzustimmen. Diese Ansicht zeigt den Vertrag und frühere Zustimmungen.",
    missing: "Es gibt keinen veröffentlichten Vertrag.",
    unavailable:
      "Die gewählte Vertragsversion ist für dein Konto nicht verfügbar.",
    failed:
      "Der Vertrag konnte nicht geladen werden. Versuche es erneut oder öffne den aktuellen Vertrag.",
    denied: "Du hast keinen Zugriff auf den Vertrag dieses Verkäuferkontos.",
    history: "Frühere Zustimmungen",
    noHistory: "Es gibt noch keine erfassten Zustimmungen.",
    previous: "Vorherige Seite",
    next: "Nächste Seite",
    page: "Seite {page} von {pages}",
    refresh: "Vertrag aktualisieren",
  },
  overview: {
    attentionCount: "{count} Artikel laufen bald ab",
    attentionOne: "1 Artikel läuft bald ab",
    recentSales: "Letzte Verkäufe",
    salePrice: "Verkaufspreis",
    noSales: "Noch keine Verkäufe.",
    salesFailed: "Die letzten Verkäufe konnten nicht geladen werden.",
    intro: "Deine Artikel und Auszahlungen bei {store}.",
    available: "Verfügbares Guthaben",
    balanceDetails: "Über dein Guthaben",
    reservedShort: "Reserviert",
    reserved: "Für Auszahlung reserviert",
    paid: "Insgesamt ausgezahlt",
    balanceNote:
      "Reservierte Beträge sind nicht im verfügbaren Guthaben enthalten.",
    active: "Aktive Artikel",
    sold: "Verkaufte Artikel",
    ended: "Beendete Artikel",
    expiring: "Läuft bald ab",
    preview:
      "{shown} von {count} angezeigt. Alle Artikel findest du unter Meine Artikel.",
    recentPayouts: "Letzte Auszahlungsanträge",
    allPayouts: "Alle Auszahlungen anzeigen",
    requestedAt: "Beantragt",
    refresh: "Übersicht aktualisieren",
    failed:
      "Die Übersicht konnte nicht geladen werden. Prüfe die Verbindung und versuche es erneut.",
    denied:
      "Du hast keinen Zugriff mehr auf dieses Verkäuferkonto. Wähle das Geschäft erneut.",
    statuses: {
      requested: "Beantragt",
      approved: "Genehmigt, Zahlung ausstehend",
      paid: "Ausgezahlt",
      rejected: "Abgelehnt",
    },
  },
  items: {
    filter: "Artikel anzeigen",
    title: "Meine Artikel",
    detail: "Mein Artikel",
    back: "Zurück zu meinen Artikeln",
    untitled: "Artikel ohne Namen",
    intro: "Verfolge deine Artikel und ihre Verkaufszeiträume.",
    search: "Deine Artikel suchen",
    searchButton: "Suchen",
    filters: {
      active: "Zum Verkauf",
      expiring: "Läuft bald ab",
      sold: "Verkauft",
      ended: "Beendet",
      all: "Alle",
    },
    statuses: {
      forSale: "Zum Verkauf",
      period_ending: "Verkaufszeitraum endet bald",
      period_ended: "Verkaufszeitraum beendet",
      ended: "Nicht mehr zum Verkauf",
      sold: "Verkauft",
    },
    count: "{count} Artikel",
    empty: "Du hast keine Artikel in dieser Gruppe.",
    noMatches: "Keine Artikel entsprechen der Suche.",
    failed:
      "Deine Artikel konnten nicht geladen werden. Prüfe die Verbindung und versuche es erneut.",
    denied:
      "Dein Verkäuferkonto hat keinen Zugriff auf diese Artikel. Melde dich erneut an oder wähle ein anderes Geschäft.",
    missing:
      "Dieser Artikel ist für dein Konto in diesem Geschäft nicht verfügbar.",
    more: "Mehr anzeigen",
    refresh: "Aktualisieren",
    retryRefresh: "Aktualisierung wiederholen",
    unavailablePrice: "Preis nicht verfügbar",
    price: "Aktueller Preis",
    soldPrice: "Verkaufspreis",
    acceptedPrice: "Preis bei Erfassung",
    reference: "Artikelnummer",
    acceptedAt: "Erfasst",
    soldAt: "Verkauft",
    endedAt: "Beendet",
    expiredAt: "Verkaufszeitraum beendet",
    periodEnd: "Verkaufszeitraum endet",
    collectionDeadline: "Abholfrist",
    collectionHint:
      "Kontaktiere das Geschäft wegen der Abholung. Dieses Datum bedeutet nicht, dass der Artikel abholbereit ist.",
    nextStep: "Geplante Preissenkung",
    automatic:
      "Das Geschäft wendet geplante Preissenkungen automatisch an. Der Plan kann sich ändern.",
    manual:
      "Das Geschäft muss die Preissenkung durchführen. Der geplante Preis gilt erst nach der Erfassung.",
    facts: "Artikelinformationen",
    missingDate: "Datum nicht verfügbar",
  },
  catalogue: {
    search: "Artikel des Geschäfts suchen",
    searchButton: "Suchen",
    clear: "Suche löschen",
    loaded: "{shown} von {total} Artikeln angezeigt",
    count: "{count} Artikel",
    empty: "Zurzeit gibt es keine Artikel.",
    noMatches: "Keine Artikel entsprechen der Suche.",
    failed:
      "Die Artikel konnten nicht geladen werden. Prüfe die Verbindung und versuche es erneut.",
    denied:
      "Die Artikel dieses Geschäfts sind für dein Konto derzeit nicht verfügbar.",
    missing: "Dieser Artikel steht nicht mehr zum Verkauf.",
    more: "Mehr anzeigen",
    refresh: "Aktualisieren",
    back: "Zurück zu den Artikeln",
    noPhoto: "Kein Foto",
    photoFailed: "Das Foto konnte nicht geladen werden",
    photo: "Artikelfoto",
    previous: "Vorheriges Foto",
    next: "Nächstes Foto",
    imageCount: "Foto {current} von {total}",
    untitled: "Artikel",
    openItem: "Artikel ansehen",
    detail: "Artikeldetails",
    facts: "Über diesen Artikel",
    factLabels: {
      category: "Kategorie",
      brand: "Marke",
      size: "Größe",
      color: "Farbe",
      material: "Material",
      condition: "Zustand",
    },
  },
  languageName: "Deutsch",
  language: "Sprache",
  close: "Schließen",
  languageSaveFailed:
    "Die Sprache wurde geändert, konnte aber nicht gespeichert werden. Wähle sie erneut, um es noch einmal zu versuchen.",
  loading: "Wird geladen…",
  retry: "Erneut versuchen",
  authFailed:
    "Deine Anmeldung konnte nicht geladen werden. Versuche es erneut.",
  notConfigured:
    "Die App ist nicht mit Komisio verbunden. Setze EXPO_PUBLIC_SUPABASE_URL und EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
  store: {
    title: "Geschäft auswählen",
    intro: "Wähle das Geschäft, bei dem du deine Artikel abgibst.",
    search: "Geschäft suchen",
    empty: "Kein Geschäft entspricht der Suche.",
    failed: "Die Geschäfte konnten nicht geladen werden. Prüfe die Verbindung.",
  },
  login: {
    title: "Anmelden",
    email: "E-Mail",
    password: "Passwort",
    submit: "Anmelden",
    changeStore: "Geschäft wechseln",
    forgot: "Passwort vergessen?",
    failed: "E-Mail oder Passwort falsch.",
    notActivated:
      "Das Konto ist nicht aktiviert. Öffne den Aktivierungslink in der E-Mail des Geschäfts und wähle ein Passwort. Melde dich dann hier an.",
    offline: "Keine Verbindung. Versuche es erneut.",
    firstTime:
      "Zum ersten Mal hier? Aktiviere dein Konto über den Link in der E-Mail des Geschäfts und wähle ein Passwort. Melde dich dann hier an.",
  },
  mfa: {
    title: "Zwei-Faktor-Authentifizierung",
    intro: "Gib den sechsstelligen Code aus deiner Authentifizierungs-App ein.",
    code: "Code",
    submit: "Bestätigen",
    failed: "Der Code ist falsch. Versuche es erneut.",
    cancel: "Abbrechen und abmelden",
  },
  account: {
    missing:
      "Du hast mit dieser E-Mail-Adresse kein Verkäuferkonto bei {store}. Kontaktiere das Geschäft oder wähle ein anderes.",
    logout: "Abmelden",
  },
  tabs: {
    store: "Geschäft",
    items: "Meine Artikel",
    overview: "Übersicht",
    money: "Guthaben",
    profile: "Profil",
  },
  soon: "Diese Ansicht wird im nächsten Schritt erstellt.",
  profile: {
    signedInAs: "Angemeldet als",
    store: "Geschäft",
    back: "Zurück zum Profil",
    logoutFailed: "Abmelden fehlgeschlagen. Versuche es erneut.",
  },
} satisfies Dictionary;
