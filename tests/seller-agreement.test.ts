import assert from "node:assert/strict";
import test from "node:test";
import {
  agreementOffset,
  parseAgreementArchive,
  type AgreementSelection,
} from "../src/lib/seller-agreement.ts";

const agreementId = "00000000-0000-4000-8000-000000000001";
const translationId = "00000000-0000-4000-8000-000000000002";
const evidenceId = "00000000-0000-4000-8000-000000000003";
const selection: AgreementSelection = { version: null, text: null, page: 0 };
function fixture() {
  return {
    agreement: {
      id: agreementId,
      version: 3,
      title: "Seller agreement",
      body: "First paragraph.\n\nSecond paragraph: <script>plain legal text</script>",
      language: "en",
      translationId,
    },
    acceptance: {
      id: evidenceId,
      at: "2026-10-28T12:00:00+00:00",
      source: "staff_recorded",
      language: "sv",
      translationId: null,
    },
    current: true,
    total: 1,
    languages: [
      { id: agreementId, language: "sv" },
      { id: translationId, language: "en" },
    ],
    history: [
      {
        id: agreementId,
        version: 3,
        title: "Original title",
        at: "2026-10-28T12:00:00+00:00",
        source: "staff_recorded",
      },
    ],
    internalNotes: "discard this",
  };
}
test("agreement text remains verbatim and viewing another language does not relabel acceptance", () => {
  const row = fixture(),
    result = parseAgreementArchive(row, selection);
  assert.equal(result.agreement!.body, row.agreement.body);
  assert.equal(result.agreement!.language, "en");
  assert.equal(result.acceptance!.language, "sv");
  assert.equal(result.acceptance!.translationId, null);
  assert.equal(result.acceptance!.source, "staff_recorded");
  assert.equal("internalNotes" in result, false);
});
test("historical selection and translation identity must match the requested document", () => {
  const row = fixture();
  row.current = false;
  assert.equal(
    parseAgreementArchive(row, {
      ...selection,
      version: agreementId,
      text: translationId,
    }).current,
    false,
  );
  assert.throws(() =>
    parseAgreementArchive(row, { ...selection, version: evidenceId }),
  );
  assert.throws(() =>
    parseAgreementArchive(row, { ...selection, text: agreementId }),
  );
  row.languages = [{ id: agreementId, language: "sv" }];
  assert.throws(() => parseAgreementArchive(row, selection));
});
test("an absent agreement differs from an unaccepted current agreement", () => {
  const missing = {
    agreement: null,
    acceptance: null,
    current: false,
    languages: [],
    history: [],
    total: 0,
  };
  assert.equal(parseAgreementArchive(missing, selection).agreement, null);
  const unaccepted = parseAgreementArchive(
    { ...fixture(), acceptance: null },
    selection,
  );
  assert.equal(unaccepted.current, true);
  assert.equal(unaccepted.acceptance, null);
  assert.throws(() =>
    parseAgreementArchive({ ...missing, current: true }, selection),
  );
  assert.throws(() =>
    parseAgreementArchive(
      { ...missing, acceptance: fixture().acceptance },
      selection,
    ),
  );
});
test("malformed languages, evidence, oversized content and duplicate rows fail closed", () => {
  const row = fixture();
  for (const change of [
    { language: "unknown" },
    { body: "x".repeat(12001) },
    { version: 0 },
  ])
    assert.throws(() =>
      parseAgreementArchive(
        { ...row, agreement: { ...row.agreement, ...change } },
        selection,
      ),
    );
  for (const change of [
    { at: "invalid" },
    { source: "assumed" },
    { id: "not-an-id" },
  ])
    assert.throws(() =>
      parseAgreementArchive(
        { ...row, acceptance: { ...row.acceptance, ...change } },
        selection,
      ),
    );
  assert.throws(() =>
    parseAgreementArchive(
      { ...row, history: [row.history[0], row.history[0]], total: 2 },
      selection,
    ),
  );
  assert.throws(() =>
    parseAgreementArchive(
      { ...row, languages: [row.languages[0], row.languages[0]] },
      selection,
    ),
  );
  assert.throws(() =>
    parseAgreementArchive(
      { ...row, history: Array(21).fill(row.history[0]), total: 21 },
      selection,
    ),
  );
});
test("unicode limits follow database characters without changing the stored text", () => {
  const row = fixture();
  row.agreement.body = "🌿".repeat(12000);
  assert.equal(
    parseAgreementArchive(row, selection).agreement!.body,
    row.agreement.body,
  );
});
test("history pagination uses 20-row server offsets with bounded valid identifiers", () => {
  assert.equal(agreementOffset(selection), 0);
  assert.equal(agreementOffset({ ...selection, page: 2 }), 40);
  assert.equal(agreementOffset({ ...selection, page: 100000 }), 2000000);
  for (const page of [-1, 0.5, Infinity, 100001])
    assert.throws(() => agreementOffset({ ...selection, page }));
  assert.throws(() => agreementOffset({ ...selection, text: "wrong" }));
  const row = fixture();
  row.total = 41;
  assert.equal(parseAgreementArchive(row, { ...selection, page: 2 }).total, 41);
});
