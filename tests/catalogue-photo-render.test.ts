import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";

const require = createRequire(import.meta.url);
const { transformSync } = require("@babel/core");
const compiled = transformSync(
  readFileSync(
    new URL("../src/components/catalogue-photo.tsx", import.meta.url),
    "utf8",
  ),
  {
    filename: "catalogue-photo.tsx",
    configFile: false,
    babelrc: false,
    presets: ["@babel/preset-typescript"],
    plugins: [
      ["@babel/plugin-transform-react-jsx", { runtime: "automatic" }],
      "@babel/plugin-transform-modules-commonjs",
    ],
  },
).code;

function render(photo: unknown, authenticated = true) {
  let sourceCalls = 0;
  const modules: Record<string, unknown> = {
    react: { useState: (value: unknown) => [value, () => {}] },
    "react/jsx-runtime": require("react/jsx-runtime"),
    "react-native": {
      StyleSheet: { create: (v: unknown) => v },
      View: "div",
      Text: "span",
    },
    "expo-image": { Image: "img" },
    "@/lib/catalogue": {
      photoSource: () => {
        sourceCalls++;
        return { uri: "synthetic" };
      },
    },
    "@/lib/session": {
      useSession: () => ({
        session: authenticated ? { access_token: "synthetic" } : null,
      }),
    },
    "@/lib/i18n": {
      useI18n: () => ({
        d: { catalogue: { noPhoto: "Missing", photoFailed: "Failed" } },
      }),
    },
    "./ui": { Button: "button", colors: {} },
  };
  const exports: {
    CataloguePhoto?: (
      props: unknown,
    ) => null | { props: { children: { props: { children: string } } } };
  } = {};
  runInNewContext(compiled, {
    exports,
    process: {
      env: {
        EXPO_PUBLIC_SUPABASE_URL: "https://example.test",
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "synthetic",
      },
    },
    require: (name: string) => {
      assert.ok(Object.hasOwn(modules, name), name);
      return modules[name];
    },
  });
  return {
    element: exports.CataloguePhoto!({
      photo,
      tenant: "synthetic",
      label: "Item",
    }),
    calls: () => sourceCalls,
  };
}

test("absent catalogue photos render no image area or placeholder", () => {
  for (const authenticated of [true, false]) {
    const result = render(null, authenticated);
    assert.equal(result.element, null);
    assert.equal(result.calls(), 0);
  }
});

test("an existing photo is preserved and an unavailable session is not called a missing photo", () => {
  const photo = { bucket: "item-photos", path: "synthetic" };
  const available = render(photo);
  assert.ok(available.element);
  assert.equal(available.calls(), 1);
  const unavailable = render(photo, false);
  assert.equal(unavailable.element?.props.children.props.children, "Failed");
  assert.equal(unavailable.calls(), 0);
});
