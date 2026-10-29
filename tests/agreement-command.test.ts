import assert from "node:assert/strict";
import test from "node:test";
import {
  agreementIntent,
  agreementCommandOutcome,
  parsePendingAgreement,
} from "../src/lib/agreement-command.ts";
import {
  createPendingCommand,
  type CommandOutcome,
} from "../src/lib/pending-command.ts";
import { sendMobileCommand } from "../src/lib/mobile-command-http.ts";
import type { AgreementArchive } from "../src/lib/seller-agreement.ts";
const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const tenant = id(1),
  seller = id(2);
function archive(): AgreementArchive {
  return {
    agreement: {
      id: id(3),
      version: 4,
      title: "Original published title",
      body: "Exact text",
      language: "de",
      translationId: id(4),
    },
    acceptance: null,
    current: true,
    total: 0,
    languages: [
      { id: id(3), language: "sv" },
      { id: id(4), language: "de" },
    ],
    history: [],
  };
}
const intent = () => agreementIntent(archive(), tenant, seller, id(5));
test("explicit intent captures the displayed version and translation, only for unaccepted current text", () => {
  const pending = intent();
  assert.deepEqual(pending.document, {
    version: 4,
    title: "Original published title",
    language: "de",
  });
  assert.equal(pending.command.agreementId, id(3));
  assert.equal(pending.command.translationId, id(4));
  const original = archive();
  original.agreement!.language = "sv";
  original.agreement!.translationId = null;
  assert.equal(
    agreementIntent(original, tenant, seller, id(5)).command.translationId,
    null,
  );
  for (const value of [
    { ...archive(), current: false },
    { ...archive(), agreement: null },
    {
      ...archive(),
      acceptance: {
        id: id(6),
        at: "2026-10-28T12:00:00Z",
        source: "staff_recorded" as const,
        language: "sv" as const,
        translationId: null,
      },
    },
  ])
    assert.throws(() => agreementIntent(value, tenant, seller, id(5)));
});
test("stored agreement intent fails closed on foreign scope, unknown language, metadata or IDs", () => {
  for (const patch of [
    { tenantId: seller },
    { sellerId: tenant },
    { requestId: "bad" },
    { agreementId: "bad" },
    { translationId: "bad" },
    { translationId: id(3) },
    { action: "publishAgreement" },
    { body: "extra" },
  ])
    assert.throws(() =>
      parsePendingAgreement(
        { ...intent(), command: { ...intent().command, ...patch } },
        tenant,
        seller,
      ),
    );
  for (const patch of [
    { version: 0 },
    { version: 1.5 },
    { title: "x".repeat(121) },
    { language: "fr" },
    { body: "extra" },
  ])
    assert.throws(() =>
      parsePendingAgreement(
        { ...intent(), document: { ...intent().document, ...patch } },
        tenant,
        seller,
      ),
    );
  assert.throws(() =>
    parsePendingAgreement({ ...intent(), unexpected: true }, tenant, seller),
  );
});
test("success accepts existing equivalent evidence IDs; only current-version conflict releases intent", () => {
  assert.deepEqual(agreementCommandOutcome(200, { ok: true, id: id(99) }), {
    kind: "success",
    id: id(99),
  });
  assert.equal(
    agreementCommandOutcome(200, { ok: true, id: "bad" }).kind,
    "unknown",
  );
  assert.equal(
    agreementCommandOutcome(409, { error: "AGREEMENT_CHANGED" }).kind,
    "conflict",
  );
  for (const error of [
    "FORBIDDEN",
    "INVALID_INPUT",
    "REQUEST_CONFLICT",
    "SELLER_CLOSED",
    "MFA_REQUIRED",
    "AUTH_REQUIRED",
    "PASSWORD_UPDATE_REQUIRED",
  ])
    assert.equal(agreementCommandOutcome(409, { error }).kind, "unknown");
});
test("display metadata does not enter the command API", async () => {
  let body: unknown;
  const result = await sendMobileCommand(
    intent().command,
    {
      endpoint: "https://portal.example.test/api/mobile/v1/seller",
      user: "synthetic-user",
      session: async () => ({
        user: "synthetic-user",
        token: "synthetic-token",
      }),
      request: async (_url, init) => {
        body = JSON.parse(String(init.body));
        return {
          status: 200,
          text: async () => JSON.stringify({ ok: true, id: id(99) }),
        };
      },
    },
    agreementCommandOutcome,
  );
  assert.deepEqual(body, intent().command);
  assert.deepEqual(result, { kind: "success", id: id(99) });
});
test("unknown acceptance restores without sending and retries the original document after language changes", async () => {
  let raw: string | null = null;
  const sent: unknown[] = [];
  let outcome: CommandOutcome = { kind: "unknown", code: "UNKNOWN" };
  const writer = () =>
    createPendingCommand({
      key: "agreement",
      binding: "identity/project/api",
      storage: {
        getItem: async () => raw,
        setItem: async (_key, value) => {
          raw = value;
        },
        removeItem: async () => {
          raw = null;
        },
      },
      lock: async (_key, work) => work(),
      parse: (value) => parsePendingAgreement(value, tenant, seller),
      send: async (value) => {
        sent.push(structuredClone(value));
        return outcome;
      },
    });
  await writer().submit(intent());
  const restarted = writer();
  await restarted.load();
  assert.equal(sent.length, 1);
  const changed = archive();
  changed.agreement!.language = "sv";
  changed.agreement!.translationId = null;
  await restarted.submit(agreementIntent(changed, tenant, seller, id(6)));
  assert.equal(sent.length, 1);
  outcome = { kind: "success", id: id(99) };
  await restarted.retry();
  assert.deepEqual(sent, [intent(), intent()]);
  assert.equal(raw, null);
  assert.equal(restarted.getState().status, "success");
});
