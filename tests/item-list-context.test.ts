import assert from "node:assert/strict";
import test from "node:test";
import { compilePreview } from "./helpers/compile-preview.ts";
import { hasVerifiedEmail } from "../src/lib/identity-gates.ts";

const store = { id: "store-a", name: "Synthetic store A", slug: "store-a" };
const otherStore = {
  id: "store-b",
  name: "Synthetic store B",
  slug: "store-b",
};
const session = {
  user: {
    id: "seller-user",
    email: "seller@example.test",
    email_confirmed_at: "2026-11-19",
  },
};
const tick = () => new Promise<void>((resolve) => setImmediate(resolve));

test("the selected store wins over a stale central source parameter", () => {
  let current: any = { store: null, session, account: null };
  const screen = compilePreview("app/(tabs)/items.tsx", {
    "expo-router": { useLocalSearchParams: () => ({ source: "komisio" }) },
    "@/lib/i18n": { useI18n: () => ({ d: { tabs: { items: "My items" } } }) },
    "@/lib/session": { useSession: () => current },
    "@/lib/identity-gates": { hasVerifiedEmail },
    "@/components/seller-gate": { SellerGate: "Gate" },
    "@/components/seller-items": { SellerItems: "StoreItems" },
    "@/components/store-introduction": { StoreIntroduction: "Introduction" },
    "@/components/external-items-screen": {
      ExternalItemsScreen: "CentralItems",
    },
    "@/components/login-options": { LoginOptions: "Login" },
    "@/components/ui": { Screen: "Screen" },
    "@/components/external-flow-error": { ExternalFlowError: "Error" },
  });
  assert.equal(screen.default().type, "CentralItems");
  current = {
    store,
    session,
    account: { tenantId: store.id, sellerId: "seller-a" },
  };
  const chosen = screen.default();
  assert.equal(chosen.type, "Gate");
  assert.equal(chosen.props.children.type, "StoreItems");
  assert.equal(chosen.props.children.props.tenant, store.id);
  assert.equal(chosen.props.children.props.seller, "seller-a");
  current.account = { tenantId: otherStore.id, sellerId: "seller-b" };
  assert.equal(
    screen.default().props.children,
    false,
    "Never render another tenant's account",
  );
  current = { ...current, session: null };
  assert.equal(screen.default().type, "Introduction");
  current = { ...current, store: null };
  assert.equal(screen.default().type, "Screen");
});

test("explicit central links select Komisio once and retain their request without a source override", () => {
  let active: typeof store | null = store;
  const effects: (() => void)[] = [];
  const selected: (typeof store | null)[] = [];
  const screen = compilePreview("app/external-items.tsx", {
    react: { useEffect: (fn: () => void) => effects.push(fn) },
    "expo-router": {
      Redirect: "Redirect",
      useLocalSearchParams: () => ({ sent: "request-a", request: "request-a" }),
    },
    "@/lib/session": {
      useSession: () => ({
        store: active,
        chooseStore: (next: typeof store | null) => {
          active = next;
          selected.push(next);
        },
      }),
    },
    "@/components/ui": { Loading: "Loading" },
  });
  assert.equal(screen.default().type, "Loading");
  effects.shift()!();
  const redirected = screen.default();
  effects.shift()!();
  assert.deepEqual(selected, [null]);
  assert.equal(redirected.type, "Redirect");
  assert.equal(redirected.props.href.pathname, "/(tabs)/items");
  assert.equal(redirected.props.href.params.request, "request-a");
  assert.equal(redirected.props.href.params.sent, "request-a");
  assert.equal(redirected.props.href.params.source, undefined);
});

test("the visible picker switches back to the remembered store and clears stale request hints", () => {
  let active: typeof store | null = store;
  const params: any[] = [],
    routes: any[] = [];
  const picker = compilePreview("components/item-list-context-picker.tsx", {
    "react-native": { View: "View" },
    "expo-router": {
      router: {
        setParams: (p: unknown) => params.push(p),
        push: (p: unknown) => routes.push(p),
      },
    },
    "@/lib/i18n": {
      useI18n: () => ({ d: { login: { changeStore: "Choose store" } } }),
    },
    "@/lib/session": {
      useSession: () => ({
        store: active,
        lastStore: store,
        session,
        chooseStore: (next: typeof store | null) => {
          active = next;
        },
      }),
    },
    "@/lib/identity-gates": { hasVerifiedEmail },
    "./ui": { Button: "Button", Choice: "Choice", uiStyles: {} },
  });
  let rendered = picker.ItemListContextPicker();
  let choices = rendered.props.children[0].props.children;
  assert.equal(choices[1].props.label, store.name);
  assert.equal(choices[1].props.selected, true);
  choices[0].props.onPress();
  assert.equal(active, null);
  rendered = picker.ItemListContextPicker();
  choices = rendered.props.children[0].props.children;
  assert.equal(choices[0].props.selected, true);
  assert.equal(choices[1].props.label, store.name);
  choices[1].props.onPress();
  assert.equal(active, store);
  assert.equal(params.length, 2);
  assert.equal(params[1].request, undefined);
  assert.equal(params[1].source, undefined);
  rendered.props.children[1].props.onPress();
  assert.equal(routes[0], "/home/stores");
});

