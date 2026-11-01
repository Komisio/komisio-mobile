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

for (const scenario of [
  "idle",
  "loading",
  "failed",
  "ready",
  "populated",
  "unavailable",
]) {
  test(`compiled overview renders ${scenario} without accessing absent data or hiding activity`, () => {
    const populated = scenario === "populated";
    const status = populated || scenario === "unavailable" ? "ready" : scenario;
    const values: number[] = [];
    const data =
      status === "ready"
        ? {
            currency: "SEK",
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
            recentSales:
              scenario === "unavailable"
                ? null
                : populated
                  ? Array.from({ length: 5 }, (_, i) => ({
                      id: `sale-${i}`,
                      title: `Synthetic sale ${i}`,
                      reference: `S-${i}`,
                      soldPriceOre: 5000,
                      soldAt: "2026-10-29T10:00:00Z",
                    }))
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
            items: {
              untitled: "Untitled",
              periodEnd: "Period end",
              filters: { active: "Till salu", sold: "Sålda" },
            },
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
      "./balance-card": { BalanceCard: "balance-card" },
      "./ui": {
        Screen: "main",
        Loading: "progress",
        Message: "p",
        Button: "button",
        ItemCard: "article",
        NavigationRow: "nav",
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
    assert.ok(
      populated
        ? values.length > 0 && values.every((value) => value === 5000)
        : values.length === 0,
    );
    const nodes: any[] = [];
    function visit(node: any) {
      if (Array.isArray(node)) return node.forEach(visit);
      if (!node || typeof node !== "object") return;
      nodes.push(node);
      visit(node.props?.children);
    }
    visit(element);
    const balanceCard = nodes.find((node) => node.type === "balance-card");
    assert.equal(balanceCard, undefined);
    const headings = nodes
      .filter((node) => node.props?.accessibilityRole === "header")
      .map((node) => node.props.children);
    assert.equal(
      headings.includes(overviewCopy.sv.recentSales),
      status === "ready",
    );
    assert.equal(headings.includes(overviewCopy.sv.recentPayouts), false);
    assert.equal(
      nodes.some((node) => node.props?.children === overviewCopy.sv.noSales),
      scenario === "ready",
    );
    assert.equal(
      nodes.some(
        (node) => node.props?.children === overviewCopy.sv.salesFailed,
      ),
      scenario === "unavailable",
    );
    assert.equal(
      nodes.some((node) => node.type === "nav"),
      populated,
    );
    if (populated) {
      assert.equal(nodes.filter((node) => node.type === "article").length, 5);
      assert.equal(
        nodes.filter(
          (node) => node.props?.children === overviewCopy.sv.salePrice,
        ).length,
        5,
      );
    }
  });
}
