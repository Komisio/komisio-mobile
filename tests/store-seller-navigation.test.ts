import test from "node:test";
import assert from "node:assert/strict";
import { compilePreview } from "./helpers/compile-preview.ts";
import { hasVerifiedEmail } from "../src/lib/identity-gates.ts";
import { storeSellerCopy } from "../src/lib/store-seller-copy.ts";

const store = { id: "store-a", name: "Example store", slug: "example" };
const user = {
  id: "user-a",
  email: "seller@example.test",
  email_confirmed_at: "2026-11-19",
};

test("the store card opens the named store, restores it from central, or opens the picker on first use", () => {
  let active: typeof store | null = store;
  let previous: typeof store | null = store;
  const routes: string[] = [];
  const home = compilePreview("components/home-screen.tsx", {
    "expo-image": { Image: "Image" },
    "expo-router": {
      router: {
        navigate: (s: string) => routes.push(s),
        push: (s: string) => routes.push(s),
      },
    },
    "react-native": { StyleSheet: { create: (s: unknown) => s }, Text: "Text" },
    "@/lib/session": {
      useSession: () => ({
        store: active,
        lastStore: previous,
        chooseStore: (s: typeof active) => {
          active = s;
        },
      }),
    },
    "@/lib/i18n": { useI18n: () => ({ locale: "sv" }) },
    "@/lib/home-copy": { homeCopy: () => ({ store: "Sälj via en butik" }) },
    "@/lib/account-auth-copy": { accountAuthCopy: () => ({}) },
    "../../assets/photos/home-dress.png": "image",
    "./ui": {
      Button: "Button",
      ItemCard: "ItemCard",
      Screen: "Screen",
      uiStyles: {},
    },
  });
  const card = () => home.HomeScreen().props.children[3];
  assert.match(card().props.label, /Example store/);
  card().props.onPress();
  active = null;
  card().props.onPress();
  assert.deepEqual(active, store);
  active = previous = null;
  card().props.onPress();
  assert.deepEqual(routes, ["/(tabs)/items", "/(tabs)/items", "/home/stores"]);
});

test("only the linked seller's confirmed disabled policy shows the digital submission notice", async () => {
  let disabled = false;
  let onFocus: () => () => void;
  let result: any;
  const notice = compilePreview(
    "components/store-submission-notice.tsx",
    {
      react: {
        useState: () => [
          disabled,
          (v: boolean) => {
            disabled = v;
          },
        ],
        useCallback: (f: unknown) => f,
      },
      "expo-router": {
        useFocusEffect: (f: () => () => void) => {
          onFocus = f;
        },
      },
      "react-native": { Text: "Text" },
      "./ui": { uiStyles: {} },
      "@/lib/i18n": { useI18n: () => ({ locale: "sv" }) },
      "@/lib/store-seller-copy": { storeSellerCopy },
      "@/lib/supabase": {
        supabase: {
          rpc: (name: string, args: any) => {
            assert.equal(name, "my_submission_settings");
            assert.equal(args.p_tenant, "tenant-a");
            assert.equal(args.p_seller, "seller-a");
            return { abortSignal: async () => result };
          },
        },
      },
    },
    { AbortController },
  );
  const render = () =>
    notice.StoreSubmissionNotice({ tenant: "tenant-a", seller: "seller-a" });
  for (const [response, expected] of [
    [{ data: { enabled: false } }, true],
    [{ data: { enabled: true } }, false],
    [{ data: null, error: {} }, false],
    [{ data: {} }, false],
  ] as const) {
    result = response;
    render();
    const cleanup = onFocus!();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(
      render()?.props.children ?? null,
      expected ? storeSellerCopy.sv.photosOff : null,
    );
    cleanup();
  }
  result = { data: { enabled: false } };
  render();
  onFocus!()();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(render(), null);
});

test("old catalogue routes resume My items without reading catalogue data", () => {
  for (const file of [
    "app/(tabs)/home/shop.tsx",
    "app/catalogue/[tenant]/[item].tsx",
  ]) {
    const route = compilePreview(file, {
      "expo-router": { Redirect: "Redirect" },
    });
    const rendered = route.default();
    assert.equal(rendered.type, "Redirect");
    assert.equal(rendered.props.href, "/(tabs)/items");
  }
});

