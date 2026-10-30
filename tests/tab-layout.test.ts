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
test("sheets inherit native width and keep dismissal outside the bounded scrolling body", () => {
  let height = 852;
  let closed = 0;
  const sheet = compile("../src/components/detail-sheet.tsx", {
    "@expo/ui": { BottomSheet: "BottomSheet", RNHostView: "RNHostView" },
    "react-native": {
      StyleSheet: { create: (value: unknown) => value },
      View: "View",
      Text: "Text",
      ScrollView: "ScrollView",
      useWindowDimensions: () => ({ height }),
    },
    "./ui": { Button: "Button", colors: {}, uiStyles: {} },
    "@/lib/i18n": { useI18n: () => ({ locale: "sv" }) },
  });
  function render() {
    return sheet.DetailSheet({
      title: "Visa varor",
      open: true,
      onClose: () => {
        closed++;
      },
      children: "choices",
    });
  }
  const root = render();
  const bridge = root.props.children;
  assert.equal(bridge.type, "RNHostView");
  assert.equal(bridge.props.matchContents.vertical, true);
  assert.notEqual(bridge.props.matchContents.horizontal, true);
  const container = bridge.props.children;
  assert.equal(container.props.style[0].width, "100%");
  assert.equal(container.props.style[1].maxHeight, 852 * 0.7);
  const [header, scroll] = container.props.children;
  assert.equal(scroll.type, "ScrollView");
  assert.equal(scroll.props.children, "choices");
  assert.equal(scroll.props.style.flexShrink, 1);
  assert.equal(header.props.style.flexShrink, 0);
  header.props.children[1].props.onPress();
  root.props.onDismiss();
  assert.equal(closed, 2);
  height = 393;
  const rotated = render().props.children;
  assert.equal(rotated.props.children.props.style[1].maxHeight, 393 * 0.7);
});

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
    "@/components/ui": { colors: { surface: "white", softAccent: "sage" } },
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
      Platform: { OS: "ios" },
    },
    "react-native-safe-area-context": { SafeAreaView: "SafeAreaView" },
    "./theme": { colors: {}, uiStyles: {} },
    "./brand": { Brand: "Brand" },
  });
  assert.equal(
    ui.Screen({ title: "Profile", bottomSafeArea: false }).props.edges.bottom,
    "off",
  );
  assert.equal(ui.Screen({ title: "Login" }).props.edges.bottom, "additive");
  assert.equal(ui.Screen({ title: "Login" }).props.edges.top, "additive");
  const detail = ui.Screen({ title: "Bank", topSafeArea: false });
  assert.equal(detail.props.edges.top, "off");
  assert.equal(detail.props.edges.bottom, "additive");
});

test("native back is preserved with history; direct links retain an accessible escape", () => {
  let hasHistory = false;
  const actions: string[] = [];
  const header = compile("../src/components/detail-navigation.tsx", {
    "expo-router": {
      router: {
        canGoBack: () => hasHistory,
        back: () => actions.push("back"),
        replace: (route: string) => actions.push(route),
      },
    },
    "expo-image": { Image: "Image" },
    "react-native": {
      Pressable: "Pressable",
      StyleSheet: { create: (value: unknown) => value },
    },
    "./theme": { colors: {} },
    "../../assets/icons/back.svg": "back.svg",
  });
  const options = header.detailHeaderOptions(
    "/(tabs)/profile",
    "Tillbaka",
    true,
  );
  assert.equal(options.headerShown, true);
  assert.equal(options.headerBackButtonDisplayMode, "minimal");
  assert.equal(options.headerLeft, undefined);
  const direct = header.detailHeaderOptions(
    "/(tabs)/profile",
    "Tillbaka",
    false,
  );
  const button = direct.headerLeft();
  assert.equal(button.props.accessibilityRole, "button");
  assert.equal(button.props.accessibilityLabel, "Tillbaka");
  button.props.onPress();
  hasHistory = true;
  button.props.onPress();
  assert.deepEqual(actions, ["/(tabs)/profile", "back"]);
});

test("all five detail routes configure back navigation with their own fallback", () => {
  const layout = compile("../src/app/_layout.tsx", {
    "expo-router": {
      Stack: Object.assign(() => null, { Screen: "Route", Protected: "Guard" }),
    },
    "react-native-safe-area-context": { SafeAreaProvider: "SafeAreaProvider" },
    "@/lib/i18n": {
      I18nProvider: "I18nProvider",
      useI18n: () => ({
        d: Object.fromEntries(
          ["catalogue", "storeInfo", "items", "agreement", "bank"].map(
            (key) => [key, { back: "Back" }],
          ),
        ),
      }),
    },
    "@/lib/session": {
      SessionProvider: "SessionProvider",
      useSession: () => ({
        ready: true,
        store: {},
        session: {},
        mfaRequired: false,
      }),
    },
    "@/components/ui": {},
    "@/components/detail-navigation": {
      detailHeaderOptions: (
        fallback: string,
        label: string,
        canGoBack: boolean,
      ) => ({ fallback, label, canGoBack }),
    },
  });
  const routesElement =
    layout.default().props.children.props.children.props.children;
  const stack = routesElement.type();
  assert.equal(stack.props.screenOptions.headerShown, false);
  const screens = stack.props.children.at(-1).props.children;
  assert.equal(screens[0].props.name, "(tabs)");
  assert.equal(screens[0].props.options, undefined);
  const expected: Record<string, string> = {
    "catalogue/[tenant]/[item]": "/(tabs)",
    "store-info": "/(tabs)",
    "my-items/[tenant]/[item]": "/(tabs)/items",
    agreement: "/(tabs)/profile",
    "bank-account": "/(tabs)/profile",
  };
  assert.equal(screens.length, 6);
  for (const screen of screens.slice(1)) {
    for (const canGoBack of [true, false]) {
      const options = screen.props.options({
        navigation: { canGoBack: () => canGoBack },
      });
      assert.equal(options.fallback, expected[screen.props.name]);
      assert.equal(options.canGoBack, canGoBack);
    }
  }
});
