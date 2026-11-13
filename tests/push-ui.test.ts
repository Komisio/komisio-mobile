import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { randomUUID } from "node:crypto";
import { pushCopy } from "../src/lib/push-copy.ts";
import { parsePushData } from "../src/lib/push-contract.ts";
import { ownsPush, pushDestination } from "../src/lib/push-routing.ts";
const require = createRequire(import.meta.url);
function compile(file: string, modules: Record<string, unknown>) {
  modules = {
    "@/lib/external-submission-runtime": {
      externalRequestApi: () => ({ lookup: async () => null }),
    },
    "@/lib/external-offer-runtime": {
      externalOfferApi: () => ({ read: async () => null }),
    },
    "@/lib/identity-gates": {
      hasVerifiedPhone: (user: any) =>
        Boolean(user?.phone_confirmed_at && user?.phone),
    },
    ...modules,
  };
  const { code } = require("@babel/core").transformSync(
    readFileSync(new URL(file, import.meta.url), "utf8"),
    {
      filename: file,
      configFile: false,
      babelrc: false,
      presets: ["@babel/preset-typescript"],
      plugins: [
        ["@babel/plugin-transform-react-jsx", { runtime: "automatic" }],
        "@babel/plugin-transform-modules-commonjs",
      ],
    },
  );
  const exports: any = {};
  runInNewContext(code, {
    exports,
    require: (name: string) => {
      if (name === "react/jsx-runtime") return require(name);
      assert.ok(Object.hasOwn(modules, name), name);
      return modules[name];
    },
  });
  return exports;
}
function nodes(e: any): any[] {
  if (!e || typeof e !== "object") return [];
  if (Array.isArray(e)) return e.flatMap(nodes);
  return [e, ...nodes(e.props?.children)];
}
test("notification controls show confirmed state, actionable errors and system settings without internal details", () => {
  for (const status of [
    "off",
    "on",
    "error",
    "denied",
    "unavailable",
    "loading",
  ]) {
    const actions: string[] = [];
    const screen = compile("../src/app/notifications.tsx", {
      react: {
        useState: (v: unknown) => [v, () => {}],
        useSyncExternalStore: () => ({
          status,
          busy: false,
          error: "INTERNAL_TOKEN_ERROR",
        }),
      },
      "react-native": {
        Linking: { openSettings: async () => actions.push("settings") },
      },
      "@/lib/i18n": {
        useI18n: () => ({ locale: "en", d: { retry: "Retry" } }),
      },
      "@/lib/push-copy": { pushCopy },
      "@/lib/push-runtime": {
        sellerPush: {
          subscribe: () => {},
          getSnapshot: () => {},
          enable: () => actions.push("enable"),
          disable: () => actions.push("disable"),
          refresh: () => actions.push("retry"),
        },
      },
      "@/components/ui": Object.fromEntries(
        ["Button", "Card", "Loading", "Message", "Screen"].map((n) => [n, n]),
      ),
    });
    const tree = nodes(screen.default());
    assert.ok(!JSON.stringify(tree).includes("INTERNAL_TOKEN_ERROR"));
    const buttons = tree.filter((n) => n.type === "Button");
    buttons.forEach((b) => b.props.onPress());
    assert.deepEqual(
      actions,
      status === "off"
        ? ["enable"]
        : status === "on"
          ? ["disable"]
          : status === "error"
            ? ["retry", "disable"]
            : status === "denied"
              ? ["settings"]
              : [],
    );
  }
});
test("initial native permission waits for authenticated seller lookup and ignores stale or failed results", async () => {
  const user = randomUUID();
  const account = { tenantId: randomUUID(), sellerId: randomUUID() };
  for (const scenario of [
    "signed-out",
    "loading",
    "mfa",
    "empty",
    "error",
    "stale",
    "seller",
  ]) {
    const effects: (() => void | (() => void))[] = [];
    const requests: string[] = [];
    const launches: string[] = [];
    let resolveLookup!: (result: unknown) => void;
    const lookup = new Promise((resolve) => {
      resolveLookup = resolve;
    });
    const bridge = compile("../src/components/push-bridge.tsx", {
      react: {
        useRef: (v: unknown) => ({ current: v }),
        useState: (v: unknown) => [v, () => {}],
        useEffect: (run: () => void) => {
          effects.push(run);
        },
      },
      "react-native": {
        AppState: {
          currentState: "active",
          addEventListener: () => ({ remove: () => {} }),
        },
      },
      "expo-router": { router: { push: () => {} } },
      "@/lib/session": {
        useSession: () => ({
          ready: scenario !== "loading",
          mfaRequired: scenario === "mfa",
          session: scenario === "signed-out" ? null : { user: { id: user } },
          store: null,
          account: undefined,
        }),
      },
      "@/lib/i18n": { useI18n: () => ({ locale: "sv" }) },
      "@/lib/supabase": { supabase: { rpc: () => lookup } },
      "@/lib/push-runtime": {
        sellerPush: {
          setContext: async () => {},
          requestLaunchPermission: async () => {
            launches.push("launch");
          },
          refresh: async () => {},
          requestInitialPermission: async (id: string) => {
            requests.push(id);
          },
        },
      },
      "@/lib/push-native": {
        configurePushChannels: () => {},
        clearPushResponse: () => {},
        observePush: () => () => {},
      },
      "@/lib/push-contract": { parsePushData },
      "@/lib/push-routing": { ownsPush, pushDestination },
      "@/lib/push-copy": { pushCopy },
    });
    bridge.PushBridge();
    const cleanup = effects.map((run) => run());
    assert.equal(requests.length, 0, scenario);
    assert.equal(
      launches.length,
      ["loading", "mfa"].includes(scenario) ? 0 : 1,
      scenario,
    );
    if (scenario === "stale") cleanup.forEach((stop) => stop?.());
    resolveLookup({
      data: scenario === "empty" ? [] : [account],
      error: scenario === "error" ? { code: "FORBIDDEN" } : null,
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.deepEqual(requests, scenario === "seller" ? [user] : [], scenario);
    cleanup.forEach((stop) => stop?.());
  }
});
test("a tap waits through login/MFA, chooses the verified store and opens once; a foreign seller is rejected", async () => {
  const tenantId = randomUUID(),
    sellerId = randomUUID(),
    userId = randomUUID();
  const store = { id: tenantId, name: "Synthetic", slug: "synthetic" },
    account = { tenantId, sellerId };
  const payload = {
    v: 1,
    notificationId: randomUUID(),
    kind: "item_sold",
    tenantId,
    sellerId,
    itemId: randomUUID(),
  };
  const navigation: any[] = [],
    contexts: any[] = [],
    initialRequests: string[] = [];
  let callback: (v: unknown) => void = () => {},
    visibility: (v: unknown) => boolean = () => false;
  let dirty = false,
    index = 0;
  const slots: any[] = [],
    effects: { run: () => void; slot: any }[] = [];
  const state: any = {
    ready: false,
    mfaRequired: false,
    session: null,
    store: null,
    account: undefined,
    chooseStore: (s: unknown) => {
      state.store = s;
      state.account = account;
      dirty = true;
    },
  };
  const react = {
    useRef: (v: unknown) => {
      const i = index++;
      return slots[i] ?? (slots[i] = { current: v });
    },
    useState: (v: unknown) => {
      const i = index++;
      slots[i] ??= { value: v };
      return [
        slots[i].value,
        (next: any) => {
          slots[i].value =
            typeof next === "function" ? next(slots[i].value) : next;
          dirty = true;
        },
      ];
    },
    useEffect: (run: () => void, deps: unknown[]) => {
      const i = index++;
      const old = slots[i];
      if (!old || deps.some((d, n) => !Object.is(d, old.deps[n]))) {
        old?.cleanup?.();
        const slot = { deps, cleanup: undefined };
        slots[i] = slot;
        effects.push({ run, slot });
      }
    },
  };
  const bridge = compile("../src/components/push-bridge.tsx", {
    react,
    "react-native": {
      AppState: {
        currentState: "active",
        addEventListener: () => ({ remove: () => {} }),
      },
    },
    "expo-router": { router: { push: (v: unknown) => navigation.push(v) } },
    "@/lib/session": { useSession: () => ({ ...state }) },
    "@/lib/i18n": { useI18n: () => ({ locale: "sv" }) },
    "@/lib/supabase": {
      supabase: {
        rpc: async (name: string) => ({
          data: name === "my_seller_accounts" ? [account] : [store],
          error: null,
        }),
      },
    },
    "@/lib/push-runtime": {
      sellerPush: {
        setContext: async (u: unknown) => contexts.push(u),
        requestLaunchPermission: async () => {},
        requestInitialPermission: async (u: string) => initialRequests.push(u),
        refresh: async () => {},
        getSnapshot: () => ({ status: "on" }),
      },
    },
    "@/lib/push-native": {
      configurePushChannels: () => {},
      clearPushResponse: () => {},
      observePush: (r: typeof callback, _: unknown, v: typeof visibility) => {
        callback = r;
        visibility = v;
        return () => {};
      },
    },
    "@/lib/push-contract": { parsePushData },
    "@/lib/push-routing": { ownsPush, pushDestination },
    "@/lib/push-copy": { pushCopy },
  });
  async function render() {
    for (let turn = 0; turn < 10; turn++) {
      dirty = false;
      index = 0;
      bridge.PushBridge();
      for (const e of effects.splice(0)) e.slot.cleanup = e.run();
      await new Promise((resolve) => setTimeout(resolve, 0));
      if (!dirty) return;
    }
    throw new Error("Render did not settle");
  }
  await render();
  assert.equal(initialRequests.length, 0);
  callback(payload);
  await render();
  assert.equal(navigation.length, 0);
  state.ready = true;
  state.session = { user: { id: userId } };
  state.mfaRequired = true;
  await render();
  assert.equal(initialRequests.length, 0);
  assert.equal(navigation.length, 0);
  state.mfaRequired = false;
  await render();
  assert.deepEqual(initialRequests, [userId]);
  assert.equal(navigation.length, 1);
  assert.equal(state.store.id, tenantId);
  assert.equal(navigation[0].params.item, payload.itemId);
  assert.equal(navigation[0].pathname, "/my-items/[tenant]/[item]");
  assert.equal(visibility(payload), true);
  callback(payload);
  await render();
  assert.equal(navigation.length, 1);
  callback({
    ...payload,
    notificationId: randomUUID(),
    sellerId: randomUUID(),
  });
  await render();
  assert.equal(navigation.length, 1);
  state.session = null;
  await render();
  assert.equal(visibility(payload), false);
  assert.equal(contexts.at(-1), null);
});
