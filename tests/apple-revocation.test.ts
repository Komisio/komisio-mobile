import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";

test("native Apple revocation is event-driven, account-bound and cleaned up", async () => {
  const require = createRequire(import.meta.url);
  const { code } = require("@babel/core").transformSync(
    readFileSync(
      new URL("../src/lib/apple-credential.ios.ts", import.meta.url),
      "utf8",
    ),
    {
      filename: "apple-credential.ios.ts",
      configFile: false,
      babelrc: false,
      presets: ["@babel/preset-typescript"],
      plugins: ["@babel/plugin-transform-modules-commonjs"],
    },
  );
  let listener = () => {},
    removed = 0,
    calls = 0,
    revoked = 0;
  let state: number | Error = 1;
  let pending: ((value: number) => void) | undefined;
  const module: {
    watchAppleRevocation?: (user: string, callback: () => void) => () => void;
  } = {};
  runInNewContext(code, {
    exports: module,
    require: (name: string) => {
      assert.equal(name, "expo-apple-authentication");
      return {
        AppleAuthenticationCredentialState: {
          AUTHORIZED: 1,
          REVOKED: 0,
          NOT_FOUND: 2,
        },
        addRevokeListener: (next: () => void) => {
          listener = next;
          return { remove: () => removed++ };
        },
        getCredentialStateAsync: async (user: string) => {
          assert.equal(user, "synthetic-apple-subject");
          calls++;
          if (state instanceof Error) throw state;
          if (state === 99)
            return new Promise<number>((resolve) => {
              pending = resolve;
            });
          return state;
        },
      };
    },
  });
  const stop = module.watchAppleRevocation!(
    "synthetic-apple-subject",
    () => revoked++,
  );
  const tick = () => new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(
    calls,
    0,
    "email/phone login does not poll a historically linked Apple credential",
  );
  listener();
  await tick();
  assert.equal(revoked, 0);
  state = new Error("native unavailable");
  listener();
  await tick();
  assert.equal(revoked, 0);
  state = 0;
  listener();
  listener();
  await tick();
  assert.equal(revoked, 1);
  stop();
  assert.equal(removed, 1);
  const stopNext = module.watchAppleRevocation!(
    "synthetic-apple-subject",
    () => revoked++,
  );
  state = 99;
  listener();
  stopNext();
  pending!(0);
  await tick();
  assert.equal(
    revoked,
    1,
    "a late native response cannot affect a replacement account",
  );
});
