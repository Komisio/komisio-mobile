import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { itemFilters } from "../src/lib/seller-items.ts";
import { sellerItemsCopy } from "../src/lib/seller-items-copy.ts";

const require = createRequire(import.meta.url);
const { transformSync } = require("@babel/core");
const { code } = transformSync(
  readFileSync(
    new URL("../src/components/seller-items.tsx", import.meta.url),
    "utf8",
  ),
  {
    filename: "seller-items.tsx",
    configFile: false,
    babelrc: false,
    presets: ["@babel/preset-typescript"],
    plugins: [
      "babel-plugin-react-compiler",
      ["@babel/plugin-transform-react-jsx", { runtime: "automatic" }],
      "@babel/plugin-transform-modules-commonjs",
    ],
  },
);
test("overview filter intent clears old search once and does not override later manual filters", () => {
  const slots: any[] = ["old search", "old search", "sold", false];
  let hook = 0;
  let requested: string | undefined = "expiring";
  let focus: () => unknown;
  const reads: string[] = [];
  const modules: Record<string, unknown> = {
    react: {
      useState: () => {
        const index = hook++;
        return [
          slots[index],
          (value: unknown) => {
            slots[index] = value;
          },
        ];
      },
      useCallback: (fn: unknown) => fn,
      useMemo: (fn: () => unknown) => fn(),
      useSyncExternalStore: (_: unknown, get: () => unknown) => get(),
    },
    "react/compiler-runtime": {
      c: (size: number) =>
        Array(size).fill(Symbol.for("react.memo_cache_sentinel")),
    },
    "react/jsx-runtime": require("react/jsx-runtime"),
    "react-native": {
      FlatList: "FlatList",
      Text: "Text",
      View: "View",
      StyleSheet: { create: (value: unknown) => value },
    },
    "react-native-safe-area-context": { SafeAreaView: "SafeAreaView" },
    "expo-router": {
      useLocalSearchParams: () => ({ filter: requested }),
      useFocusEffect: (fn: () => unknown) => {
        focus = fn;
      },
      router: {
        setParams: (params: any) => {
          assert.equal(params.filter, undefined);
          requested = undefined;
        },
      },
    },
    "@/lib/catalogue": {
      createCataloguePager: (read: any) => ({
        subscribe: () => {},
        getState: () => ({
          status: "ready",
          items: [],
          total: 0,
          offset: 0,
          currency: "SEK",
        }),
        revalidate: () => read("", 0, new AbortController().signal),
        cancel: () => {},
      }),
    },
    "@/lib/seller-items-api": {
      readSellerItems: (
        _tenant: string,
        _seller: string,
        query: string,
        _offset: number,
        filter: string,
      ) => {
        assert.equal(query, "");
        reads.push(filter);
      },
    },
    "@/lib/seller-items": { itemFilters },
    "@/lib/i18n": {
      useI18n: () => ({
        locale: "sv",
        d: { items: sellerItemsCopy.sv, catalogue: { clear: "Clear" } },
      }),
    },
    "@/lib/session": { useSession: () => ({}) },
    "./detail-sheet": { DetailSheet: "Sheet" },
    "./ui": {
      colors: {},
      uiStyles: {},
      PageHeading: "Heading",
      Field: "Field",
      Button: "Button",
      StatusBadge: "Badge",
      Message: "Message",
      FilterChip: "Choice",
    },
  };
  const exports: any = {};
  runInNewContext(code, {
    exports,
    require: (name: string) => {
      assert.ok(Object.hasOwn(modules, name), name);
      return modules[name];
    },
  });
  const render = () => {
    hook = 0;
    exports.SellerItems({ tenant: "tenant", seller: "seller" });
  };
  render();
  focus!();
  assert.deepEqual(slots.slice(0, 3), ["", "", "expiring"]);
  assert.equal(requested, undefined);
  assert.deepEqual(reads, []);
  render();
  focus!();
  assert.deepEqual(reads, ["expiring"]);
  slots[2] = "sold";
  render();
  focus!();
  assert.deepEqual(reads, ["expiring", "sold"]);
});
