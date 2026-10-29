import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { overviewCopy } from "../src/lib/overview-copy.ts";

const require = createRequire(import.meta.url);
const { transformSync } = require("@babel/core");

// Compile the actual screen: TypeScript-only tests miss eager dependencies
// introduced by React Compiler. No network, auth or native runtime is involved.
const source = readFileSync(
  new URL("../src/components/seller-overview.tsx", import.meta.url),
  "utf8",
);
const compiled = transformSync(source, {
  filename: "seller-overview.tsx",
  configFile: false,
  babelrc: false,
  presets: ["@babel/preset-typescript"],
  plugins: [
    "babel-plugin-react-compiler",
    ["@babel/plugin-transform-react-jsx", { runtime: "automatic" }],
    "@babel/plugin-transform-modules-commonjs",
  ],
}).code;
assert.match(compiled, /react\/compiler-runtime/);

for (const status of ["idle", "loading", "failed", "ready"]) {
  test(`compiled overview renders ${status} without accessing absent data`, () => {
    const values: number[] = [];
    const data =
      status === "ready"
        ? {
            currency: "SEK",
            balance: { availableOre: 36000, reservedOre: 0, paidOre: 10000 },
            counts: { active: 2, sold: 3, expiring: 0, ended: 0 },
            expiring: [],
            payouts: [],
          }
        : null;
    const state = { status, data, failure: "denied" };
    const cache: unknown[] = Array(200).fill(
      Symbol.for("react.memo_cache_sentinel"),
    );
    const modules: Record<string, unknown> = {
      react: {
        useMemo: (fn: () => unknown) => fn(),
        useCallback: (fn: unknown) => fn,
        useSyncExternalStore: () => state,
      },
      "react/compiler-runtime": { c: () => cache },
      "react/jsx-runtime": require("react/jsx-runtime"),
      "react-native": {
        StyleSheet: { create: (v: unknown) => v },
        Text: "span",
        View: "div",
        Pressable: "button",
      },
      "expo-router": { useFocusEffect: () => {}, router: {} },
      "@/lib/i18n": {
        useI18n: () => ({
          locale: "sv-SE",
          d: {
            overview: overviewCopy.sv,
            tabs: { overview: "Översikt" },
            login: { changeStore: "Byt butik" },
          },
        }),
      },
      "@/lib/session": { useSession: () => ({ chooseStore: () => {} }) },
      "@/lib/scoped-read": {
        createScopedRead: () => ({
          subscribe: () => {},
          getState: () => state,
        }),
      },
      "@/lib/seller-overview-api": {},
      "@/lib/catalogue": {
        formatPrice: (ore: number, currency: string) => {
          assert.equal(currency, "SEK");
          values.push(ore);
          return String(ore);
        },
      },
      "@/lib/seller-items": {},
      "./ui": {
        Screen: "main",
        Loading: "progress",
        Message: "p",
        Button: "button",
        colors: {},
        uiStyles: {},
      },
    };
    const exports: { SellerOverviewScreen?: (props: unknown) => unknown } = {};
    runInNewContext(compiled, {
      exports,
      require: (name: string) => {
        assert.ok(Object.hasOwn(modules, name), name);
        return modules[name];
      },
    });
    const element = exports.SellerOverviewScreen!({
      tenant: "tenant",
      seller: "seller",
      storeName: "Synthetic store",
    });
    assert.ok(element);
    assert.deepEqual(values, status === "ready" ? [36000, 0, 10000] : []);
  });
}
