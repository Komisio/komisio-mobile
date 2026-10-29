import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";

const require = createRequire(import.meta.url);
const { transformSync } = require("@babel/core");

function compile(file: string, modules: Record<string, unknown>) {
  const exports: Record<string, any> = {};
  const source = readFileSync(new URL(file, import.meta.url), "utf8");
  const { code } = transformSync(source, {
    filename: file,
    configFile: false,
    babelrc: false,
    presets: ["@babel/preset-typescript"],
    plugins: [
      "babel-plugin-react-compiler",
      ["@babel/plugin-transform-react-jsx", { runtime: "automatic" }],
      "@babel/plugin-transform-modules-commonjs",
    ],
  });
  runInNewContext(code, {
    exports,
    require: (name: string) => {
      if (name === "react/jsx-runtime") return require(name);
      if (name === "react/compiler-runtime")
        return {
          c: (size: number) =>
            Array(size).fill(Symbol.for("react.memo_cache_sentinel")),
        };
      assert.ok(Object.hasOwn(modules, name), name);
      return modules[name];
    },
  });
  return exports;
}

// Compiled component contract checks, not a native layout engine/device test.
test("tabs reserve the home inset once and grow/shrink with measured labels", () => {
  let bottom = 34;
  let dimensions = { width: 390, fontScale: 1 };
  let locale = "sv";
  let measured = { key: "", height: 0 };
  const tabs = compile("../src/app/(tabs)/_layout.tsx", {
    react: {
      useState: () => [
        measured,
        (update: (value: typeof measured) => typeof measured) => {
          measured = update(measured);
        },
      ],
    },
    "react-native": { Text: "Text", useWindowDimensions: () => dimensions },
    "react-native-safe-area-context": { useSafeAreaInsets: () => ({ bottom }) },
    "expo-router/tabs": { Tabs: Object.assign(() => null, { Screen: "Tab" }) },
    "@/lib/i18n": {
      useI18n: () => ({
        locale,
        d: {
          tabs: {
            store: "Butiken",
            items: "Mina varor",
            overview: "Översikt",
            money: "Pengar",
            profile: "Profil",
          },
        },
      }),
    },
    "@/components/ui": { colors: { surface: "white", accent: "sage" } },
    "@/components/brand": { TabIcon: "Icon" },
  });
  const options = () => tabs.default().props.screenOptions;
  assert.equal(options().tabBarStyle.height, 87);
  assert.equal(options().tabBarStyle.backgroundColor, "sage");
  assert.equal(options().tabBarStyle.paddingBottom, 34);
  assert.equal(options().tabBarActiveBackgroundColor, undefined);
  assert.equal(tabs.default().props.children.length, 5);
  const label = options().tabBarLabel({
    children: "Mina varor",
    color: "green",
  });
  assert.equal(label.props.children, "Mina varor");
  assert.equal(label.props.numberOfLines, undefined);
  label.props.onLayout({ nativeEvent: { layout: { height: 32 } } });
  assert.equal(options().tabBarStyle.height, 105);
  dimensions = { width: 320, fontScale: 2 };
  options()
    .tabBarLabel({ children: "Mina varor", color: "green" })
    .props.onLayout({ nativeEvent: { layout: { height: 96 } } });
  assert.equal(options().tabBarStyle.height, 169);
  dimensions = { width: 768, fontScale: 1 };
  locale = "en";
  bottom = 0;
  assert.equal(options().tabBarStyle.height, 53);
  assert.equal(options().tabBarStyle.paddingBottom, 0);
});

test("tab screens omit the second bottom inset; standalone screens retain it", () => {
  const ui = compile("../src/components/ui.tsx", {
    react: {},
    "react-native": {
      StyleSheet: { create: (value: unknown) => value },
      View: "View",
      ScrollView: "ScrollView",
    },
    "react-native-safe-area-context": { SafeAreaView: "SafeAreaView" },
    "./theme": { colors: {}, uiStyles: {} },
    "./brand": { Brand: "Brand" },
  });
  assert.equal(
    ui
      .Screen({ title: "Profile", bottomSafeArea: false })
      .props.edges.includes("bottom"),
    false,
  );
  assert.equal(
    ui.Screen({ title: "Bank" }).props.edges.includes("bottom"),
    true,
  );
});
