import test from "node:test";
import assert from "node:assert/strict";
import { compilePreview } from "./helpers/compile-preview.ts";
import { createScopedRead } from "../src/lib/scoped-read.ts";
import * as presentation from "../src/lib/external-item-presentation.ts";
import * as offerModule from "../src/lib/external-offer.ts";
import * as localeModule from "../src/lib/locale.ts";
import { externalItemDetailCopy } from "../src/lib/external-item-detail-copy.ts";
import { externalOfferCopy } from "../src/lib/external-offer-copy.ts";
import { itemDraftCopy } from "../src/lib/item-draft-copy.ts";
import { hasCentralIdentity } from "../src/lib/identity-gates.ts";
import { isId } from "../src/lib/catalogue.ts";
import type { ExternalRequest } from "../src/lib/external-submission.ts";
import type { ExternalOffer } from "../src/lib/external-offer.ts";

const id = (n: number) =>
  `f7800000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const item: ExternalRequest = {
  id: id(1),
  tenant_id: id(2),
  store_name: "Komisio",
  description: "Klänning i siden",
  brand: "Testmärke",
  condition: "very_good",
  notes: "Liten fläck på ärmen",
  desired_price_ore: "60000",
  price_basis: "seller_amount",
  currency: "SEK",
  photos: [id(3), id(4)],
  created_at: "2026-11-13T12:00:00Z",
  status: "waiting",
  decline_note: null,
  lifecycleStatus: "waiting",
  canWithdraw: true,
};
const offer: ExternalOffer = {
  id: id(5),
  requestId: item.id,
  tenantId: item.tenant_id,
  sellerAmountOre: "60000",
  expectedSalePriceOre: "120000",
  currency: "SEK",
  agreementVersionId: id(6),
  createdAt: item.created_at,
  expiresAt: "2026-11-15T12:00:00Z",
  serverNow: item.created_at,
  status: "accepted",
  canAccept: false,
  canDecline: false,
  response: null,
};
function flatten(v: any): any[] {
  if (v == null || typeof v === "boolean") return [];
  if (Array.isArray(v)) return v.flatMap(flatten);
  if (typeof v !== "object") return [v];
  if (typeof v.type === "function") return flatten(v.type(v.props));
  return [v, ...flatten(v.props?.children)];
}
const ui = Object.fromEntries(
  [
    "ItemCard",
    "Text",
    "StatusBadge",
    "Button",
    "IconButton",
    "Card",
    "Loading",
    "Message",
    "Screen",
  ].map((k) => [k, k]),
);
const i18n = { useI18n: () => ({ locale: "sv", d: { retry: "Försök igen" } }) };

test("whole rows open item details for waiting, accepted and historical items without nested photo or action buttons", () => {
  const pushed: any[] = [];
  const { ExternalItemRow } = compilePreview(
    "components/external-item-row.tsx",
    {
      "expo-router": { router: { push: (route: any) => pushed.push(route) } },
      "react-native": { Text: "Text" },
      "@/lib/i18n": i18n,
      "@/lib/external-item-presentation": presentation,
      "./external-item-photo": { ExternalItemPhoto: "Photo" },
      "./ui": { ...ui, uiStyles: {} },
    },
  );
  for (const status of [
    "waiting",
    "accepted",
    "open",
    "sold",
    "rejected",
    "expired",
    "withdrawn",
  ]) {
    const nodes = flatten(
      ExternalItemRow({
        item: { ...item, lifecycleStatus: status },
        owner: id(7),
      }),
    );
    const cards = nodes.filter((n) => n.type === "ItemCard");
    assert.equal(cards.length, 1);
    cards[0].props.onPress();
    assert.equal(pushed.at(-1).pathname, "/external-item/[request]");
    assert.equal(pushed.at(-1).params.request, item.id);
    assert.ok(!nodes.some((n) => n.type === "Button" || n === "Visa bilder"));
    assert.ok(
      nodes.some((n) => typeof n === "string" && n.startsWith("Registrerad")),
    );
  }
});

test("amounts distinguish fixed requests, agreed sums and historical resale wishes", () => {
  assert.deepEqual(presentation.externalItemAmounts(item), [
    { label: "requestedAmount", ore: "60000", currency: "SEK" },
  ]);
  assert.deepEqual(presentation.externalItemAmounts(item, offer), [
    { label: "agreedAmount", ore: "60000", currency: "SEK" },
  ]);
  assert.deepEqual(
    presentation
      .externalItemAmounts(
        { ...item, price_basis: "resale", desired_price_ore: "120000" },
        offer,
      )
      .map((x) => x.label),
    ["agreedAmount", "requestedResale"],
  );
  assert.deepEqual(
    presentation
      .externalItemAmounts(item, {
        ...offer,
        status: "offered",
        sellerAmountOre: "50000",
      })
      .map((x) => x.label),
    ["offeredAmount", "requestedAmount"],
  );
  assert.deepEqual(
    presentation.externalItemAmounts({ ...item, desired_price_ore: null }),
    [],
  );
  assert.equal(offerModule.offerAmount("60050", "sv-SE"), "600,50 kr");
  assert.equal(offerModule.offerAmount("60050", "sv-SE", "EUR"), "600,50 EUR");
});

function detailHarness(
  currentItem: ExternalRequest | null,
  currentOffer?: ExternalOffer,
  error?: string,
) {
  let read: ReturnType<typeof createScopedRead<any>> | undefined;
  let session: any = {
    user: {
      id: id(7),
      email: "synthetic@example.test",
      email_confirmed_at: item.created_at,
    },
  };
  let assuranceRefreshes = 0;
  let sheetOpen = false;
  const pushed: any[] = [];
  const { ExternalItemDetailsScreen } = compilePreview(
    "components/external-item-details-screen.tsx",
    {
      react: {
        useState: () => [
          sheetOpen,
          (open: boolean) => {
            sheetOpen = open;
          },
        ],
        useMemo: (f: () => any) => read ?? f(),
        useCallback: (f: any) => f,
        useSyncExternalStore: (_: any, get: any) => get(),
      },
      "react-native": { Text: "Text", View: "View" },
      "expo-router": {
        router: { push: (route: any) => pushed.push(route) },
        useLocalSearchParams: () => ({ request: item.id }),
        useFocusEffect: () => {},
      },
      "@/lib/session": {
        useSession: () => ({
          session,
          refreshAssurance: () => {
            assuranceRefreshes++;
          },
        }),
      },
      "@/lib/i18n": i18n,
      "@/lib/identity-gates": { hasCentralIdentity },
      "@/lib/catalogue": { isId },
      "@/lib/scoped-read": {
        createScopedRead: (f: any) => (read = createScopedRead(f)),
      },
      "@/lib/external-submission-runtime": {
        externalRequestApi: (owner: string) => {
          assert.equal(owner, id(7));
          return {
            lookup: async (request: string) => {
              assert.equal(request, item.id);
              return currentItem;
            },
          };
        },
      },
      "@/lib/external-offer-runtime": {
        externalOfferApi: (owner: string) => {
          assert.equal(owner, id(7));
          return {
            list: async () => {
              if (error) throw new Error(error);
              return currentOffer ? [currentOffer] : [];
            },
          };
        },
      },
      "@/lib/external-item-detail-copy": { externalItemDetailCopy },
      "@/lib/external-offer-copy": { externalOfferCopy },
      "@/lib/item-draft-copy": { itemDraftCopy },
      "@/lib/external-item-presentation": presentation,
      "@/lib/external-offer": offerModule,
      "@/lib/locale": localeModule,
      "./external-photo-pager": { ExternalPhotoPager: "PhotoPager" },
      "./detail-sheet": {
        DetailSheet: (props: any) =>
          props.open ? { type: "Sheet", props } : null,
      },
      "./brand": { InfoIcon: "InfoIcon" },
      "./withdraw-external-request": { WithdrawExternalRequest: "Withdraw" },
      "./ui": { ...ui, uiStyles: {} },
    },
  );
  return {
    render: () => flatten(ExternalItemDetailsScreen()),
    refresh: () => read!.refresh(),
    pushed,
    signOut: () => {
      session = null;
    },
    assuranceRefreshes: () => assuranceRefreshes,
  };
}
test("details show description, notes, own photos and seller amount; opening never submits an action", async () => {
  const h = detailHarness(item);
  assert.ok(h.render().some((n) => n.type === "Loading"));
  await h.refresh();
  const nodes = h.render();
  for (const text of [
    item.description,
    item.notes,
    "Ditt önskade belopp",
    "600 kr",
    "Mycket gott skick",
  ]) {
    // The condition wording comes from the established draft translations.
    if (text === "Mycket gott skick")
      assert.ok(nodes.includes(itemDraftCopy("sv").conditions.very_good));
    else assert.ok(nodes.includes(text), text);
  }
  assert.equal(nodes.find((n) => n.type === "PhotoPager").props.owner, id(7));
  assert.equal(nodes.find((n) => n.type === "Withdraw").props.request, item.id);
  assert.deepEqual(h.pushed, []);
  h.signOut();
  assert.ok(!h.render().some((n) => n.type === "PhotoPager"));
});
test("offer and shipping actions remain reachable without exposing withdrawal for ineligible items", async () => {
  for (const status of ["offered", "accepted"] as const) {
    const h = detailHarness(
      { ...item, canWithdraw: false },
      { ...offer, status },
    );
    h.render();
    await h.refresh();
    const nodes = h.render();
    assert.ok(!nodes.some((n) => n.type === "Withdraw"));
    nodes.find((n) => n.type === "Button").props.onPress();
    assert.equal(
      h.pushed[0].pathname,
      status === "accepted"
        ? "/external-onboarding/[offer]"
        : "/external-offer/[offer]",
    );
    assert.equal(h.pushed[0].params.offer, offer.id);
  }
});
test("an approved item's info button opens and dismisses its own payout sheet", async () => {
  const h = detailHarness({ ...item, lifecycleStatus: "open" }, offer);
  h.render();
  await h.refresh();
  const t = externalItemDetailCopy("sv");
  const closed = h.render();
  assert.ok(closed.includes(t.approvalGreeting));
  assert.ok(!closed.some((n) => n.type === "Sheet"));
  const info = closed.find((n) => n.type === "IconButton");
  assert.equal(info.props.label, t.payoutTitle);
  info.props.onPress();
  const sheet = h.render().find((n) => n.type === "Sheet");
  const content = flatten(sheet.props.children);
  assert.ok(content.includes(item.description));
  assert.ok(content.includes(t.payoutRule.replace("{amount}", "600 kr")));
  assert.ok(content.includes(t.fromBalance));
  sheet.props.onClose();
  assert.ok(!h.render().some((n) => n.type === "Sheet"));
  assert.deepEqual(h.pushed, []);
  for (const current of [undefined, { ...offer, status: "offered" as const }]) {
    const pending = detailHarness(item, current);
    pending.render();
    await pending.refresh();
    assert.ok(
      !pending
        .render()
        .some((n) => n.type === "IconButton" || n === t.approvalGreeting),
    );
  }
});

test("payout dates follow this guarantee and credit evidence in Swedish time", () => {
  const receivedAt = "2026-11-13T23:30:00Z";
  const dueAt = "2026-12-28T23:30:00Z";
  const received: ExternalOffer = {
    ...offer,
    serverNow: receivedAt,
    handover: {
      id: id(8),
      reference: "H-2",
      itemCount: 2,
      status: "received",
      receivedAt,
    },
    guarantee: {
      id: id(9),
      currency: "SEK",
      amountOre: "60000",
      receivedAt,
      dueAt,
      creditedAt: null,
    },
  };
  const t = externalItemDetailCopy("sv");
  const payout = (
    status: ExternalRequest["lifecycleStatus"],
    record: ExternalOffer,
  ) =>
    presentation.agreedItemPayout(
      { ...item, lifecycleStatus: status },
      record,
      "sv",
    )!;
  const pending = payout("registered", received);
  assert.match(pending.message, /600 kr.*29 december 2026/);
  assert.equal(pending.congratulate, false);
  assert.equal(
    payout("received", { ...received, serverNow: dueAt }).message,
    t.overdue.replace("{date}", "29 december 2026"),
  );
  for (const historical of ["cancelled", "ended", "sold", "acquired"] as const)
    assert.deepEqual(payout(historical, offer), {
      message: t.noCreditInfo,
      congratulate: false,
    });
  assert.equal(
    payout("sold", {
      ...received,
      guarantee: { ...received.guarantee!, creditedAt: "2026-11-14T23:45:00Z" },
    }).message,
    "600 kr lades till på ditt saldo den 15 november 2026.",
  );
  const legacy = payout("received", { ...received, guarantee: null });
  assert.equal(legacy.message, t.payoutRule.replace("{amount}", "600 kr"));
  assert.equal(legacy.congratulate, false);
  for (const locale of localeModule.locales) {
    for (const model of [offer, received, { ...received, serverNow: dueAt }]) {
      const info = presentation.agreedItemPayout(item, model, locale)!;
      assert.ok(info.message && !info.message.includes("{"));
    }
  }
});

test("an unavailable offer leaves item details readable, while missing items and auth failures fail closed", async () => {
  const partial = detailHarness(item, undefined, "NETWORK_ERROR");
  partial.render();
  await partial.refresh();
  assert.ok(partial.render().includes(item.description));
  assert.ok(partial.render().includes(externalOfferCopy("sv").listError));
  for (const h of [
    detailHarness(null),
    detailHarness(item, undefined, "AUTH_REQUIRED"),
  ]) {
    h.render();
    await h.refresh();
    assert.ok(h.render().includes(externalItemDetailCopy("sv").loadError));
    assert.ok(!h.render().some((n) => n.type === "PhotoPager"));
  }
  const auth = detailHarness(item, undefined, "MFA_REQUIRED");
  auth.render();
  await auth.refresh();
  assert.equal(auth.assuranceRefreshes(), 1);
});
