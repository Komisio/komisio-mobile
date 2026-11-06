import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { parseOverview, recentSalesLimit } from "../src/lib/seller-overview.ts";
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
  let missingOverload = false;
  let saleCount = 0;
  const calls: string[] = [];
  const requestedLimits: (number | undefined)[] = [];
  const modules: Record<string, unknown> = {
    "./seller-overview": { parseOverview, recentSalesLimit },
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
          } else {
            assert.equal(name, "my_recent_sales");
            requestedLimits.push(args.p_limit);
            assert.ok(args.p_limit === 20 || args.p_limit === undefined);
          }
          return {
            abortSignal: (passed: AbortSignal) => {
              assert.equal(passed, signal);
              return Promise.resolve(
                name === "my_recent_sales"
                  ? {
                      data: {
                        sellerId: seller,
                        currency: "SEK",
                        limit: args.p_limit ?? 5,
                        items: Array.from(
                          { length: Math.min(saleCount, args.p_limit ?? 5) },
                          (_, i) => ({
                            id: `00000000-0000-4000-8000-${String(200 + i).padStart(12, "0")}`,
                            reference: `I-${i}`,
                            title: `Sale ${i}`,
                            soldAt: "2026-11-01T10:00:00Z",
                            soldPriceOre: 9000 + i,
                          }),
                        ),
                      },
                      error:
                        missingOverload && args.p_limit === 20
                          ? { code: "PGRST202" }
                          : salesError,
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
  assert.deepEqual(requestedLimits, [20]);
  saleCount = 27;
  const populated = await read();
  assert.equal(populated.recentSales.length, 20);
  assert.equal(populated.recentSales[19].title, "Sale 19");
  missingOverload = true;
  requestedLimits.length = 0;
  const legacy = await read();
  assert.equal(legacy.recentSales.length, 5);
  assert.deepEqual(requestedLimits, [20, undefined]);
  salesError = { code: "42501" };
  await assert.rejects(read, (error) => error === salesError);
  missingOverload = false;
  for (const error of [{ code: "PGRST202" }, { message: "Offline" }]) {
    salesError = error;
    requestedLimits.length = 0;
    assert.equal((await read()).recentSales, null);
    assert.equal((await read()).counts.active, 0);
    assert.deepEqual(
      requestedLimits,
      "code" in error ? [20, undefined, 20, undefined] : [20, 20],
    );
  }
  salesError = { code: "42501" };
  requestedLimits.length = 0;
  await assert.rejects(read, (error) => error === salesError);
  assert.deepEqual(requestedLimits, [20]);
  salesError = null;
  itemsError = { code: "42501" };
  await assert.rejects(read, (error) => error === itemsError);
});
