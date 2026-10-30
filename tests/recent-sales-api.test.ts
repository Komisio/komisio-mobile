import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { parseOverview } from "../src/lib/seller-overview.ts";
import { readFailure } from "../src/lib/catalogue.ts";

const require = createRequire(import.meta.url);
const { transformSync } = require("@babel/core");
const { code } = transformSync(
  readFileSync(
    new URL("../src/lib/seller-overview-api.ts", import.meta.url),
    "utf8",
  ),
  {
    filename: "seller-overview-api.ts",
    configFile: false,
    babelrc: false,
    presets: ["@babel/preset-typescript"],
    plugins: ["@babel/plugin-transform-modules-commonjs"],
  },
);
const seller = "00000000-0000-4000-8000-000000000001";
test("overview reads item counts and bounded sale activity; rollout failure is not empty history", async () => {
  const signal = new AbortController().signal;
  let salesError: unknown = null;
  let itemsError: unknown = null;
  const calls: string[] = [];
  const modules: Record<string, unknown> = {
    "./seller-overview": { parseOverview },
    "./catalogue": { readFailure },
    "./supabase": {
      supabase: {
        rpc: (name: string, args: any) => {
          calls.push(name);
          assert.equal(args.p_tenant, "tenant");
          assert.equal(args.p_seller, seller);
          if (name === "my_items_page") {
            assert.equal(args.p_status, "expiring");
            assert.equal(args.p_offset, 0);
          } else assert.equal(name, "my_recent_sales");
          return {
            abortSignal: (passed: AbortSignal) => {
              assert.equal(passed, signal);
              return Promise.resolve(
                name === "my_recent_sales"
                  ? {
                      data: {
                        sellerId: seller,
                        currency: "SEK",
                        limit: 5,
                        items: [],
                      },
                      error: salesError,
                    }
                  : {
                      data: {
                        currency: "SEK",
                        items: [],
                        offset: 0,
                        total: 0,
                        counts: { active: 0, sold: 0, ended: 0 },
                      },
                      error: itemsError,
                    },
              );
            },
          };
        },
      },
    },
  };
  const exports: any = {};
  runInNewContext(code, {
    exports,
    require: (name: string) => {
      assert.ok(Object.hasOwn(modules, name), name);
      return modules[name];
    },
  });
  const read = () => exports.readSellerOverview("tenant", seller, signal);
  assert.deepEqual((await read()).recentSales, []);
  assert.deepEqual(calls, ["my_recent_sales", "my_items_page"]);
  for (const error of [{ code: "PGRST202" }, { message: "Offline" }]) {
    salesError = error;
    assert.equal((await read()).recentSales, null);
    assert.equal((await read()).counts.active, 0);
  }
  salesError = { code: "42501" };
  await assert.rejects(read, (error) => error === salesError);
  salesError = null;
  itemsError = { code: "42501" };
  await assert.rejects(read, (error) => error === itemsError);
});
