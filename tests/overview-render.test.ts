import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { overviewCopy } from "../src/lib/overview-copy.ts";
import { payoutBadgeTone } from "../src/lib/seller-overview.ts";

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

for (const scenario of ["idle", "loading", "failed", "ready", "populated"]) {
  test(`compiled overview renders ${scenario} without accessing absent data or hiding activity`, () => {
    const populated = scenario === "populated";
    const status = populated ? "ready" : scenario;
    const values: number[] = [];
    const data =
      status === "ready"
        ? {
            currency: "SEK",
            balance: { availableOre: 36000, reservedOre: 0, paidOre: 10000 },
            counts: {
              active: 2,
              sold: 3,
              expiring: populated ? 1 : 0,
              ended: 0,
            },
            expiring: populated
              ? [
                  {
                    id: "item",
                    title: "Synthetic item",
                    reference: "S-1",
                    periodEnd: "2026-10-31",
                  },
                ]
              : [],
            payouts: populated
              ? [
                  {
                    id: "payout",
                    amountOre: 5000,
                    status: "requested",
                    requestedAt: "2026-10-29",
                  },
                ]
              : [],
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
            items: { untitled: "Untitled", periodEnd: "Period end" },
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
      "@/lib/seller-overview": { payoutBadgeTone },
      "@/lib/catalogue": {
        formatPrice: (ore: number, currency: string) => {
          assert.equal(currency, "SEK");
          values.push(ore);
          return String(ore);
        },
      },
      "@/lib/seller-items": { formatItemDate: (value: string) => value },
      "./ui": {
        Screen: "main",
        Loading: "progress",
        Message: "p",
        Button: "button",
        ItemCard: "article",
        StatusBadge: "badge",
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
    assert.deepEqual(
      values,
      status === "ready" ? [36000, 0, 10000, ...(populated ? [5000] : [])] : [],
    );
    const nodes: any[] = [];
    function visit(node: any) {
      if (Array.isArray(node)) return node.forEach(visit);
      if (!node || typeof node !== "object") return;
      nodes.push(node);
      visit(node.props?.children);
    }
    visit(element);
    const headings = nodes
      .filter((node) => node.props?.accessibilityRole === "header")
      .map((node) => node.props.children);
    assert.equal(headings.includes(overviewCopy.sv.expiring), populated);
    assert.equal(headings.includes(overviewCopy.sv.recentPayouts), populated);
    if (populated) {
      assert.ok(nodes.some((node) => node.type === "article"));
      assert.ok(
        nodes.some(
          (node) =>
            node.type === "badge" &&
            node.props.children === overviewCopy.sv.statuses.requested,
        ),
      );
      assert.ok(
        nodes.some((node) => node.props?.label === overviewCopy.sv.allPayouts),
      );
    }
  });
}
