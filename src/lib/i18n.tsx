import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getLocales } from "expo-localization";
import { secureStorage } from "./secure-storage";
import { catalogueCopy } from "./catalogue-copy";
import { sellerItemsCopy } from "./seller-items-copy";
import { overviewCopy } from "./overview-copy";

const sv = {
  overview: overviewCopy.sv,
  items: sellerItemsCopy.sv,
  catalogue: catalogueCopy.sv,
  languageName: "Svenska",
  language: "Språk",
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
  profile: { signedInAs: "Inloggad som", store: "Butik" },
};

export type Dictionary = typeof sv;

const en: Dictionary = {
  overview: overviewCopy.en,
  items: sellerItemsCopy.en,
  catalogue: catalogueCopy.en,
  languageName: "English",
  language: "Language",
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
  profile: { signedInAs: "Signed in as", store: "Store" },
};

export const dictionaries = { sv, en } as const;
export type Locale = keyof typeof dictionaries;
export const locales = Object.keys(dictionaries) as Locale[];

const KEY = "komisio.locale";

function deviceLocale(): Locale {
  const code = getLocales()[0]?.languageCode;
  return locales.includes(code as Locale) ? (code as Locale) : "sv";
}

const I18n = createContext<{
  locale: Locale;
  d: Dictionary;
  setLocale: (locale: Locale) => void;
}>({ locale: "sv", d: sv, setLocale: () => {} });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(deviceLocale);
  useEffect(() => {
    secureStorage.getItem(KEY).then((saved) => {
      if (saved && locales.includes(saved as Locale))
        setLocaleState(saved as Locale);
    });
  }, []);
  const setLocale = (next: Locale) => {
    setLocaleState(next);
    void secureStorage.setItem(KEY, next);
  };
  return (
    <I18n.Provider value={{ locale, d: dictionaries[locale], setLocale }}>
      {children}
    </I18n.Provider>
  );
}

export const useI18n = () => useContext(I18n);
