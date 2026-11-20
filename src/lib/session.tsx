import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import {
  readStorePreferences,
  saveStorePreferences,
  type AppStore,
} from "./store-preferences";
import { createAuthBootstrap } from "./auth-bootstrap";
import { setCommandUser } from "./command-storage";
import { sellerPush } from "./push-runtime";
import { hasVerifiedEmail } from "./identity-gates";
import { watchAppleRevocation } from "./apple-credential";

export type { AppStore } from "./store-preferences";
export type SellerAccount = {
  tenantId: string;
  sellerId: string;
  storeName: string;
};

const authState = createAuthBootstrap(supabase.auth);

type State = {
  ready: boolean;
  // The session or two-step state could not be read; retryAuth reads again.
  authFailed: boolean;
  retryAuth: () => void;
  store: AppStore | null;
  lastStore: AppStore | null;
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

export function SessionProvider({ children }: { children: ReactNode }) {
  const [storeLoaded, setStoreLoaded] = useState(false);
  const [store, setStore] = useState<AppStore | null>(null);
  const [lastStore, setLastStore] = useState<AppStore | null>(null);
  const lastStoreRef = useRef<AppStore | null>(null);
  const choseStore = useRef(false);
  const storeSaves = useRef(Promise.resolve());
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
  const appleSubject = session?.user.identities?.find(
    (i) => i.provider === "apple",
  )?.identity_data?.sub;
  const userId = session?.user.id;
  useEffect(() => {
    if (!userId || typeof appleSubject !== "string") return;
    let active = true;
    const stop = watchAppleRevocation(appleSubject, () => {
      void (async () => {
        const current = await supabase.auth.getSession();
        if (
          !active ||
          current.error ||
          current.data.session?.user.id !== userId
        )
          return;
        try {
          setCommandUser(null);
        } catch {}
        // Use Supabase's local logout, not Apple's interactive signOutAsync.
        await supabase.auth.signOut({ scope: "local" });
      })().catch(() => {});
    });
    return () => {
      active = false;
      stop();
    };
  }, [userId, appleSubject]);

  useEffect(() => {
    let mounted = true;
    readStorePreferences()
      .then(({ store, lastStore }) => {
        if (!mounted || choseStore.current) return;
        setStore(store);
        lastStoreRef.current = lastStore;
        setLastStore(lastStore);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setStoreLoaded(true);
      });
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
      mounted = false;
      stopCommands();
      data.subscription.unsubscribe();
      stopAuth();
    };
  }, []);

  // The seller account in the chosen store, once fully signed in.
  const accountKey =
    session && hasVerifiedEmail(session.user) && !mfaRequired && store
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
  const account = !accountKey
    ? null
    : lookup && lookup.key === accountKey
      ? lookup.account
      : undefined;

  const chooseStore = useCallback((next: AppStore | null) => {
    choseStore.current = true;
    setStore(next);
    if (next) {
      lastStoreRef.current = next;
      setLastStore(next);
    }
    const remembered = lastStoreRef.current;
    // Remember the store when entering Komisio; serialize rapid switches so a
    // delayed save cannot restore an earlier active store on the next launch.
    storeSaves.current = storeSaves.current
      .then(() => saveStorePreferences({ store: next, lastStore: remembered }))
      .catch(() => {});
  }, []);

  const signOut = async () => {
    const signingOut = session?.user.id;
    await sellerPush.beforeLogout();
    const current = await supabase.auth.getSession();
    if (current.error || current.data.session?.user.id !== signingOut)
      throw new Error("SESSION_CHANGED");
    // Also clear before sending logout, so an offline logout does not leave
    // account numbers on a shared browser. No payout replay IDs are removed.
    try {
      setCommandUser(null);
    } finally {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
  };

  return (
    <SessionContext.Provider
      value={{
        ready: storeLoaded && auth.status === "ready",
        authFailed: auth.status === "failed",
        retryAuth: () => void authState.retry(),
        store,
        lastStore,
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
