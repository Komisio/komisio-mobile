import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";

const require = createRequire(import.meta.url);
function compile(file: string, modules: Record<string, unknown>) {
  const { code } = require("@babel/core").transformSync(
    readFileSync(new URL(file, import.meta.url), "utf8"),
    {
      filename: file,
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
  const exports: any = {};
  runInNewContext(code, {
    exports,
    require: (name: string) => {
      if (name === "react/jsx-runtime") return require(name);
      if (name === "react/compiler-runtime")
        return {
          c: (n: number) =>
            Array(n).fill(Symbol.for("react.memo_cache_sentinel")),
        };
      if (name.endsWith(".svg")) return name;
      assert.ok(Object.hasOwn(modules, name), name);
      return modules[name];
    },
  });
  return exports;
}
function nodes(element: any): any[] {
  if (!element || typeof element !== "object") return [];
  if (Array.isArray(element)) return element.flatMap(nodes);
  if (typeof element.type === "function")
    return nodes(element.type(element.props));
  return [element, ...nodes(element.props?.children)];
}
test("profile exposes one store action, language detail, financial links and logout beside identity", async () => {
  const actions: unknown[] = [];
  const screen = compile("../src/components/profile-screen.tsx", {
    react: { useState: (value: unknown) => [value, () => {}] },
    "react-native": {
      Text: "Text",
      View: "View",
      StyleSheet: { create: (x: unknown) => x },
    },
    "expo-image": { Image: "Image" },
    "expo-router": { router: { push: (path: string) => actions.push(path) } },
    "@/lib/i18n": {
      useI18n: () => ({
        d: {
          tabs: { profile: "Profile" },
          profile: { signedInAs: "Signed in as", store: "Store" },
          account: { logout: "Log out" },
          store: { title: "Choose store" },
          language: "Language",
          languageName: "English",
          bank: { title: "Bank" },
          agreement: { title: "Agreement" },
        },
      }),
    },
    "@/lib/session": {
      useSession: () => ({
        session: { user: { email: "seller@example.test" } },
        store: { name: "Synthetic shop" },
        chooseStore: (store: null) => actions.push(store),
        signOut: async () => {
          actions.push("logout");
        },
      }),
    },
    "./ui": {
      Screen: "Screen",
      Card: "Card",
      Button: "Button",
      ItemCard: "ItemCard",
      NavigationRow: "NavigationRow",
      Message: "Message",
      colors: {},
      uiStyles: {},
    },
  });
  const tree = nodes(screen.ProfileScreen());
  const settings = tree.filter((n) => n.type === "ItemCard");
  assert.deepEqual(
    settings.map((n) => n.props.label),
    ["Store: Synthetic shop", "Language: English"],
  );
  settings.forEach((n) => n.props.onPress());
  const links = tree.filter((n) => n.type === "NavigationRow");
  links.forEach((n) => n.props.onPress());
  const buttons = tree.filter((n) => n.type === "Button");
  assert.equal(buttons.length, 1);
  assert.equal(buttons[0].props.label, "Log out");
  buttons[0].props.onPress();
  await Promise.resolve();
  assert.deepEqual(actions, [
    null,
    "/language",
    "/bank-account",
    "/agreement",
    "logout",
  ]);
  assert.ok(
    tree.some(
      (n) =>
        n.type === "Text" &&
        n.props.children === "seller@example.test" &&
        n.props.selectable,
    ),
  );
});
test("language detail presents supported native names and selection dispatches the stored locale code", () => {
  const changes: string[] = [];
  const screen = compile("../src/app/language.tsx", {
    "react-native": { View: "View" },
    "@/lib/i18n": {
      locales: ["sv", "en"],
      dictionaries: {
        sv: { languageName: "Svenska" },
        en: { languageName: "English" },
      },
      useI18n: () => ({
        d: { language: "Språk" },
        locale: "sv",
        setLocale: (code: string) => changes.push(code),
      }),
    },
    "@/components/ui": { Choice: "Choice", Screen: "Screen" },
  });
  const choices = nodes(screen.default()).filter((n) => n.type === "Choice");
  assert.deepEqual(
    choices.map((n) => [n.props.label, n.props.selected]),
    [
      ["Svenska", true],
      ["English", false],
    ],
  );
  assert.ok(choices.every((n) => n.props.role === "radio" && n.props.listRow));
  choices[1].props.onPress();
  assert.deepEqual(changes, ["en"]);
});
