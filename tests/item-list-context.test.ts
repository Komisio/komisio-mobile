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
    "@/lib/store-seller-copy": {
      storeSellerCopy: {
        sv: {
          handInInfo: "Inlämning och butiksinformation",
          chooseAnother: "Välj annan butik",
        },
      },
    },
    "./brand": { InfoIcon: "InfoIcon" },
    "./store-information": { StoreInformation: "StoreInformation" },
    "react-native": { View: "View" },
    "expo-router": {
      router: {
        setParams: (p: unknown) => params.push(p),
        push: (p: unknown) => routes.push(p),
      },
    },
    "@/lib/i18n": {
      useI18n: () => ({ locale: "sv", d: { store: { title: "Välj butik" } } }),
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
    "./ui": {
      Button: "Button",
      Choice: "Choice",
      ItemCard: "ItemCard",
      uiStyles: {},
    },
  });
  let rendered = picker.ItemListContextPicker();
  let choices = rendered.props.children[0].props.children;
  assert.equal(choices[1].props.label, store.name);
  assert.equal(choices[1].props.selected, true);
  assert.match(rendered.props.children[1].props.label, new RegExp(store.name));
  rendered.props.children[1].props.onPress();
  assert.equal(routes.shift(), "/store-info");
  assert.equal(rendered.props.children[2].props.label, "Välj annan butik");
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
  rendered.props.children[2].props.onPress();
  assert.equal(routes[0], "/home/stores");
});

function provider(
  saved: Record<string, string>,
  documents?: Map<string, string>,
) {
  const storage = new Map(Object.entries(saved));
  const preferences = compilePreview("lib/store-preferences.ts", {
    "react-native": { Platform: { OS: documents ? "ios" : "android" } },
    "./secure-storage": {
      secureStorage: {
        getItem: async (key: string) => storage.get(key) ?? null,
        setItem: async (key: string, value: string) => storage.set(key, value),
        removeItem: async (key: string) => storage.delete(key),
      },
    },
    "expo-file-system": {
      Paths: { document: "app-documents" },
      File: class File {
        readonly name: string;
        constructor(directory: string, name: string) {
          assert.equal(directory, "app-documents");
          this.name = name;
        }
        get exists() {
          return documents!.has(this.name);
        }
        async text() {
          return documents!.get(this.name);
        }
        create() {
          documents!.set(this.name, "");
        }
        async write(value: string) {
          documents!.set(this.name, value);
        }
        async move(dest: File) {
          documents!.set(dest.name, documents!.get(this.name)!);
          documents!.delete(this.name);
        }
      },
    },
  });
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
    "./store-preferences": preferences,
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

test("iOS remembers the selected store until the app is deleted, even when the old Keychain survives", async () => {
  const keychain = {
    "komisio.store": JSON.stringify(store),
    "komisio.lastStore": JSON.stringify(store),
  };
  const documents = new Map<string, string>();
  const installed = provider(keychain, documents);
  await tick();
  assert.equal(installed.render().store, null);
  assert.equal(installed.render().lastStore, null);
  installed.render().chooseStore(otherStore);
  await tick();
  const reopened = provider(keychain, documents);
  await tick();
  assert.equal(reopened.render().store.id, otherStore.id);
  reopened.render().chooseStore(null);
  await tick();
  const updated = provider(keychain, documents);
  await tick();
  assert.equal(updated.render().store, null);
  assert.equal(updated.render().lastStore.id, otherStore.id);
  const reinstalled = provider(keychain, new Map());
  await tick();
  assert.equal(reinstalled.render().store, null);
  assert.equal(reinstalled.render().lastStore, null);
});
