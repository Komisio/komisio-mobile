import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { dictionaries } from "../src/lib/dictionaries.ts";
import * as localeModule from "../src/lib/locale.ts";

const require = createRequire(import.meta.url);
const { code } = require("@babel/core").transformSync(
  readFileSync(new URL("../src/lib/i18n.tsx", import.meta.url), "utf8"),
  {
    filename: "i18n.tsx",
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
const flush = () => new Promise((resolve) => setImmediate(resolve));
test("locale hydration cannot overwrite a new selection; writes stay ordered and failures can retry", async () => {
  const states: any[] = [];
  const refs: any[] = [];
  let stateIndex = 0,
    refIndex = 0;
  let effect: (() => unknown) | undefined;
  let restore!: (value: string) => void;
  const saved = new Promise<string>((resolve) => {
    restore = resolve;
  });
  let finishFirst!: () => void;
  const first = new Promise<void>((resolve) => {
    finishFirst = resolve;
  });
  const writes: string[] = [];
  let fail = false;
  const modules: Record<string, unknown> = {
    react: {
      createContext: () => ({ Provider: "Provider" }),
      useContext: () => {},
      useState: (initial: any) => {
        const i = stateIndex++;
        if (!(i in states))
          states[i] = typeof initial === "function" ? initial() : initial;
        return [
          states[i],
          (value: any) => {
            states[i] = value;
          },
        ];
      },
      useRef: (initial: any) => {
        const i = refIndex++;
        return (refs[i] ??= { current: initial });
      },
      useEffect: (fn: () => unknown) => {
        effect ??= fn;
      },
    },
    "react/jsx-runtime": require("react/jsx-runtime"),
    "react/compiler-runtime": {
      c: (n: number) => Array(n).fill(Symbol.for("react.memo_cache_sentinel")),
    },
    "expo-localization": {
      getLocales: () => [{ languageCode: "fr" }, { languageCode: "nb" }],
    },
    "./secure-storage": {
      secureStorage: {
        getItem: () => saved,
        setItem: async (key: string, value: string) => {
          assert.equal(key, "komisio.locale");
          writes.push(value);
          if (writes.length === 1) await first;
          if (fail) throw Error("storage unavailable");
        },
      },
    },
    "./dictionaries": { dictionaries },
    "./locale": localeModule,
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
    stateIndex = 0;
    refIndex = 0;
    return exports.I18nProvider({ children: null }).props.value;
  };
  const initial = render();
  assert.equal(initial.locale, "no");
  effect!();
  initial.setLocale("it");
  initial.setLocale("fi");
  restore("sv");
  await flush();
  assert.equal(render().locale, "fi");
  assert.deepEqual(writes, ["it"]);
  finishFirst();
  await flush();
  assert.deepEqual(writes, ["it", "fi"]);
  fail = true;
  render().setLocale("de");
  await flush();
  assert.equal(render().saveFailed, true);
  assert.equal(render().d.language, "Sprache");
  fail = false;
  render().setLocale("de");
  await flush();
  assert.equal(render().saveFailed, false);
  assert.deepEqual(writes, ["it", "fi", "de", "de"]);
});
