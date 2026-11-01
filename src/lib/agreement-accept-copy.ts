const sv = {
  confirm:
    "Jag har läst och godkänner {title}, version {version}, på {language}.",
  accept: "Godkänn detta avtal",
  registered:
    "Godkännandet är registrerat. Läs in avtalet för att se aktuella uppgifter.",
  pending:
    "Det här godkännandet väntar på bekräftelse. Försök med samma godkännande igen innan du gör ett nytt.",
  pendingDocument: "Gäller version {version} på {language}: {title}",
  viewPending: "Visa avtalet som väntar",
  retrySame: "Försök med samma godkännande igen",
  changed:
    "Butiken har ändrat det aktuella avtalet. Läs in och granska det innan du godkänner.",
  refresh: "Läs in aktuellt avtal",
  cleanupSuccess:
    "Godkännandet är registrerat, men appen behöver avsluta den lokala hanteringen innan du fortsätter.",
  cleanupConflict:
    "Avtalet har ändrats. Avsluta den lokala hanteringen och läs sedan in aktuellt avtal.",
  finish: "Avsluta godkännandet",
  unavailable:
    "Du kan läsa avtalet här. Godkännande i appen är inte tillgängligt just nu; använd säljarportalen.",
  unsupported:
    "Den här webbläsaren kan inte spara godkännanden säkert. Använd säljarportalen.",
};
const en: typeof sv = {
  confirm: "I have read and accept {title}, version {version}, in {language}.",
  accept: "Accept this agreement",
  registered:
    "Acceptance is registered. Reload the agreement to see the current details.",
  pending:
    "This acceptance is awaiting confirmation. Retry the same acceptance before making another one.",
  pendingDocument: "For version {version} in {language}: {title}",
  viewPending: "View pending agreement",
  retrySame: "Retry the same acceptance",
  changed:
    "The store changed the current agreement. Reload and review it before accepting.",
  refresh: "Load current agreement",
  cleanupSuccess:
    "Acceptance is registered, but the app needs to finish its local record before you continue.",
  cleanupConflict:
    "The agreement changed. Finish the local record, then load the current agreement.",
  finish: "Finish acceptance",
  unavailable:
    "You can read the agreement here. Acceptance in the app is not available right now; use the seller portal.",
  unsupported:
    "This browser cannot safely store acceptances. Use the seller portal.",
};
export const agreementAcceptCopy = { sv, en };
