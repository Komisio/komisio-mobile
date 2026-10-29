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
    "@/lib/catalogue": {},
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
    assert.equal(tree.props.children.type, "Message");
    assert.equal(
      tree.props.children.props.children,
      payoutCopy.sv.insufficient,
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
