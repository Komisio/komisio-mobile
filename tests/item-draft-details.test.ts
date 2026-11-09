import assert from "node:assert/strict";
import test from "node:test";
import {
  PhotoDraftRepository,
  parsePhotoDraft,
  type PhotoDraftStorage,
  type PhotoDraft,
} from "../src/lib/photo-draft.ts";
import {
  emptyItemDetails,
  itemDetailsErrors,
  parseItemDraftDetails,
  requestedPriceOre,
} from "../src/lib/item-draft-details.ts";
import type { ExternalStore } from "../src/lib/external-stores.ts";

const firstPhoto = "00000000-0000-4000-8000-000000000001";
const store: ExternalStore = {
  id: "00000000-0000-4000-8000-000000000099",
  name: "Synthetic store",
  slug: "synthetic",
  city: null,
  country: null,
  currency: "SEK",
};
const details = {
  description: "Jacket",
  brand: "",
  condition: "good" as const,
  notes: "Small mark",
  desiredPrice: "1000,50",
};
function fixture() {
  let saved: unknown = { version: 1, photoIds: [firstPhoto] };
  let sequence = 10;
  let fail = false;
  const storage: PhotoDraftStorage = {
    read: async () => structuredClone(saved),
    write: async (value: PhotoDraft) => {
      if (fail) throw new Error("full");
      saved = structuredClone(value);
    },
    importPhoto: async () => {},
    uri: async (id) => `file:///${id}`,
    cleanup: async () => {},
  };
  const repo = new PhotoDraftRepository(
    storage,
    () => `00000000-0000-4000-8000-${String(++sequence).padStart(12, "0")}`,
  );
  return {
    repo,
    fail: (value: boolean) => {
      fail = value;
    },
    raw: () => saved,
  };
}
test("legacy TestFlight photos upgrade on edit without losing images or creating a server request", async () => {
  const f = fixture();
  const old = await f.repo.snapshot();
  assert.deepEqual(old.draft.photoIds, [firstPhoto]);
  assert.deepEqual(old.draft.details, emptyItemDetails());
  assert.equal(
    (f.raw() as { version: number }).version,
    1,
    "read alone leaves the old file intact",
  );
  const next = await f.repo.selectStore(store, old.draft);
  const saved = await f.repo.saveDetails(details, next.draft);
  assert.equal((f.raw() as { version: number }).version, 2);
  assert.deepEqual(saved.draft.details, details);
  assert.deepEqual(saved.draft.store, store);
  await f.repo.add([{ uri: "file:///new.jpg", fileSize: 10 }]);
  await f.repo.remove(firstPhoto);
  const reloaded = await f.repo.snapshot();
  assert.deepEqual(reloaded.draft.details, details);
  assert.deepEqual(reloaded.draft.store, store);
  assert.equal(reloaded.photos.length, 1);
});
test("failed details commits preserve the saved item and do not mark a stale edit as successful", async () => {
  const f = fixture();
  let current = await f.repo.snapshot();
  current = await f.repo.selectStore(store, current.draft);
  f.fail(true);
  await assert.rejects(f.repo.saveDetails(details, current.draft), /full/);
  assert.deepEqual((await f.repo.snapshot()).draft, current.draft);
  f.fail(false);
  const saved = await f.repo.saveDetails(details, current.draft);
  await assert.rejects(
    f.repo.saveDetails({ ...details, brand: "stale" }, current.draft),
    /DRAFT_CHANGED/,
  );
  assert.deepEqual((await f.repo.snapshot()).draft, saved.draft);
  await f.repo.clear();
  await f.repo.add([{ uri: "file:///different.jpg" }]);
  await assert.rejects(
    f.repo.saveDetails(details, saved.draft),
    /DRAFT_CHANGED/,
  );
  assert.deepEqual((await f.repo.snapshot()).draft.details, emptyItemDetails());
});
test("changing currency requires explicit price clearing and never converts an amount", async () => {
  const f = fixture();
  let current = await f.repo.snapshot();
  current = await f.repo.selectStore(store, current.draft);
  current = await f.repo.saveDetails(details, current.draft);
  const euro = {
    ...store,
    id: "00000000-0000-4000-8000-000000000098",
    currency: "EUR" as const,
  };
  await assert.rejects(
    f.repo.selectStore(euro, current.draft),
    /PRICE_CURRENCY_CHANGED/,
  );
  assert.deepEqual((await f.repo.snapshot()).draft, current.draft);
  current = await f.repo.selectStore(euro, current.draft, true);
  assert.equal(current.draft.details.desiredPrice, "");
  assert.equal(current.draft.details.description, "Jacket");
});
test("price wishes use exact minor-unit strings and partial drafts remain editable", () => {
  for (const [input, ore] of [
    ["", null],
    ["  ", null],
    ["0.01", "1"],
    ["1000,50", "100050"],
    ["999999999.99", "99999999999"],
    ["0001.1", "110"],
  ])
    assert.equal(requestedPriceOre(input!), ore);
  for (const input of [
    "0",
    "-1",
    "1e3",
    "1.001",
    "1000000000",
    "1,000.00",
    "NaN",
  ])
    assert.throws(() => requestedPriceOre(input));
  assert.deepEqual(itemDetailsErrors(emptyItemDetails()), [
    "description",
    "condition",
  ]);
  assert.deepEqual(itemDetailsErrors({ ...details, desiredPrice: "oops" }), [
    "desiredPrice",
  ]);
  assert.deepEqual(
    parseItemDraftDetails({ ...emptyItemDetails(), desiredPrice: "unfinished" })
      .desiredPrice,
    "unfinished",
  );
  assert.throws(() =>
    parseItemDraftDetails({ ...details, description: "x".repeat(161) }),
  );
  assert.throws(() =>
    parsePhotoDraft({
      version: 2,
      draftId: firstPhoto,
      revision: 1,
      photoIds: [firstPhoto],
      store,
      details: { ...details, condition: "invented" },
    }),
  );
});
