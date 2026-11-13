import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { router } from "expo-router";
import { useSession, type SellerAccount, type AppStore } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { sellerPush } from "@/lib/push-runtime";
import {
  clearPushResponse,
  configurePushChannels,
  observePush,
} from "@/lib/push-native";
import {
  parsePushData,
  type PushData,
  type SellerPushData,
} from "@/lib/push-contract";
import { externalRequestApi } from "@/lib/external-submission-runtime";
import { externalOfferApi } from "@/lib/external-offer-runtime";
import { hasVerifiedPhone } from "@/lib/identity-gates";
import {
  ownsPush,
  pushDestination,
  externalPushDestination,
} from "@/lib/push-routing";
import { pushCopy } from "@/lib/push-copy";

export function PushBridge() {
  const state = useSession();
  const { locale } = useI18n();
  const user =
    state.ready && !state.mfaRequired ? (state.session?.user.id ?? null) : null;
  const latest = useRef(state);
  useEffect(() => {
    latest.current = state;
  }, [state]);
  const accounts = useRef<{ user: string; values: SellerAccount[] } | null>(
    null,
  );
  const seen = useRef(new Set<string>());
  const handled = useRef<PushData | null>(null);
  const [pending, setPending] = useState<PushData | null>(null);
  const [target, setTarget] = useState<{
    user: string;
    payload: SellerPushData;
    store: AppStore;
  } | null>(null);
  const [resume, setResume] = useState(0);
  useEffect(() => {
    configurePushChannels(pushCopy[locale].registered, pushCopy[locale].sold);
    void sellerPush.setContext(user, locale === "da" ? "dk" : locale);
  }, [user, locale]);
  useEffect(() => {
    if (
      state.ready &&
      !state.authFailed &&
      !state.mfaRequired &&
      AppState.currentState === "active"
    )
      void sellerPush.requestLaunchPermission();
  }, [state.ready, state.authFailed, state.mfaRequired, user, resume]);
  useEffect(() => {
    const stop = observePush(
      (data) => {
        const p = parsePushData(data);
        if (!p || seen.current.has(p.notificationId)) {
          clearPushResponse();
          return;
        }
        setPending(p);
      },
      () => {
        void sellerPush.refresh();
      },
      (data) => {
        const current = latest.current;
        const payload = parsePushData(data);
        if (payload?.v === 2)
          return Boolean(
            current.ready &&
            !current.mfaRequired &&
            hasVerifiedPhone(current.session?.user) &&
            current.session?.user.id === payload.ownerId &&
            sellerPush.getSnapshot().status === "on",
          );
        return Boolean(
          current.ready &&
          !current.mfaRequired &&
          current.session?.user.id === accounts.current?.user &&
          sellerPush.getSnapshot().status === "on" &&
          ownsPush(data, accounts.current?.values ?? []),
        );
      },
    );
    const app = AppState.addEventListener("change", (status) => {
      if (status === "active") {
        void sellerPush.refresh();
        setResume((n) => n + 1);
      }
    });
    return () => {
      stop();
      app.remove();
    };
  }, []);
  useEffect(() => {
    if (!user) {
      accounts.current = null;
      return;
    }
    let active = true;
    void supabase.rpc("my_seller_accounts").then(({ data, error }) => {
      if (!active) return;
      accounts.current = error ? null : { user, values: data ?? [] };
      if (!error && Array.isArray(data) && data.length > 0)
        void sellerPush.requestInitialPermission(user);
    });
    return () => {
      active = false;
    };
  }, [user, resume]);
  // Resolve under the current authenticated identity, including notifications
  // tapped before login/MFA. Payload IDs never grant access or contain routes.
  useEffect(() => {
    if (!user || !pending) return;
    let active = true;
    if (pending.v === 2) {
      // Payloads select a record; authenticated reads prove ownership and the
      // request/offer binding before navigation. Never change the store context.
      void (async () => {
        if (pending.ownerId !== user) {
          if (active) {
            setPending(null);
            clearPushResponse();
          }
          return;
        }
        try {
          const destination = await externalPushDestination(
            pending,
            user,
            (id) => externalRequestApi(user).lookup(id),
            (id) => externalOfferApi(user).read(id),
          );
          if (
            !active ||
            latest.current.session?.user.id !== user ||
            latest.current.mfaRequired
          )
            return;
          setPending(null);
          clearPushResponse();
          if (!destination) return;
          seen.current.add(pending.notificationId);
          if (seen.current.size > 100)
            seen.current.delete(seen.current.values().next().value!);
          router.push(destination);
        } catch {
          /* Keep a tap pending for retry on foreground/network recovery. */
        }
      })();
      return () => {
        active = false;
      };
    }
    void Promise.all([
      supabase.rpc("my_seller_accounts"),
      supabase.rpc("public_app_stores"),
    ]).then(([a, s]) => {
      if (!active || a.error || s.error) return; // retry on resume; do not lose a tap on network failure
      const store = pushDestination(pending, a.data ?? [], s.data ?? []);
      setPending(null);
      if (!store) {
        clearPushResponse();
        return;
      }
      setTarget({ user, payload: pending, store });
      latest.current.chooseStore(store);
    });
    return () => {
      active = false;
    };
  }, [pending, user, resume]);
  useEffect(() => {
    if (!target || !user || handled.current === target.payload) return;
    if (target.user !== user) {
      handled.current = target.payload;
      clearPushResponse();
      return;
    }
    if (
      state.store?.id !== target.store.id ||
      state.account === undefined ||
      state.account === "failed"
    )
      return;
    if (
      state.account?.sellerId === target.payload.sellerId &&
      !seen.current.has(target.payload.notificationId)
    ) {
      seen.current.add(target.payload.notificationId);
      if (seen.current.size > 100)
        seen.current.delete(seen.current.values().next().value!);
      router.push({
        pathname: "/my-items/[tenant]/[item]",
        params: { tenant: target.store.id, item: target.payload.itemId },
      });
    }
    handled.current = target.payload;
    clearPushResponse();
  }, [target, user, state.store, state.account]);
  return null;
}
