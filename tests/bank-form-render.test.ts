import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import * as bank from "../src/lib/bank-account.ts";
import { bankCopy } from "../src/lib/bank-copy.ts";

const require = createRequire(import.meta.url);
const { transformSync } = require("@babel/core");
const compiled = transformSync(
  readFileSync(
    new URL("../src/app/bank-account.tsx", import.meta.url),
    "utf8",
  ) + "\nexport {BankForm, BankAccount};",
  {
    filename: "bank-account.tsx",
    configFile: false,
    babelrc: false,
    presets: ["@babel/preset-typescript"],
    plugins: [
      "babel-plugin-react-compiler",
      ["@babel/plugin-transform-react-jsx", { runtime: "automatic" }],
      "@babel/plugin-transform-modules-commonjs",
    ],
  },
).code;

// Real compiled screen, isolated hook/read adapters; no native or network runtime.
function harness(
  country: string | null = "SE",
  countryStatus = "ready",
  pending = false,
) {
  let readIndex = 0;
  let retries = 0;
  const reads = [
    { status: "ready", data: null },
    { status: countryStatus, data: country },
  ];
  const modules: Record<string, unknown> = {
    react: {
      useState: (initial: unknown) => [
        typeof initial === "function" ? initial() : initial,
        () => {},
      ],
      useMemo: (fn: () => unknown) => fn(),
      useCallback: (fn: unknown) => fn,
      useSyncExternalStore: (_subscribe: unknown, get: () => unknown) => get(),
    },
    "react/compiler-runtime": {
      c: (size: number) =>
        Array(size).fill(Symbol.for("react.memo_cache_sentinel")),
    },
    "react/jsx-runtime": require("react/jsx-runtime"),
    "react-native": {
      StyleSheet: { create: (x: unknown) => x },
      Text: "Text",
      View: "View",
    },
    "expo-router": { router: {}, useFocusEffect: () => {} },
    "expo-crypto": {},
    "@/components/pending-discard": {},
    "@/components/seller-gate": {},
    "@/components/ui": {
      ...Object.fromEntries(
        ["Button", "Field", "Loading", "Message", "Screen"].map((n) => [n, n]),
      ),
      uiStyles: {},
    },
    "@/lib/i18n": {
      useI18n: () => ({ d: { bank: bankCopy.sv, retry: "Retry" } }),
    },
    "@/lib/session": { useSession: () => ({}) },
    "@/lib/scoped-read": {
      createScopedRead: () => {
        const index = readIndex++;
        return { getState: () => reads[index] };
      },
    },
    "@/lib/bank-account": bank,
    "@/lib/bank-account-api": {
      bankEndpoint: "https://example.test",
      bankWriter: () => ({
        getState: () => ({
          status: pending ? "pending" : "ready",
          command: null,
        }),
        retry: () => {
          retries++;
        },
      }),
    },
  };
  const exports: Record<string, (props: unknown) => unknown> = {};
  runInNewContext(compiled, {
    exports,
    require: (name: string) => {
      assert.ok(name in modules, name);
      return modules[name];
    },
  });
  return { exports, retries: () => retries };
}
type Element = { type: unknown; props: Record<string, any> };
function elements(node: any): Element[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  return node?.props ? [node, ...elements(node.props.children)] : [];
}

test("compiled bank form exposes exactly the three local fields and saves store country", () => {
  const { exports } = harness("DK");
  let saved: unknown;
  const current = {
    id: "synthetic",
    createdAt: "2026-10-29",
    details: {
      holder: "Synthetic",
      account: "00012345",
      routing: "0123",
      kind: "local",
      country: "DK",
    },
  };
  const tree = elements(
    exports.BankForm({
      current,
      country: "DK",
      enabled: true,
      onSave: (value: unknown) => {
        saved = value;
      },
    }),
  );
  assert.deepEqual(
    tree.filter((e) => e.type === "Field").map((e) => e.props.label),
    ["Kontohavare", "Clearingnummer", "Kontonummer"],
  );
  tree
    .find((e) => e.type === "Button" && e.props.label === "Spara konto")!
    .props.onPress();
  assert.deepEqual(saved, current.details);
});

test("compiled bank screen blocks editing until a valid store country is ready", () => {
  for (const [country, status] of [
    [null, "ready"],
    [null, "failed"],
    [null, "loading"],
    ["SE", "ready"],
  ] as const) {
    const { exports } = harness(country, status);
    const tree = elements(
      exports.BankAccount({
        user: "synthetic",
        tenant: "synthetic",
        seller: "synthetic",
        slug: "chosen",
      }),
    );
    assert.equal(
      tree.some((e) => e.props.country === "SE" && "onSave" in e.props),
      country === "SE",
    );
  }
});

test("missing store country does not prevent retrying an already pending command", () => {
  const h = harness(null, "failed", true);
  const tree = elements(
    h.exports.BankAccount({
      user: "synthetic",
      tenant: "synthetic",
      seller: "synthetic",
      slug: "chosen",
    }),
  );
  const retry = tree.find(
    (e) => e.type === "Button" && e.props.label === bankCopy.sv.retrySame,
  )!;
  assert.equal(retry.props.disabled, false);
  retry.props.onPress();
  assert.equal(h.retries(), 1);
});
