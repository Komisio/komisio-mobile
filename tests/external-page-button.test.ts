import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { dictionaries } from "../src/lib/dictionaries.ts";
import { locales } from "../src/lib/locale.ts";

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
    require: (id: string) => {
      if (id === "react/jsx-runtime") return require(id);
      if (id === "react/compiler-runtime")
        return {
          c: (n: number) =>
            Array(n).fill(Symbol.for("react.memo_cache_sentinel")),
        };
      assert.ok(Object.hasOwn(modules, id), id);
      return modules[id];
    },
  });
  return exports;
}

function harness(openBrowserAsync: (url: string) => Promise<{ type: string }>) {
  const values: any[] = [];
  let cursor = 0;
  let focus: (() => () => void) | undefined;
  let cleanup: (() => void) | undefined;
  const { ExternalPageButton } = compile(
    "../src/components/external-page-button.tsx",
    {
      react: {
        useState(initial: unknown) {
          const i = cursor++;
          if (!(i in values)) values[i] = initial;
          return [
            values[i],
            (next: unknown) => {
              values[i] = next;
            },
          ];
        },
        useRef(initial: unknown) {
          const i = cursor++;
          if (!(i in values)) values[i] = { current: initial };
          return values[i];
        },
        useCallback: (cb: unknown) => cb,
      },
      "expo-router": {
        useFocusEffect: (cb: () => () => void) => {
          if (!focus) {
            focus = cb;
            cleanup = cb();
          }
        },
      },
      "expo-web-browser": { openBrowserAsync },
      "@/lib/i18n": { useI18n: () => ({ d: dictionaries.en }) },
      "./ui": { Button: "Button", Message: "Message" },
    },
  );
  return {
    render() {
      cursor = 0;
      const tree = ExternalPageButton({
        label: "Privacy policy",
        url: "https://komisio.com/en/privacy/",
      });
      const [button, message] = tree.props.children;
      assert.ok(
        !button.props.busy && !button.props.disabled,
        "a pending presentation must remain retryable",
      );
      return { press: button.props.onPress, error: message?.props?.children };
    },
    blur: () => cleanup!(),
    focus: () => {
      cleanup = focus!();
    },
  };
}
const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
};
function deferred() {
  let resolve!: (value: { type: string }) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<{ type: string }>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

test("locked and rejected browser opens show an error, then a retry clears it", async () => {
  for (const failure of [
    () => Promise.resolve({ type: "locked" }),
    () => Promise.reject(new Error("native failure")),
  ]) {
    let calls = 0;
    const s = harness(() =>
      ++calls === 1 ? failure() : Promise.resolve({ type: "dismiss" }),
    );
    s.render().press();
    await flush();
    assert.equal(s.render().error, dictionaries.en.externalPage.failed);
    s.render().press();
    assert.equal(s.render().error, undefined);
    await flush();
    assert.equal(s.render().error, undefined);
    assert.equal(calls, 2);
  }
});

test("an unsettled iOS presentation allows another native call and ignores late stale failure", async () => {
  const first = deferred();
  let calls = 0;
  const s = harness(() =>
    ++calls === 1 ? first.promise : Promise.resolve({ type: "opened" }),
  );
  s.render().press();
  await flush();
  s.render().press();
  await flush();
  assert.equal(calls, 2);
  first.reject(new Error("old presentation"));
  await flush();
  assert.equal(s.render().error, undefined);
});

test("a previous dismissal cannot erase a newer locked error; focus clears it", async () => {
  const first = deferred();
  let calls = 0;
  const s = harness(() =>
    ++calls === 1 ? first.promise : Promise.resolve({ type: "locked" }),
  );
  s.render().press();
  s.render().press();
  await flush();
  first.resolve({ type: "cancel" });
  await flush();
  assert.equal(s.render().error, dictionaries.en.externalPage.failed);
  s.blur();
  s.focus();
  assert.equal(s.render().error, undefined);
});

test("late rejection after blur or unmount cannot restore an error", async () => {
  const attempt = deferred();
  const s = harness(() => attempt.promise);
  s.render().press();
  s.blur();
  s.focus();
  attempt.reject(new Error("late"));
  await flush();
  assert.equal(s.render().error, undefined);
});

test("all eight policy labels and locale URLs pass through the shared external-page button", () => {
  for (const locale of locales) {
    const { PrivacyLink } = compile("../src/components/privacy-link.tsx", {
      "@/lib/i18n": { useI18n: () => ({ locale, d: dictionaries[locale] }) },
      "./external-page-button": { ExternalPageButton: "ExternalPageButton" },
    });
    const button = PrivacyLink();
    assert.equal(button.type, "ExternalPageButton");
    assert.equal(button.props.label, dictionaries[locale].externalPage.privacy);
    assert.equal(
      button.props.url,
      `https://komisio.com/${locale === "sv" ? "sv" : "en"}/privacy/`,
    );
  }
});
