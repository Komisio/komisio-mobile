import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeBankDetails,
  parseBankCommand,
  parseBankDetails,
  parseBankVersion,
} from "../src/lib/bank-account.ts";
import {
  mobileEndpoint,
  bankCommandOutcome,
  sendBankCommand,
} from "../src/lib/mobile-command-http.ts";
import { bankCopy } from "../src/lib/bank-copy.ts";

const tenant = "00000000-0000-4000-8000-000000000001",
  seller = "00000000-0000-4000-8000-000000000002",
  requestId = "00000000-0000-4000-8000-000000000003";
const details = {
  holder: "Synthetic Seller",
  country: "SE",
  kind: "local" as const,
  account: "00012345",
  routing: "0123",
};
test("bank form preserves leading zeroes and uses the existing platform fields", () => {
  assert.deepEqual(
    normalizeBankDetails({
      ...details,
      holder: "  Synthetic Seller ",
      account: " 00012345 ",
    }),
    details,
  );
  assert.equal(parseBankDetails({ ...details, country: "NZ" }).country, "NZ");
  for (const bad of [
    { country: "XX" },
    { holder: " " },
    { routing: "x".repeat(101) },
    { account: "" },
    { kind: "swish" },
    { extra: true },
  ])
    assert.throws(() => parseBankDetails({ ...details, ...bad }));
});
test("IBAN normalization, country and checksum match the engine contract", () => {
  const iban = normalizeBankDetails({
    ...details,
    kind: "iban",
    country: "GB",
    account: "gb82 west 1234 5698 7654 32",
  });
  assert.equal(iban.account, "GB82WEST12345698765432");
  assert.equal(iban.routing, "");
  assert.throws(() => parseBankDetails({ ...iban, country: "SE" }));
  assert.throws(() =>
    parseBankDetails({ ...iban, account: "GB83WEST12345698765432" }),
  );
});
test("current bank and immutable commands are bound to exact seller and version", () => {
  assert.equal(parseBankVersion(null), null);
  const current = { id: requestId, details, createdAt: "2026-10-28T20:00:00Z" };
  assert.deepEqual(parseBankVersion(current), current);
  assert.throws(() => parseBankVersion({ ...current, id: "broken" }));
  const c = {
    action: "saveBank",
    tenantId: tenant,
    sellerId: seller,
    requestId,
    expected: null,
    details,
  };
  assert.deepEqual(parseBankCommand(c, tenant, seller), c);
  for (const bad of [
    { tenantId: seller },
    { sellerId: tenant },
    { expected: "bad" },
    { action: "requestPayout" },
    { token: "not allowed" },
  ])
    assert.throws(() => parseBankCommand({ ...c, ...bad }, tenant, seller));
});
test("command endpoint accepts only configured HTTPS or explicit loopback roots", () => {
  assert.equal(
    mobileEndpoint("https://portal.example.test/"),
    "https://portal.example.test/api/mobile/v1/seller",
  );
  assert.equal(
    mobileEndpoint("http://localhost:3000"),
    "http://localhost:3000/api/mobile/v1/seller",
  );
  for (const url of [
    undefined,
    "http://remote.example.test",
    "https://user:pw@example.test",
    "https://example.test/path",
    "https://example.test?token=secret",
    "https://example.test/#x",
    "https:\\example.test",
    " https://example.test",
    "file:///x",
  ])
    assert.equal(mobileEndpoint(url), null);
});
test("only exact success and bank version conflict clear pending intent", () => {
  assert.deepEqual(
    bankCommandOutcome(200, { ok: true, id: requestId }, requestId),
    { kind: "success", id: requestId },
  );
  assert.equal(
    bankCommandOutcome(409, { error: "BANK_DETAILS_CHANGED" }, requestId).kind,
    "conflict",
  );
  for (const [status, body] of [
    [200, { ok: true, id: seller }],
    [200, null],
    [503, {}],
    [400, { error: "INVALID_INPUT" }],
    [409, { error: "REQUEST_CONFLICT" }],
    [403, { error: "FORBIDDEN" }],
    [401, { error: "AUTH_REQUIRED" }],
  ])
    assert.equal(
      bankCommandOutcome(status as number, body, requestId).kind,
      "unknown",
    );
  assert.equal(
    bankCommandOutcome(403, { error: "MFA_REQUIRED" }, requestId).kind,
    "unknown",
  );
  assert.equal(
    bankCommandOutcome(409, { error: "PASSWORD_UPDATE_REQUIRED" }, requestId)
      .kind,
    "unknown",
  );
});
test("both app languages cover every bank state", () => {
  assert.deepEqual(
    Object.keys(bankCopy.sv).sort(),
    Object.keys(bankCopy.en).sort(),
  );
  for (const copy of Object.values(bankCopy))
    for (const value of Object.values(copy)) assert.ok(value.length > 0);
});

test("transport checks current identity and sends only the frozen command with redirect refusal", async () => {
  const c = parseBankCommand(
    {
      action: "saveBank",
      tenantId: tenant,
      sellerId: seller,
      requestId,
      expected: null,
      details,
    },
    tenant,
    seller,
  );
  let called = 0;
  const request = async (url: string, init: RequestInit) => {
    called++;
    assert.equal(url, "https://portal.example.test/api/mobile/v1/seller");
    assert.equal(init.redirect, "error");
    assert.equal(init.credentials, "omit");
    assert.equal(init.method, "POST");
    assert.equal(init.body, JSON.stringify(c));
    assert.deepEqual(init.headers, {
      "Content-Type": "application/json",
      Authorization: "Bearer synthetic-token",
    });
    assert.ok(init.signal instanceof AbortSignal);
    return {
      status: 200,
      text: async () => JSON.stringify({ ok: true, id: requestId }),
    };
  };
  const deps = {
    endpoint: "https://portal.example.test/api/mobile/v1/seller",
    user: "original-user",
    request,
    session: async () => ({ user: "original-user", token: "synthetic-token" }),
  };
  const changed = await sendBankCommand(c, {
    ...deps,
    session: async () => ({ user: "different-user", token: "other-token" }),
  });
  assert.equal(changed.kind, "unknown");
  assert.equal(called, 0);
  await sendBankCommand(c, { ...deps, session: async () => null });
  assert.equal(called, 0);
  assert.equal((await sendBankCommand(c, deps)).kind, "success");
  assert.equal(called, 1);
  for (const text of ["<html>not JSON</html>", "x".repeat(4097)]) {
    assert.equal(
      (
        await sendBankCommand(c, {
          ...deps,
          request: async () => ({ status: 200, text: async () => text }),
        })
      ).kind,
      "unknown",
    );
  }
  assert.equal(
    (
      await sendBankCommand(c, {
        ...deps,
        request: async () => {
          throw new Error("timeout");
        },
      })
    ).kind,
    "unknown",
  );
});
