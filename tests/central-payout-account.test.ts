import test from "node:test";
import assert from "node:assert/strict";
import { compilePreview } from "./helpers/compile-preview.ts";
import { createScopedRead } from "../src/lib/scoped-read.ts";
import {
  hasCentralIdentity,
  hasVerifiedEmail,
} from "../src/lib/identity-gates.ts";
import { centralPayoutCopy } from "../src/lib/central-payout-copy.ts";
const first = "10000000-0000-4000-8000-000000000001";
const tenant = "10000000-0000-4000-8000-000000000002";
const seller = "10000000-0000-4000-8000-000000000003";

test("Money opens Komisio without a store and the selected store's seller otherwise", () => {
  let store: { id: string } | null = null;
  const { default: MoneyTab } = compilePreview("app/(tabs)/money.tsx", {
    "@/lib/session": {
      useSession: () => ({
        store,
        session: { user: { id: first } },
        account: { tenantId: "shop", sellerId: "shop-seller" },
      }),
    },
    "@/lib/i18n": { useI18n: () => ({ d: { payouts: { title: "Pengar" } } }) },
    "@/components/seller-gate": { SellerGate: "Gate" },
    "@/components/seller-payouts": { SellerPayouts: "ShopPayouts" },
    "@/components/central-money": { CentralMoney: "CentralMoney" },
  });
  assert.equal(MoneyTab().type, "CentralMoney");
  store = { id: "shop" };
  const route = MoneyTab();
  assert.equal(route.type, "Gate");
  assert.equal(route.props.children.type, "ShopPayouts");
  assert.equal(route.props.children.props.seller, "shop-seller");
});

async function render(
  expectedTenant: string | undefined,
  account: object | null,
  primary: boolean,
  bank = false,
) {
  let read: ReturnType<typeof createScopedRead<any>> | undefined;
  const session = {
    user: {
      id: first,
      email: primary ? "seller@example.test" : "",
      email_confirmed_at: primary ? "2026-11-19" : null,
      identities: [
        {
          provider: "apple",
          user_id: first,
          identity_data: { email_verified: true, email: "relay@example.test" },
        },
      ],
    },
  };
  const { CentralPayoutAccount } = compilePreview(
    "components/central-payout-account.tsx",
    {
      react: {
        useMemo: (fn: () => unknown) => read ?? fn(),
        useCallback: (fn: unknown) => fn,
        useSyncExternalStore: (_: unknown, get: () => unknown) => get(),
      },
      "expo-router": { useFocusEffect: () => {} },
      "@/lib/session": {
        useSession: () => ({
          session,
          mfaRequired: false,
          store: { id: "other-store" },
          account: { tenantId: "other-store", sellerId: "other-seller" },
        }),
      },
      "@/lib/i18n": {
        useI18n: () => ({
          locale: "sv",
          d: { tabs: { money: "Pengar" }, payouts: { denied: "denied" } },
        }),
      },
      "@/lib/identity-gates": { hasCentralIdentity, hasVerifiedEmail },
      "@/lib/central-payout-copy": { centralPayoutCopy },
      "@/lib/central-shipping-address-runtime": {
        readShippingAccount: async (id: string) => {
          assert.equal(id, first);
          return { account };
        },
      },
      "@/lib/scoped-read": {
        createScopedRead: (fn: any) => (read = createScopedRead(fn)),
      },
      "./central-payout-email": { CentralPayoutEmail: "PrimaryEmail" },
      "./ui": {
        Screen: "Screen",
        Loading: "Loading",
        Message: "Message",
        Button: "Button",
      },
    },
  );
  const root = CentralPayoutAccount({
    tenant: expectedTenant,
    bank,
    children: (scope: any) => scope,
  });
  root.type(root.props);
  await read!.refresh();
  return root.type(root.props);
}
test("an item payout uses its explicitly owned Komisio seller even while a different store is selected", async () => {
  const result = await render(
    tenant,
    { tenantId: tenant, sellerId: seller },
    true,
  );
  assert.deepEqual({ ...result }, { user: first, tenant, seller });
});
test("a stale recipient or missing central seller never falls back to a shop seller", async () => {
  const other = await render(
    "old-tenant",
    { tenantId: tenant, sellerId: seller },
    true,
  );
  assert.equal(other.props.children.props.children, "denied");
  const absent = await render(undefined, null, true);
  assert.equal(
    absent.props.children.props.children,
    centralPayoutCopy.sv.empty,
  );
});
test("a provider-only seller goes directly to Money and only confirms email for bank administration", async () => {
  const money = await render(
    tenant,
    { tenantId: tenant, sellerId: seller },
    false,
  );
  assert.deepEqual({ ...money }, { user: first, tenant, seller });
  const gate = await render(
    tenant,
    { tenantId: tenant, sellerId: seller },
    false,
    true,
  );
  assert.equal(gate.type, "PrimaryEmail");
  assert.equal(gate.props.owner, first);
});
