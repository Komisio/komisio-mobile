import test from "node:test";
import assert from "node:assert/strict";
import { compilePreview } from "./helpers/compile-preview.ts";
import * as shipping from "../src/lib/central-shipping.ts";
import { createExternalIdentityRead } from "../src/lib/external-offer-http.ts";
import { externalItemsEndpoint } from "../src/lib/external-request-http.ts";

for (const limit of [2000, 2500])
  test(`shipping negotiates capacity and accepts a ${limit} g response`, async () => {
    const user = "f7800000-0000-4000-8000-000000000002";
    const offer = "f7800000-0000-4000-8000-000000000401";
    const calls: unknown[] = [];
    const { readShipping } = compilePreview(
      "lib/central-shipping-runtime.ts",
      {
        "expo/fetch": {
          fetch: async (url: string, init: RequestInit) => {
            assert.equal(
              url,
              "https://portal.example.test/api/mobile/v1/external-items/shipping",
            );
            calls.push(JSON.parse(String(init.body)));
            return Response.json({
              offerId: offer,
              available: true,
              parcel: null,
              eligibleItems: [],
              selectionWeightLimitG: limit,
            });
          },
        },
        "./supabase": {
          supabase: {
            auth: {
              getSession: async () => ({
                data: {
                  session: { user: { id: user }, access_token: "synthetic" },
                },
                error: null,
              }),
            },
          },
        },
        "./external-request-http": { externalItemsEndpoint },
        "./external-offer-http": { createExternalIdentityRead },
        "./pending-command": {},
        "./command-storage": {},
        "./command-lock": {},
        "./mobile-command-http": {},
        "./central-shipping": shipping,
      },
      {
        process: {
          env: { EXPO_PUBLIC_KOMISIO_WEB_URL: "https://portal.example.test" },
        },
      },
    );
    const result = await readShipping(user, offer);
    assert.equal(result.selectionWeightLimitG, limit);
    assert.deepEqual(calls, [{ action: "read", offerId: offer, protocol: 2 }]);
  });
