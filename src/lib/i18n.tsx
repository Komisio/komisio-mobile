import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getLocales } from "expo-localization";
import { secureStorage } from "./secure-storage";
import { dictionaries, type Dictionary } from "./dictionaries";
import { matchLocale, type Locale } from "./locale";
export { dictionaries } from "./dictionaries";
export { locales, type Locale } from "./locale";
export type { Dictionary } from "./dictionaries";
const KEY = "komisio.locale";

function deviceLocale(): Locale {
  return (
    getLocales()
      .map((item) => matchLocale(item.languageCode))
      .find(Boolean) ?? "sv"
  );
}

const I18n = createContext<{
  locale: Locale;
  d: Dictionary;
  setLocale: (locale: Locale) => void;
  saveFailed: boolean;
}>({
  locale: "sv",
  d: dictionaries.sv,
  setLocale: () => {},
  saveFailed: false,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(deviceLocale);
  const [saveFailed, setSaveFailed] = useState(false);
  const revision = useRef(0);
  const saves = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    void secureStorage
      .getItem(KEY)
      .then((saved) => {
        const restored = matchLocale(saved);
        if (active && revision.current === 0 && restored)
          setLocaleState(restored);
      })
      .catch(() => {
        /* Device language remains usable if storage cannot be read. */
      });
    return () => {
      active = false;
    };
  }, []);
  const setLocale = (next: Locale) => {
    const request = ++revision.current;
    setLocaleState(next);
    setSaveFailed(false);
    // SecureStore writes include remove/set steps; preserve selection order.
    saves.current = saves.current
      .then(() => secureStorage.setItem(KEY, next))
      .catch(() => {
        if (revision.current === request) setSaveFailed(true);
      });
  };
  return (
    <I18n.Provider
      value={{ locale, d: dictionaries[locale], setLocale, saveFailed }}
    >
      {children}
    </I18n.Provider>
  );
}

export const useI18n = () => useContext(I18n);
