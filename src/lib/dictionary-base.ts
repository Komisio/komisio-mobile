import { catalogueCopy } from "./catalogue-copy.ts";
import { storeInfoCopy } from "./store-info-copy.ts";
import { sellerItemsCopy } from "./seller-items-copy.ts";
import { overviewCopy } from "./overview-copy.ts";
import { agreementCopy } from "./agreement-copy.ts";
import { bankCopy } from "./bank-copy.ts";
import { payoutCopy } from "./payout-copy.ts";
import { agreementAcceptCopy } from "./agreement-accept-copy.ts";

export const sv = {
  storeInfo: storeInfoCopy.sv,
  agreementAccept: agreementAcceptCopy.sv,
  payouts: payoutCopy.sv,
  bank: bankCopy.sv,
  agreement: agreementCopy.sv,
  overview: overviewCopy.sv,
  items: sellerItemsCopy.sv,
  catalogue: catalogueCopy.sv,
  languageName: "Svenska",
  language: "Språk",
  close: "Stäng",
  languageSaveFailed:
    "Språket ändrades men kunde inte sparas. Välj det igen för att försöka på nytt.",
  loading: "Laddar…",
  retry: "Försök igen",
  authFailed: "Inloggningen kunde inte läsas in. Försök igen.",
  notConfigured:
    "Appen saknar anslutning till Komisio. Ange EXPO_PUBLIC_SUPABASE_URL och EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
  store: {
    title: "Välj butik",
    intro: "Välj butiken där du lämnar in dina varor.",
    search: "Sök butik",
    empty: "Ingen butik matchar sökningen.",
    failed: "Butikerna kunde inte hämtas. Kontrollera anslutningen.",
  },
  login: {
    title: "Logga in",
    email: "E-post",
    password: "Lösenord",
    submit: "Logga in",
    changeStore: "Byt butik",
    forgot: "Glömt lösenordet?",
    failed: "Fel e-post eller lösenord.",
    notActivated:
      "Kontot är inte aktiverat. Öppna aktiveringslänken i mejlet från butiken och välj ett lösenord, logga sedan in här.",
    offline: "Ingen anslutning. Försök igen.",
    firstTime:
      "Första gången? Aktivera kontot via länken i mejlet från butiken och välj ett lösenord. Logga sedan in här.",
  },
  mfa: {
    title: "Tvåstegsverifiering",
    intro: "Ange den sexsiffriga koden från din autentiseringsapp.",
    code: "Kod",
    submit: "Verifiera",
    failed: "Koden stämmer inte. Försök igen.",
    cancel: "Avbryt och logga ut",
  },
  account: {
    missing:
      "Du har inget säljarkonto i {store} med den här e-postadressen. Kontakta butiken eller välj en annan butik.",
    logout: "Logga ut",
  },
  tabs: {
    store: "Butiken",
    items: "Mina varor",
    overview: "Översikt",
    money: "Pengar",
    profile: "Profil",
  },
  soon: "Den här vyn byggs i nästa steg.",
  profile: {
    signedInAs: "Inloggad som",
    store: "Butik",
    back: "Tillbaka till profil",
    logoutFailed: "Det gick inte att logga ut. Försök igen.",
  },
};

export type Dictionary = typeof sv;

export const en: Dictionary = {
  storeInfo: storeInfoCopy.en,
  agreementAccept: agreementAcceptCopy.en,
  payouts: payoutCopy.en,
  bank: bankCopy.en,
  agreement: agreementCopy.en,
  overview: overviewCopy.en,
  items: sellerItemsCopy.en,
  catalogue: catalogueCopy.en,
  languageName: "English",
  language: "Language",
  close: "Close",
  languageSaveFailed:
    "The language changed but could not be saved. Select it again to retry.",
  loading: "Loading…",
  retry: "Try again",
  authFailed: "Your sign-in could not be loaded. Try again.",
  notConfigured:
    "The app is not connected to Komisio. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
  store: {
    title: "Choose store",
    intro: "Choose the store where you hand in your items.",
    search: "Search store",
    empty: "No store matches your search.",
    failed: "The stores could not be loaded. Check your connection.",
  },
  login: {
    title: "Log in",
    email: "Email",
    password: "Password",
    submit: "Log in",
    changeStore: "Change store",
    forgot: "Forgot your password?",
    failed: "Wrong email or password.",
    notActivated:
      "The account is not activated. Open the activation link in the email from the store and choose a password, then log in here.",
    offline: "No connection. Try again.",
    firstTime:
      "First time? Activate the account with the link in the email from the store and choose a password. Then log in here.",
  },
  mfa: {
    title: "Two-step verification",
    intro: "Enter the six-digit code from your authenticator app.",
    code: "Code",
    submit: "Verify",
    failed: "The code is not correct. Try again.",
    cancel: "Cancel and log out",
  },
  account: {
    missing:
      "You have no seller account at {store} with this email address. Contact the store or choose another store.",
    logout: "Log out",
  },
  tabs: {
    store: "Store",
    items: "My items",
    overview: "Overview",
    money: "Money",
    profile: "Profile",
  },
  soon: "This view is built in the next step.",
  profile: {
    signedInAs: "Signed in as",
    store: "Store",
    back: "Back to profile",
    logoutFailed: "Could not log out. Try again.",
  },
};