function provider(saved: Record<string, string>) {
  const storage = new Map(Object.entries(saved));
  const slots: any[] = [],
    effects: (() => unknown)[] = [];
  let cursor = 0,
    mounting = true;
  const nextSlot = (initial: unknown) => {
    const index = cursor++;
    if (!(index in slots)) slots[index] = initial;
    return index;
  };
  const auth = {
    getState: () => ({ status: "ready", session: null, mfaRequired: false }),
    subscribe: () => () => {},
    start: () => () => {},
    refresh: async () => {},
  };
  const module = compilePreview("lib/session.tsx", {
    react: {
      createContext: () => ({ Provider: "Provider" }),
      useState: (initial: unknown) => {
        const index = nextSlot(initial);
        return [
          slots[index],
          (next: unknown) => {
            slots[index] = next;
          },
        ];
      },
      useRef: (initial: unknown) => slots[nextSlot({ current: initial })],
      useCallback: (fn: unknown) => fn,
      useEffect: (fn: () => unknown) => {
        if (mounting) effects.push(fn);
      },
      useSyncExternalStore: (_: unknown, read: () => unknown) => read(),
    },
    "./supabase": {
      supabase: {
        auth: {
          onAuthStateChange: () => ({
            data: { subscription: { unsubscribe() {} } },
          }),
        },
      },
    },
    "./secure-storage": {
      secureStorage: {
        getItem: async (key: string) => storage.get(key) ?? null,
        setItem: async (key: string, value: string) => {
          storage.set(key, value);
        },
        removeItem: async (key: string) => {
          storage.delete(key);
        },
      },
    },
    "./auth-bootstrap": { createAuthBootstrap: () => auth },
    "./command-storage": { setCommandUser() {} },
    "./push-runtime": { sellerPush: {} },
    "./identity-gates": { hasVerifiedEmail },
    "./apple-credential": { watchAppleRevocation() {} },
  });
  const render = () => {
    cursor = 0;
    const value = module.SessionProvider({ children: null }).props.value;
    mounting = false;
    return value;
  };
  render();
  effects.forEach((fn) => fn());
  return { render, storage };
}

test("central intake retains the previous store and rapid switches persist the final choice", async () => {
  const p = provider({ "komisio.store": JSON.stringify(store) });
  await tick();
  assert.equal(p.render().store.id, store.id);
  assert.equal(p.render().lastStore.id, store.id);
  p.render().chooseStore(null);
  await tick();
  assert.equal(p.storage.has("komisio.store"), false);
  assert.equal(JSON.parse(p.storage.get("komisio.lastStore")!).id, store.id);
  p.render().chooseStore(otherStore);
  p.render().chooseStore(null);
  p.render().chooseStore(store);
  p.render().chooseStore(null);
  await tick();
  assert.equal(p.render().store, null);
  assert.equal(p.render().lastStore.id, store.id);
  assert.equal(p.storage.has("komisio.store"), false);
  assert.equal(JSON.parse(p.storage.get("komisio.lastStore")!).id, store.id);
  const restored = provider(Object.fromEntries(p.storage));
  await tick();
  assert.equal(restored.render().store, null);
  assert.equal(restored.render().lastStore.id, store.id);
});

test("choosing a store from either My items or Home opens the seller's own items", () => {
  let returnTo: string | undefined = "items",
    cursor = 0;
  const routes: string[] = [],
    chosen: unknown[] = [];
  const screen = compilePreview("components/store-picker-screen.tsx", {
    react: {
      useEffect() {},
      useState: () =>
        [[store], false, "", 0].map((v) => [v, () => {}])[cursor++],
    },
    "expo-router": {
      useLocalSearchParams: () => ({ returnTo }),
      router: {
        push: (p: string) => routes.push(p),
        dismissTo: (p: string) => routes.push(p),
      },
    },
    "react-native": { View: "View", StyleSheet: { create: (s: unknown) => s } },
    "@/lib/supabase": { supabase: {}, supabaseConfigured: true },
    "@/lib/i18n": { useI18n: () => ({ d: { store: {} } }) },
    "@/lib/session": {
      useSession: () => ({
        session,
        chooseStore: (s: unknown) => chosen.push(s),
      }),
    },
    "@/components/language-picker": { LanguagePicker: "Language" },
    "@/lib/identity-gates": { hasVerifiedEmail },
    "@/components/ui": {
      Button: "Button",
      NavigationRow: "Row",
      Field: "Field",
      Loading: "Loading",
      Message: "Message",
      Screen: "Screen",
    },
  });
  function choose() {
    cursor = 0;
    const root = screen.default();
    const fragment = root.props.children[1];
    const list = fragment.props.children[2];
    list.props.children[0].props.onPress();
  }
  choose();
  assert.equal(routes[0], "/(tabs)/items");
  returnTo = undefined;
  choose();
  assert.equal(routes[1], "/(tabs)/items");
  assert.equal(chosen.length, 2);
});
