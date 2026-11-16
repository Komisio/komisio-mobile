import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createAccountDeletion,
  parseDeletion,
} from "../src/lib/account-deletion.ts";

const user = "a6870000-0000-4000-8000-000000000001";
const id = "a6870000-0000-4000-8000-000000000002";
const state = {
  id,
  status: "requested",
  createdAt: "2026-11-16T12:00:00Z",
  respondBy: "2026-12-16T12:00:00Z",
  updatedAt: "2026-11-16T12:00:00Z",
  revision: null,
};
test("deletion requires a bounded, explicit server receipt", () => {
  assert.equal(parseDeletion({ request: null }), null);
  assert.deepEqual(parseDeletion({ request: state }), state);
  for (const value of [
    { ok: true },
    { request: { ...state, id: "other" } },
    { request: { ...state, status: "deleted" } },
    { request: { ...state, respondBy: "soon" } },
  ])
    assert.throws(() => parseDeletion(value), /INVALID_REPLY/);
});
test("submission is self-bound, authenticated and never sends a tenant or user ID", async () => {
  const calls: { url: string; init: RequestInit }[] = [];
  const api = createAccountDeletion({
    portal: "https://app.example.test",
    session: async () => ({ user, token: "test-token" }),
    request: async (url, init) => {
      calls.push({ url, init });
      return {
        status: 200,
        text: async () => JSON.stringify({ request: state }),
      };
    },
  });
  assert.deepEqual(await api.submit(user, id, "sv"), state);
  assert.equal(
    calls[0].url,
    "https://app.example.test/api/mobile/v1/account-deletion",
  );
  assert.equal(calls[0].init.credentials, "omit");
  assert.equal(calls[0].init.redirect, "error");
  assert.deepEqual(JSON.parse(String(calls[0].init.body)), {
    action: "request",
    requestId: id,
    locale: "sv",
    confirmed: true,
  });
  await assert.rejects(api.submit("another-user", id, "sv"), /AUTH_REQUIRED/);
  assert.equal(calls.length, 1);
});
test("lost response never reports a successful request; retry can recover the existing case", async () => {
  let attempt = 0;
  const api = createAccountDeletion({
    portal: "https://app.example.test",
    session: async () => ({ user, token: "test-token" }),
    request: async () => {
      if (++attempt === 1) throw new Error("network");
      return {
        status: 200,
        text: async () => JSON.stringify({ request: state }),
      };
    },
  });
  await assert.rejects(api.submit(user, id, "sv"), /network/);
  assert.deepEqual(await api.submit(user, id, "sv"), state);
});
test("reject stale-account responses and proxy errors without exposing response text", async () => {
  let reads = 0;
  const deps = {
    portal: "https://app.example.test",
    session: async () => ({
      user: ++reads === 1 ? user : "new-user",
      token: "test-token",
    }),
    request: async () => ({
      status: 200,
      text: async () => JSON.stringify({ request: state }),
    }),
  };
  await assert.rejects(createAccountDeletion(deps).read(user), /AUTH_REQUIRED/);
  await assert.rejects(
    createAccountDeletion({
      ...deps,
      session: async () => ({ user, token: "x" }),
      request: async () => ({
        status: 503,
        text: async () => JSON.stringify({ error: "private failure detail" }),
      }),
    }).read(user),
    /^Error: REQUEST_FAILED$/,
  );
});
