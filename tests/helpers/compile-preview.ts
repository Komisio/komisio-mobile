import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
const require = createRequire(import.meta.url);
const ts = require("typescript");

/** Run the real adapter/runtime code with only its platform boundary replaced. */
export function compilePreview(
  file: string,
  modules: Record<string, unknown>,
  globals: Record<string, unknown> = {},
) {
  const exports: Record<string, any> = {};
  const source = readFileSync(
    new URL(`../../src/${file}`, import.meta.url),
    "utf8",
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });
  runInNewContext(outputText, {
    exports,
    URL,
    Blob,
    Error,
    Uint8Array,
    structuredClone,
    require(name: string) {
      if (name === "react/jsx-runtime") return require(name);
      assert.ok(Object.hasOwn(modules, name), `Unexpected module: ${name}`);
      return modules[name];
    },
    ...globals,
  });
  return exports;
}
