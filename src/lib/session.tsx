import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { secureStorage } from "./secure-storage";

export type AppStore = { id: string; name: string; slug: string };
export type SellerAccount = {
  tenantId: string;
  sellerId: string;
  storeName: string;
};

const STORE_KEY = "komisio.store";

type State = {
  ready: boolean;
  store: AppStore | null;
  session: Session | null;
  mfaRequired: boolean;
  // undefined while loading; null when the seller has no account in the
  // store; "failed" when the lookup could not be made.
  account: SellerAccount | null | "failed" | undefined;
  retryAccount: () => void;
  chooseStore: (store: AppStore | null) => void;
  refreshAssurance: () => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<State | null>(null);

function isStore(value: unknown): value is AppStore {
  const v = value as AppStore;
  return (
    typeof v?.id === "string" &&
    typeof v.name === "string" &&
    typeof v.slug === "string"
  );
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [storeLoaded, setStoreLoaded] = useState(false);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [store, setStore] = useState<AppStore | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [lookup, setLookup] = useState<{
    key: string;
    account: SellerAccount | null | "failed";
  } | null>(null);
  const [attempt, setAttempt] = useState(0);

  const refreshAssurance = useCallback(async () => {
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    setMfaRequired(
      data?.nextLevel === "aal2" && data.currentLevel !== "aal2",
    );
  }, []);

  useEffect(() => {
    secureStorage
      .getItem(STORE_KEY)
      .then((raw) => {
        try {
          const parsed: unknown = raw ? JSON.parse(raw) : null;
          if (isStore(parsed)) setStore(parsed);
        } catch {}
      })
      .finally(() => setStoreLoaded(true));
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) await refreshAssurance();
      setSessionLoaded(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (next) void refreshAssurance();
      else setMfaRequired(false);
    });
    return () => data.subscription.unsubscribe();
  }, [refreshAssurance]);

  // The seller account in the chosen store, once fully signed in.
  const accountKey =
    session && !mfaRequired && store
      ? `${session.user.id}:${store.id}:${attempt}`
      : null;
  useEffect(() => {
    if (!accountKey || !store) return;
    let current = true;
    supabase.rpc("my_seller_accounts").then(({ data, error }) => {
      if (!current) return;
      const accounts = (data ?? []) as SellerAccount[];
      setLookup({
        key: accountKey,
        account: error
          ? "failed"
          : (accounts.find((a) => a.tenantId === store.id) ?? null),
      });
    });
    return () => {
      current = false;
    };
  }, [accountKey, store]);
  const account =
    lookup && lookup.key === accountKey ? lookup.account : undefined;

  const chooseStore = (next: AppStore | null) => {
    setStore(next);
    if (next) void secureStorage.setItem(STORE_KEY, JSON.stringify(next));
    else void secureStorage.removeItem(STORE_KEY);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <SessionContext.Provider
      value={{
        ready: storeLoaded && sessionLoaded,
        store,
        session,
        mfaRequired,
        account,
        retryAccount: () => setAttempt((n) => n + 1),
        chooseStore,
        refreshAssurance,
        signOut,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession outside SessionProvider");
  return value;
}
