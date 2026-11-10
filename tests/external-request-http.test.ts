import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createExternalRequestApi,
  externalItemsEndpoint,
  parseExternalPage,
} from "../src/lib/external-request-http.ts";
import {
  hasVerifiedEmail,
  hasVerifiedPhone,
} from "../src/lib/identity-gates.ts";
import { externalSubmissionCopy } from "../src/lib/external-submission-copy.ts";
import { locales } from "../src/lib/locale.ts";
const id = (n: number) =>
  `e9300000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const row = {
  id: id(1),
  tenant_id: id(2),
  store_name: "Synthetic",
  description: "Jacket",
  brand: "",
  condition: "good",
  notes: "",
  desired_price_ore: "15000",
  currency: "SEK",
  photos: [id(3)],
  created_at: "2026-11-10T12:00:00Z",
  status: "waiting",
  decline_note: null,
};
function fixture() {
  let user = id(4),
    status = 200,
    body: unknown = { activeCount: 1, hasMore: false, requests: [row] };
  const calls: { url: string; init: RequestInit }[] = [];
  const api = createExternalRequestApi({
    endpoint: externalItemsEndpoint("https://app.komisio.com"),
    ownerId: id(4),
    session: async () => ({ user, token: "synthetic-token" }),
    request: async (url, init) => {
      calls.push({ url, init });
      return { status, text: async () => JSON.stringify(body) };
    },
  });
  return {
    api,
    calls,
    actor: (value: string) => {
      user = value;
    },
    reply: (s: number, b: unknown) => {
      status = s;
      body = b;
    },
  };
}
test("external requests use the selected HTTPS origin and never include cookies", async () => {
  const f = fixture();
  await f.api.list();
  assert.equal(
    f.calls[0].url,
    "https://app.komisio.com/api/mobile/v1/external-items",
  );
  assert.equal(f.calls[0].init.credentials, "omit");
  assert.equal(f.calls[0].init.redirect, "error");
  assert.equal(JSON.parse(f.calls[0].init.body as string).action, "list");
  for (const value of [
    "http://remote.example",
    "https://user:secret@example.com",
    "https://example.com/?token=x",
    "file:///tmp/test",
  ])
    assert.equal(externalItemsEndpoint(value), null);
});
test("every request rechecks the journal owner before dispatch", async () => {
  const f = fixture();
  f.actor(id(5));
  await assert.rejects(f.api.list(), /SESSION_CHANGED/);
  await assert.rejects(
    f.api.upload(id(3), new Uint8Array([255, 216, 255])),
    /SESSION_CHANGED/,
  );
  assert.equal(f.calls.length, 0);
});
test("lookup fails closed on a different request or an incomplete page", async () => {
  const f = fixture();
  assert.equal((await f.api.lookup(id(1)))?.id, id(1));
  await assert.rejects(f.api.lookup(id(9)), /SUBMISSION_UNAVAILABLE/);
  f.reply(200, { activeCount: 1, hasMore: true, requests: [row] });
  await assert.rejects(f.api.lookup(id(1)), /SUBMISSION_UNAVAILABLE/);
});
test("upload requires an exact photo receipt and bounded bytes", async () => {
  const f = fixture();
  f.reply(200, { id: id(3) });
  await f.api.upload(id(3), new Uint8Array([255, 216, 255]));
  assert.match(f.calls[0].url, /photos\?photoId=/);
  assert.equal(
    new Headers(f.calls[0].init.headers).get("Content-Type"),
    "image/jpeg",
  );
  f.reply(200, { id: id(9) });
  await assert.rejects(
    f.api.upload(id(3), new Uint8Array([255])),
    /SUBMISSION_UNAVAILABLE/,
  );
  await assert.rejects(
    f.api.upload(id(3), new Uint8Array(3 * 1024 * 1024 + 1)),
    /PHOTO_INVALID/,
  );
});
test("server internals and unknown failures never become user-visible messages", async () => {
  const f = fixture();
  f.reply(503, { error: "private provider detail" });
  await assert.rejects(f.api.list(), /^Error: SUBMISSION_UNAVAILABLE$/);
  f.reply(409, { error: "ACTIVE_REQUEST_LIMIT" });
  await assert.rejects(f.api.list(), /^Error: ACTIVE_REQUEST_LIMIT$/);
  f.reply(500, { error: "ACTIVE_REQUEST_LIMIT" });
  await assert.rejects(f.api.list(), /^Error: SUBMISSION_UNAVAILABLE$/);
  f.reply(200, "x".repeat(140000));
  await assert.rejects(f.api.list(), /SUBMISSION_UNAVAILABLE/);
});
test("request pages reject malformed rows, money, statuses and overlong pages", () => {
  for (const patch of [
    { requests: [null] },
    { requests: [{ ...row, desired_price_ore: 15000 }] },
    { requests: [{ ...row, status: "sold" }] },
    { activeCount: 11 },
    { requests: Array(26).fill(row) },
    { requests: [{ ...row, photos: [] }] },
    { requests: [{ ...row, decline_note: "x".repeat(1001) }] },
  ])
    assert.throws(() =>
      parseExternalPage({
        activeCount: 1,
        hasMore: false,
        requests: [row],
        ...patch,
      }),
    );
});
test("phone-only identities do not gain the existing email seller routes", () => {
  const phone = {
    phone: "46700000001",
    phone_confirmed_at: "2026-11-10",
    user_metadata: { email_confirmed_at: "fake" },
  };
  assert.equal(hasVerifiedEmail(phone as never), false);
  assert.equal(hasVerifiedPhone(phone as never), true);
  assert.equal(hasVerifiedPhone({ phone: phone.phone } as never), false);
  assert.equal(
    hasVerifiedEmail({
      email: "test@example.invalid",
      email_confirmed_at: "2026-11-10",
    } as never),
    true,
  );
});
test("all app languages cover the submission flow with matching placeholders", () => {
  const reference = externalSubmissionCopy("sv");
  for (const locale of locales) {
    const copy = externalSubmissionCopy(locale);
    assert.deepEqual(Object.keys(copy).sort(), Object.keys(reference).sort());
    for (const key of Object.keys(reference) as (keyof typeof reference)[]) {
      assert.ok(copy[key].trim());
      assert.deepEqual(
        copy[key].match(/\{\w+\}/g),
        reference[key].match(/\{\w+\}/g),
      );
    }
  }
});
