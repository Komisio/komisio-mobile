import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { payoutCopy } from "../src/lib/payout-copy.ts";
import { payoutBadgeTone } from "../src/lib/seller-overview.ts";

const require = createRequire(import.meta.url);
const { transformSync } = require("@babel/core");
const source = readFileSync(
  new URL("../src/components/seller-payouts.tsx", import.meta.url),
  "utf8",
);
// Expose the internal form only in this test compilation, never in app routes.
const { code } = transformSync(source + "\nexport { PayoutForm };", {
  filename: "seller-payouts.tsx",
  configFile: false,
  babelrc: false,
  presets: ["@babel/preset-typescript"],
  plugins: [
    "babel-plugin-react-compiler",
    ["@babel/plugin-transform-react-jsx", { runtime: "automatic" }],
    "@babel/plugin-transform-modules-commonjs",
  ],
});

function form(availableOre: number, thresholdOre: number, enabled = true) {
  const exports: Record<string, any> = {};
  const modules: Record<string, unknown> = {
    react: { useState: (initial: unknown) => [initial, () => {}] },
    "react/compiler-runtime": {
      c: (size: number) =>
        Array(size).fill(Symbol.for("react.memo_cache_sentinel")),
    },
    "react/jsx-runtime": require("react/jsx-runtime"),
    "react-native": {
      View: "View",
      Text: "Text",
      StyleSheet: { create: (value: unknown) => value },
    },
    "expo-router": {},
    "expo-crypto": {},
    "./pending-discard": {},
    "./balance-card": {},
    "./ui": {
      View: "View",
      Message: "Message",
      Field: "Field",
      Button: "Button",
      uiStyles: {},
    },
    "@/lib/i18n": {
      useI18n: () => ({ d: { payouts: payoutCopy.sv, bank: {} } }),
    },
    "@/lib/session": {},
    "@/lib/scoped-read": {},
    "@/lib/catalogue": { formatPrice: (ore: number) => String(ore) },
    "@/lib/seller-overview": { payoutBadgeTone },
    "@/lib/seller-agreement": {},
    "@/lib/payout-api": {},
    "@/lib/seller-payouts": {},
  };
  runInNewContext(code, {
    exports,
    require: (name: string) => {
      assert.ok(Object.hasOwn(modules, name), name);
      return modules[name];
    },
  });
  return exports.PayoutForm({
    data: { balance: { availableOre }, thresholdOre, currency: "SEK" },
    enabled,
    amount: "",
    setAmount: () => {},
    onSubmit: () => {
      throw new Error("No writes in render test");
    },
  });
}

test("nonpositive and below-threshold balances explain eligibility without unusable amount controls", () => {
  for (const [available, threshold] of [
    [0, 0],
    [-100, 0],
    [9999, 10000],
  ]) {
    const tree = form(available, threshold);
    assert.ok(
      tree.props.children.some(
        (child: any) => child?.props?.children === payoutCopy.sv.insufficient,
      ),
    );
    assert.ok(
      !tree.props.children.some(
        (child: any) => child?.type === "Field" || child?.type === "Button",
      ),
    );
  }
});

test("eligible balances retain the amount form; disabled API does not become writable", () => {
  for (const enabled of [true, false]) {
    const tree = form(10000, 10000, enabled);
    const field = tree.props.children.find(
      (child: any) => child?.type === "Field",
    );
    const submit = tree.props.children.find(
      (child: any) => child?.props?.label === payoutCopy.sv.submit,
    );
    assert.ok(field);
    assert.equal(field.props.editable, enabled);
    assert.equal(submit.props.disabled, !enabled);
  }
});

test("only a recorded paid status gets the positive payment badge", () => {
  assert.equal(payoutBadgeTone("paid"), "positive");
  for (const status of ["requested", "approved", "rejected"] as const) {
    assert.notEqual(payoutBadgeTone(status), "positive");
  }
});

