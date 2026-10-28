import type { Session, SupabaseClient } from "@supabase/supabase-js";

// Session and two-step state for the protected routes. "ready" is reached only
// once both are known; any failure to read them (for example a rejected
// secure-storage read) leaves the app in "failed" with a retry, never in a
// signed-in state.
export type AuthState = {
  status: "loading" | "failed" | "ready";
  session: Session | null;
  mfaRequired: boolean;
};

type Auth = Pick<
  SupabaseClient["auth"],
  "getSession" | "onAuthStateChange" | "mfa"
>;

export function createAuthBootstrap(auth: Auth) {
  let state: AuthState = { status: "loading", session: null, mfaRequired: false };
  const listeners = new Set<() => void>();
  let run = 0;
  const set = (next: AuthState) => {
    state = next;
    listeners.forEach((l) => l());
  };

  const mfaRequired = async (session: Session | null) => {
    if (!session) return false;
    const { data, error } = await auth.mfa.getAuthenticatorAssuranceLevel();
    if (error || !data) throw error ?? new Error("AAL_UNAVAILABLE");
    return data.nextLevel === "aal2" && data.currentLevel !== "aal2";
  };

  // Auth events are followed only after storage has been read once: the
  // client's own initial-session read would otherwise reject unhandled, and
  // it reports a failed read as "no session", which must not open the login
  // screen as if the state were known.
  let started = false;
  let unsubscribe: (() => void) | null = null;
  const follow = () => {
    if (!started || unsubscribe) return;
    const { data } = auth.onAuthStateChange((event, session) => {
      if (event !== "INITIAL_SESSION") void resolve(async () => session);
    });
    unsubscribe = () => data.subscription.unsubscribe();
  };

  // The latest call wins, so a slow earlier read cannot overwrite a newer one.
  const resolve = async (read: () => Promise<Session | null>) => {
    const id = ++run;
    try {
      const session = await read();
      const required = await mfaRequired(session);
      if (id === run) set({ status: "ready", session, mfaRequired: required });
      follow();
    } catch {
      if (id === run) set({ status: "failed", session: null, mfaRequired: false });
    }
  };

  const readSession = async () => {
    const { data, error } = await auth.getSession();
    if (error) throw error;
    return data.session;
  };

  return {
    getState: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    start() {
      started = true;
      void resolve(readSession);
      return () => {
        started = false;
        unsubscribe?.();
        unsubscribe = null;
      };
    },
    retry() {
      set({ status: "loading", session: null, mfaRequired: false });
      return resolve(readSession);
    },
    refresh: () => resolve(readSession),
  };
}
