import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";

const require = createRequire(import.meta.url);
const { transformSync } = require("@babel/core");

// Exercise the actual compiled screen handlers with controlled auth promises.
// Native rendering and Supabase session routing are outside this test.
function screen(name: "login" | "mfa") {
  const values: unknown[] = [];
  let cursor = 0;
  let finish: (() => void) | undefined;
  let attempts = 0;
  let challenges = 0;
  const request = () => {
    attempts++;
    return new Promise<void>((resolve) => {
      finish = resolve;
    });
  };
  const modules: Record<string, unknown> = {
    react: {
      useState(initial: unknown) {
        const index = cursor++;
        if (!(index in values)) values[index] = initial;
        return [
          values[index],
          (next: unknown) => {
            values[index] = next;
          },
        ];
      },
      useRef(initial: unknown) {
        const index = cursor++;
        if (!(index in values)) values[index] = { current: initial };
        return values[index];
      },
    },
    "react/compiler-runtime": {
      c: (size: number) =>
        Array(size).fill(Symbol.for("react.memo_cache_sentinel")),
    },
    "react/jsx-runtime": require("react/jsx-runtime"),
    "expo-web-browser": {},
    "@/components/ui": Object.fromEntries(
      ["Button", "Card", "Field", "Message", "Screen"].map((key) => [key, key]),
    ),
    "@/lib/i18n": {
      useI18n: () => ({
        d: {
          login: {
            email: "email",
            password: "password",
            submit: "login",
            offline: "offline",
            failed: "failed",
          },
          mfa: { code: "code", submit: "verify", failed: "failed" },
        },
      }),
    },
    "@/lib/session": {
      useSession: () => ({
        store: { name: "Synthetic store" },
        refreshAssurance: async () => {},
      }),
    },
    "@/lib/supabase": {
      supabase: {
        auth: {
          signInWithPassword: async () => {
            await request();
            throw new Error("offline");
          },
          mfa: {
            listFactors: async () => {
              await request();
              return {
                data: { totp: [{ id: "synthetic", status: "verified" }] },
              };
            },
            challengeAndVerify: async () => {
              challenges++;
              return { error: { code: "invalid" } };
            },
          },
        },
      },
    },
  };
  const compiled = transformSync(
    readFileSync(new URL(`../src/app/${name}.tsx`, import.meta.url), "utf8"),
    {
      filename: `${name}.tsx`,
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
  const exports: { default?: () => unknown } = {};
  runInNewContext(compiled, {
    exports,
    process: { env: {} },
    require: (id: string) => {
      assert.ok(Object.hasOwn(modules, id), id);
      return modules[id];
    },
  });
  type Element = { type: string; props: Record<string, any> };
  const render = () => {
    cursor = 0;
    const elements: Element[] = [];
    const visit = (node: any) => {
      if (Array.isArray(node)) node.forEach(visit);
      else if (node?.props) {
        elements.push(node);
        visit(node.props.children);
      }
    };
    visit(exports.default!());
    const find = (type: string, label: string) => {
      const match = elements.find(
        (el) => el.type === type && el.props.label === label,
      );
      assert.ok(match, `${type} ${label}`);
      return match.props;
    };
    return {
      field: (label: string) => find("Field", label),
      button: () => find("Button", name === "login" ? "login" : "verify"),
    };
  };
  return {
    render,
    attempts: () => attempts,
    challenges: () => challenges,
    finish: () => finish!(),
  };
}

for (const name of ["login", "mfa"] as const) {
  test(`${name}: keyboard cannot submit incomplete input`, async () => {
    const s = screen(name);
    const field = name === "login" ? "password" : "code";
    const initial = s.render();
    assert.equal(initial.button().disabled, true);
    void initial.field(field).onSubmitEditing();
    assert.equal(s.attempts(), 0);
    if (name === "login") {
      initial.field("email").onChangeText("   ");
      initial.field("password").onChangeText("synthetic-password");
    } else initial.field("code").onChangeText("123");
    void s.render().field(field).onSubmitEditing();
    assert.equal(s.attempts(), 0);
  });

  test(`${name}: repeated events before and after rendering busy share one attempt, then retry`, async () => {
    const s = screen(name);
    const initial = s.render();
    const field = name === "login" ? "password" : "code";
    if (name === "login") {
      initial.field("email").onChangeText("seller@example.test");
      initial.field("password").onChangeText("synthetic-password");
    } else initial.field("code").onChangeText("123456");
    const valid = s.render();
    const first = valid.field(field).onSubmitEditing();
    // No render between these events: a state-only guard is insufficient.
    void valid.button().onPress();
    void s.render().field(field).onSubmitEditing();
    assert.equal(s.attempts(), 1);
    assert.equal(s.render().button().busy, true);
    s.finish();
    await first;
    assert.equal(s.render().button().busy, false);
    if (name === "mfa") assert.equal(s.challenges(), 1);
    const retry = s.render().button().onPress();
    assert.equal(s.attempts(), 2);
    s.finish();
    await retry;
    assert.equal(s.render().button().busy, false);
  });
}