test("payout drafts survive refresh failures and history navigation, clearing only on confirmed registration", () => {
  const slots: unknown[] = [];
  let hook = 0;
  let readState: any;
  let writeState: any = { status: "ready", code: null };
  const ready = {
    status: "ready",
    data: {
      currency: "SEK",
      balance: { availableOre: 50000, reservedOre: 0, paidOre: 0 },
      thresholdOre: 10000,
      payouts: [],
      total: 0,
    },
  };
  readState = ready;
  const read = {
    getState: () => readState,
    subscribe: () => {},
    refresh: () => {
      readState = { status: "loading", data: null };
    },
  };
  const writer = {
    getState: () => writeState,
    subscribe: () => {},
    load: () => {},
  };
  const modules: Record<string, unknown> = {
    react: {
      useState: (initial: unknown) => {
        const index = hook++;
        if (!(index in slots)) slots[index] = initial;
        return [
          slots[index],
          (value: unknown) => {
            slots[index] = value;
          },
        ];
      },
      useMemo: (fn: () => unknown) => fn(),
      useCallback: (fn: unknown) => fn,
      useSyncExternalStore: (_subscribe: unknown, getState: () => unknown) =>
        getState(),
    },
    "react/compiler-runtime": {
      c: (size: number) =>
        Array(size).fill(Symbol.for("react.memo_cache_sentinel")),
    },
    "react/jsx-runtime": require("react/jsx-runtime"),
    "react-native": {
      View: "View",
      Text: "Text",
      StyleSheet: { create: (value: unknown) => value },
    },
    "expo-router": { useFocusEffect: () => {}, router: {} },
    "expo-crypto": {},
    "./pending-discard": {},
    "./balance-card": { BalanceCard: "BalanceCard" },
    "./ui": {
      Screen: "Screen",
      Choice: "Choice",
      Message: "Message",
      Button: "Button",
      NavigationRow: "NavigationRow",
      uiStyles: {},
    },
    "@/lib/i18n": {
      useI18n: () => ({
        locale: "sv",
        d: {
          payouts: payoutCopy.sv,
          tabs: { money: "Pengar" },
          bank: { title: "Konto" },
          overview: {},
        },
      }),
    },
    "@/lib/session": { useSession: () => ({}) },
    "@/lib/scoped-read": { createScopedRead: () => read },
    "@/lib/catalogue": {},
    "@/lib/seller-overview": { payoutBadgeTone },
    "@/lib/seller-agreement": {},
    "@/lib/payout-api": {
      payoutEndpoint: "synthetic",
      payoutWriter: () => writer,
    },
    "@/lib/seller-payouts": {},
  };
  const exports: Record<string, any> = {};
  runInNewContext(code, {
    exports,
    require: (name: string) => {
      assert.ok(Object.hasOwn(modules, name), name);
      return modules[name];
    },
  });
  function render() {
    hook = 0;
    return exports.SellerPayouts({
      user: "synthetic-user",
      tenant: "synthetic-store",
      seller: "synthetic-seller",
    });
  }
  function nodes(tree: any): any[] {
    if (Array.isArray(tree)) return tree.flatMap(nodes);
    if (!tree || typeof tree !== "object") return [];
    return [tree, ...nodes(tree.props?.children)];
  }
  const getForm = (tree: any) =>
    nodes(tree).find((node) => node.type?.name === "PayoutForm");
  getForm(render()).props.setAmount("250,50");
  render().props.refresh.onRefresh();
  assert.equal(getForm(render()), undefined);
  readState = { status: "failed", data: null, failure: "failed" };
  assert.equal(getForm(render()), undefined);
  readState = ready;
  assert.equal(getForm(render()).props.amount, "250,50");
  nodes(render())
    .find((node) => node.props?.label === payoutCopy.sv.historyShort)
    .props.onPress();
  assert.equal(getForm(render()), undefined);
  nodes(render())
    .find((node) => node.props?.label === payoutCopy.sv.request)
    .props.onPress();
  assert.equal(getForm(render()).props.amount, "250,50");
  writeState = { status: "rejected", code: "REJECTED" };
  render();
  writeState = { status: "ready" };
  assert.equal(getForm(render()).props.amount, "250,50");
  writeState = { status: "success" };
  render();
  writeState = { status: "ready" };
  assert.equal(getForm(render()).props.amount, "");
});
