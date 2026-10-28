export const bankCopy = {
  sv: {
    title: "Utbetalningskonto",
    back: "Tillbaka",
    intro: "Kontot som butiken använder för bankutbetalningar.",
    holder: "Kontohavare",
    country: "Kontots land",
    countrySearch: "Sök land eller landskod",
    noCountries: "Inga länder matchar sökningen.",
    moreCountries: "Sök för att begränsa listan.",
    kind: "Kontotyp",
    iban: "IBAN",
    local: "Lokalt bankkonto",
    account: "Kontonummer",
    routing: "Clearingnummer / bankkod (om det behövs)",
    save: "Spara konto",
    missing: "Du har inte sparat något utbetalningskonto ännu.",
    invalid:
      "Kontrollera kontohavare, land och kontonummer. IBAN måste vara giltigt och tillhöra valt land.",
    failed: "Kontot kunde inte hämtas. Försök igen.",
    denied: "Du har inte längre tillgång till detta säljarkonto.",
    notConfigured:
      "Det går inte att ändra kontot i appen just nu. Använd säljarportalen eller kontakta butiken.",
    pending:
      "Den här ändringen väntar på bekräftelse. Försök med samma ändring igen innan du gör en ny.",
    pendingTitle: "Ändring som väntar",
    retrySame: "Försök med samma ändring igen",
    saved: "Utbetalningskontot är sparat.",
    changed:
      "Kontot ändrades på annat håll. Läs in de senaste uppgifterna och granska dem innan du sparar igen.",
    refresh: "Läs in aktuellt konto",
    cleanupSuccess:
      "Kontot är sparat, men appen kunde inte avsluta den lokala hanteringen. Försök igen innan du gör fler ändringar.",
    cleanupConflict:
      "Kontot ändrades på annat håll. Appen behöver avsluta den lokala hanteringen innan du kan fortsätta.",
    finish: "Avsluta ändringen",
    storage:
      "Appen kan inte läsa eller säkra den väntande ändringen. Försök igen. Rensa inte appens lagring medan en ändring väntar på bekräftelse.",
    busy: "En ändring hanteras redan i en annan vy. Vänta och försök igen.",
    unsupported:
      "Den här webbläsaren kan inte spara kontoändringar säkert. Använd säljarportalen.",
    auth: "Logga in igen med samma konto och återvänd hit för att bekräfta den väntande ändringen.",
    mfa: "Bekräfta inloggningen med tvåstegsverifiering och återvänd hit för att försöka igen.",
    verify: "Kontrollera inloggningen",
    recovery:
      "Slutför lösenordsbytet i portalen, logga sedan in igen och återvänd hit.",
  },
  en: {
    title: "Payout account",
    back: "Back",
    intro: "The account the store uses for bank payouts.",
    holder: "Account holder",
    country: "Account country",
    countrySearch: "Search country or country code",
    noCountries: "No countries match your search.",
    moreCountries: "Search to narrow the list.",
    kind: "Account type",
    iban: "IBAN",
    local: "Local bank account",
    account: "Account number",
    routing: "Routing / bank code (if needed)",
    save: "Save account",
    missing: "You have not saved a payout account yet.",
    invalid:
      "Check the account holder, country and account number. IBAN must be valid and match the selected country.",
    failed: "The account could not be loaded. Try again.",
    denied: "You no longer have access to this seller account.",
    notConfigured:
      "Account changes are not available in the app right now. Use the seller portal or contact the store.",
    pending:
      "This change is awaiting confirmation. Retry the same change before making another one.",
    pendingTitle: "Pending change",
    retrySame: "Retry the same change",
    saved: "Your payout account has been saved.",
    changed:
      "The account changed elsewhere. Load the latest details and review them before saving again.",
    refresh: "Load current account",
    cleanupSuccess:
      "The account was saved, but the app could not finish its local record. Try again before making more changes.",
    cleanupConflict:
      "The account changed elsewhere. The app needs to finish its local record before you can continue.",
    finish: "Finish change",
    storage:
      "The app cannot read or safely store the pending change. Try again. Do not clear app storage while a change is awaiting confirmation.",
    busy: "Another view is already handling a change. Wait and try again.",
    unsupported:
      "This browser cannot safely save account changes. Use the seller portal.",
    auth: "Log in again with the same account and return here to confirm the pending change.",
    mfa: "Confirm your login with two-step verification and return here to retry.",
    verify: "Check login",
    recovery:
      "Finish resetting your password in the portal, then log in again and return here.",
  },
};