test("store introduction resumes sign-in at own items and does not grant seller membership", () => {
  let session: any = null;
  const routes: any[] = [];
  const component = compilePreview("components/store-introduction.tsx", {
    "react-native": { Text: "Text" },
    "expo-router": { router: { push: (p: unknown) => routes.push(p) } },
    "@/lib/session": { useSession: () => ({ store, session }) },
    "@/lib/i18n": {
      useI18n: () => ({ locale: "sv", d: { tabs: { items: "Mina varor" } } }),
    },
    "@/lib/identity-gates": { hasVerifiedEmail },
    "@/lib/home-copy": { homeCopy: () => ({ login: "Logga in" }) },
    "@/lib/store-seller-copy": { storeSellerCopy },
    "./store-information": { StoreInformation: "PublicStore" },
    "./item-list-context-picker": { ItemListContextPicker: "Picker" },
    "./ui": { Button: "Button", Card: "Card", uiStyles: {} },
  });
  let tree = component.StoreIntroduction();
  assert.equal(tree.type, "PublicStore");
  assert.equal(tree.props.store, store);
  assert.equal(tree.props.children[0].type, "Picker");
  tree.props.children[1].props.children[2].props.onPress();
  assert.equal(routes[0].pathname, "/account-auth");
  assert.equal(routes[0].params.returnTo, "items");
  assert.equal(
    tree.props.children[2].props.children[1].props.children,
    storeSellerCopy.sv.contactStore,
  );
  session = { user: { id: "unverified-user" } };
  tree = component.StoreIntroduction();
  tree.props.children[1].props.children[2].props.onPress();
  assert.equal(routes[1].pathname, "/login");
  session = { user };
  tree = component.StoreIntroduction();
  assert.equal(tree.props.children[1], null);
  assert.equal(tree.props.children[2].type, "Card");
});

test("a missing seller presentation cannot replace loading, failed, or linked-account gates", () => {
  let account: any = undefined;
  const gate = compilePreview("components/seller-gate.tsx", {
    "expo-router": { router: { push() {} } },
    "@/lib/session": {
      useSession: () => ({ account, store, retryAccount() {} }),
    },
    "@/lib/i18n": {
      useI18n: () => ({ d: { login: { offline: "Retry" }, retry: "Retry" } }),
    },
    "./ui": {
      Button: "Button",
      Loading: "Loading",
      Message: "Message",
      Screen: "Screen",
    },
  });
  const props = {
    title: "My items",
    children: "private-items",
    missing: "public-store-introduction",
  };
  assert.equal(gate.SellerGate(props).type, "Loading");
  account = "failed";
  assert.equal(gate.SellerGate(props).type, "Screen");
  account = null;
  assert.equal(gate.SellerGate(props), "public-store-introduction");
  account = { tenantId: store.id, sellerId: "seller-a" };
  assert.equal(gate.SellerGate(props), "private-items");
});

test("public store presentation remains available when profile loading fails", async () => {
  let state: any;
  const calls: any[] = [],
    effects: (() => () => void)[] = [];
  const component = compilePreview(
    "components/store-information.tsx",
    {
      react: {
        useState: (initial: unknown) => [
          state ?? initial,
          (v: unknown) => {
            state = v;
          },
        ],
        useCallback: (f: unknown) => f,
      },
      "react-native": {
        StyleSheet: { create: (s: unknown) => s },
        Text: "Text",
        View: "View",
      },
      "expo-router": {
        useFocusEffect: (f: () => () => void) => effects.push(f),
      },
      "expo-linking": { openURL() {} },
      "@/components/ui": {
        Button: "Button",
        Loading: "Loading",
        Message: "Message",
        Screen: "Screen",
        uiStyles: {},
      },
      "@/lib/i18n": {
        useI18n: () => ({
          d: {
            storeInfo: { title: "Store", failed: "Failed" },
            retry: "Retry",
          },
        }),
      },
      "@/lib/supabase": {
        supabase: {
          rpc: (name: string, params: unknown) => {
            calls.push({ name, params });
            return {
              abortSignal: async () => ({ error: new Error("offline") }),
            };
          },
        },
      },
      "@/lib/store-info": {},
    },
    { AbortController },
  );
  const wrapper = component.StoreInformation({
    store,
    title: "My items",
    children: "sign-in-and-contact",
  });
  const tree = wrapper.type(wrapper.props);
  assert.equal(tree.props.children[0], "sign-in-and-contact");
  const cleanup = effects[0]();
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(calls.length, 1);
  assert.equal(calls[0].name, "public_store_profile");
  assert.equal(calls[0].params.p_slug, store.slug);
  const failed = wrapper.type(wrapper.props);
  assert.equal(failed.props.children[0], "sign-in-and-contact");
  assert.equal(state.status, "failed");
  cleanup();
});
