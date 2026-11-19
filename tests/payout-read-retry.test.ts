import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { compilePreview } from "./helpers/compile-preview.ts";
import { parsePayoutPage } from "../src/lib/seller-payouts.ts";

const tenant = "00000000-0000-4000-8000-000000000001";
const seller = "00000000-0000-4000-8000-000000000002";
const page = {
  tenantId: tenant,
  sellerId: seller,
  currency: "SEK",
  total: 0,
  offset: 0,
  limit: 25,
  payouts: [],
  thresholdOre: 10000,
  balance: { sellerId: seller, availableOre: 100, reservedOre: 0, paidOre: 0 },
};

function reader(
  fetch: typeof globalThis.fetch,
  central = false,
  bankRead = async (): Promise<object | null> => {
    throw new Error("unexpected bank read");
  },
) {
  const supabase = createClient("https://example.invalid", "test-key", {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: { fetch },
  });
  const api = compilePreview(
    "lib/payout-api.ts",
    {
      "expo/fetch": {},
      "./supabase": { supabase },
      "./command-storage": {},
      "./bank-account-api": { readBank: bankRead },
      "./command-lock": {},
      "./pending-command": {},
      "./mobile-command-http": { mobileEndpoint: () => null },
      "./seller-payouts": { parsePayoutPage },
    },
    { process: { env: {} } },
  );
  return (signal = new AbortController().signal) =>
    api.readPayouts(tenant, seller, 0, signal, central);
}

test("central balances use only the bank status, with an owner-scoped fallback on earlier servers", async () => {
  for (const missing of [true, false]) {
    const read = reader(
      async () => Response.json({ ...page, bankAccountMissing: missing }),
      true,
    );
    assert.equal((await read()).bankAccountMissing, missing);
    let calls = 0;
    const legacy = reader(
      async () => Response.json(page),
      true,
      async () => {
        calls++;
        return missing ? null : { id: "saved" };
      },
    );
    assert.equal((await legacy()).bankAccountMissing, missing);
    assert.equal(calls, 1);
  }
});

test("Money recovers from a temporary service failure during the same read", async () => {
  const calls: Request[] = [];
  const read = reader(async (url, init) => {
    calls.push(new Request(url, init));
    if (calls.length === 1)
      return new Response(null, {
        status: 503,
        headers: { "Retry-After": "0" },
      });
    return Response.json(page);
  });
  assert.equal((await read()).balance.availableOre, 100);
  assert.equal(calls.length, 2);
  for (const request of calls) {
    const url = new URL(request.url);
    assert.equal(url.pathname, "/rest/v1/rpc/my_seller_payouts_page");
    assert.deepEqual(Object.fromEntries(url.searchParams), {
      p_tenant: tenant,
      p_seller: seller,
      p_offset: "0",
    });
    assert.match(request.headers.get("cache-control") ?? "", /no-store/);
  }
});

test("Money never retries an access denial or consumes another seller's balance", async () => {
  for (const result of [
    () =>
      Response.json({ code: "42501", message: "FORBIDDEN" }, { status: 403 }),
    () => Response.json({ ...page, sellerId: tenant }),
  ]) {
    let calls = 0;
    const read = reader(async () => {
      calls++;
      return result();
    });
    await assert.rejects(read());
    assert.equal(calls, 1);
  }
});

test("a network drop recovers, but leaving the tab cancels the pending retry", async () => {
  for (const leave of [false, true]) {
    const controller = new AbortController();
    let calls = 0;
    const read = reader(async (_url, init) => {
      init?.signal?.throwIfAborted();
      calls++;
      if (calls === 1) {
        if (leave) controller.abort();
        throw new TypeError("Network request failed");
      }
      return Response.json(page);
    });
    if (leave) {
      await assert.rejects(read(controller.signal));
      assert.equal(calls, 1);
    } else {
      assert.equal((await read(controller.signal)).balance.availableOre, 100);
      assert.equal(calls, 2);
    }
  }
});
