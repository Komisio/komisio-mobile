import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { secureStorage } from "./secure-storage";
import { createAuthBootstrap } from "./auth-bootstrap";
import { setCommandUser } from "./command-storage";

export type AppStore = { id: string; name: string; slug: string };
export type SellerAccount = {
  tenantId: string;
  sellerId: string;
  storeName: string;
};

const STORE_KEY = "komisio.store";

const authState = createAuthBootstrap(supabase.auth);

type State = {
  ready: boolean;
  // The session or two-step state could not be read; retryAuth reads again.
  authFailed: boolean;
  retryAuth: () => void;
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
  const [store, setStore] = useState<AppStore | null>(null);
  const auth = useSyncExternalStore(
    authState.subscribe,
    authState.getState,
    authState.getState,
  );
  const { session, mfaRequired } = auth;
  const [lookup, setLookup] = useState<{
    key: string;
    account: SellerAccount | null | "failed";
  } | null>(null);
  const [attempt, setAttempt] = useState(0);

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
    const stopCommands = authState.subscribe(() => {
      const current = authState.getState();
      if (current.status === "ready") {
        try {
          setCommandUser(current.session?.user.id ?? null);
        } catch {
          // Writes fail closed if browser storage cannot be cleared/read.
        }
      }
    });
    // SIGNED_OUT can originate in a different browser tab. Purge immediately,
    // before the asynchronous MFA/bootstrap refresh has resolved.
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        try {
          setCommandUser(null);
        } catch {}
      }
    });
    const stopAuth = authState.start();
    return () => {
      stopCommands();
      data.subscription.unsubscribe();
      stopAuth();
    };
  }, []);

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
    // Also clear before sending logout, so an offline logout does not leave
    // account numbers on a shared browser. No payout replay IDs are removed.
    try {
      setCommandUser(null);
    } finally {
      await supabase.auth.signOut();
    }
  };

  return (
    <SessionContext.Provider
      value={{
        ready: storeLoaded && auth.status === "ready",
        authFailed: auth.status === "failed",
        retryAuth: () => void authState.retry(),
        store,
        session,
        mfaRequired,
        account,
        retryAccount: () => setAttempt((n) => n + 1),
        chooseStore,
        refreshAssurance: authState.refresh,
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
