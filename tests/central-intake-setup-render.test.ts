import test from "node:test";
import assert from "node:assert/strict";
import { compilePreview } from "./helpers/compile-preview.ts";
import { centralIntakeCopy } from "../src/lib/central-intake-copy.ts";
import { fixedIntakeCopy } from "../src/lib/fixed-intake-copy.ts";
import { shippingAddressCopy } from "../src/lib/shipping-address-copy.ts";
import { centralShippingCopy } from "../src/lib/central-shipping-copy.ts";
import { externalSubmissionCopy } from "../src/lib/external-submission-copy.ts";
import { parseSaveIntakeProfile } from "../src/lib/central-intake-profile.ts";
const id = (n: number) =>
  `f8580000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const agreement = {
  id: id(3),
  version: 1,
  title: "Terms",
  body: "Synthetic terms",
  language: "sv",
};
function fixture(
  existing: boolean,
  accepted = existing,
  hasPreference = existing,
) {
  const values: any[] = [];
  let cursor = 0,
    submitted = 0,
    saved: any = null,
    refreshed = 0;
  let state: any = { status: "ready", command: null };
  const writer = {
    getState: () => state,
    subscribe: () => () => {},
    load: async () => {},
    submit: async (c: any) => {
      saved = c;
      state = { status: "success", command: c };
    },
    retry: async () => {
      state = { ...state, status: "success" };
    },
  };
  const data = {
    tenantId: id(2),
    payoutPreference: hasPreference
      ? { id: id(7), method: "swish", phone: "+46700000000" }
      : null,
    agreement,
    agreementAccepted: accepted,
    account: existing
      ? {
          tenantId: id(2),
          sellerId: id(4),
          revision: 1,
          contact: {
            firstName: "Alex",
            lastName: "Example",
            phone: "+46700000000",
          },
          address: { street: "Test 1", postalCode: "12345", city: "Teststad" },
        }
      : null,
  };
  const read = {
    getState: () => ({ status: "ready", data }),
    subscribe: () => () => {},
    refresh: async () => {
      refreshed++;
    },
    cancel: () => {},
  };
  const react = {
    useMemo: (fn: () => any) => fn(),
    useCallback: (fn: any) => fn,
    useSyncExternalStore: (_: any, get: () => any) => get(),
    useRef: (v: any) => {
      const i = cursor++;
      return values[i] ?? (values[i] = { current: v });
    },
    useState: (v: any) => {
      const i = cursor++;
      if (!(i in values)) values[i] = v;
      return [
        values[i],
        (next: any) =>
          (values[i] = typeof next === "function" ? next(values[i]) : next),
      ];
    },
  };
  const { CentralIntakeSetup } = compilePreview(
    "components/central-intake-setup.tsx",
    {
      react,
      "react-native": { Text: "Text" },
      "expo-router": { useFocusEffect: (fn: () => any) => fn() },
      "expo-crypto": { randomUUID: () => id(5) },
      "@/lib/i18n": {
        useI18n: () => ({ locale: "sv", d: { retry: "Retry" } }),
      },
      "@/lib/session": {
        useSession: () => ({ refreshAssurance: async () => {} }),
      },
      "@/lib/scoped-read": { createScopedRead: () => read },
      "@/lib/central-intake-profile-runtime": {
        readIntakeProfile: () => {},
        intakeProfileWriter: () => writer,
      },
      "@/lib/central-intake-profile": { parseSaveIntakeProfile },
      "./central-payout-preference": { CentralPayoutPreference: "Preference" },
      "@/lib/central-intake-copy": { centralIntakeCopy },
      "@/lib/fixed-intake-copy": { fixedIntakeCopy },
      "@/lib/shipping-address-copy": { shippingAddressCopy },
      "@/lib/central-shipping-copy": { centralShippingCopy },
      "@/lib/external-submission-copy": { externalSubmissionCopy },
      "@/lib/phone-entry": { phoneEntryValue: ({ number }: any) => number },
      "./offer-agreement-link": { OfferAgreementLink: "Agreement" },
      "./ui": {
        ...Object.fromEntries(
          ["Button", "Card", "Choice", "Field", "Loading", "Message"].map(
            (k) => [k, k],
          ),
        ),
        uiStyles: {},
      },
    },
  );
  function flatten(v: any): any[] {
    if (!v || typeof v !== "object") return [];
    if (Array.isArray(v)) return v.flatMap(flatten);
    if (typeof v.type === "function") return flatten(v.type(v.props));
    return [v, ...flatten(v.props?.children)];
  }
  function render() {
    cursor = 0;
    return flatten(
      CentralIntakeSetup({
        user: id(1),
        tenant: id(2),
        disabled: false,
        onSubmit: async () => {
          submitted++;
        },
      }),
    );
  }
  return {
    render,
    writer,
    get: () => ({ submitted, saved, refreshed }),
    pending: () => {
      state = { status: "pending", command: { agreementVersionId: id(9) } };
    },
  };
}
test("returning seller sees saved details and one send button without another agreement checkbox", async () => {
  const f = fixture(true);
  const nodes = f.render();
  assert.equal(
    nodes.filter((n) => n.type === "Field" || n.type === "Choice").length,
    0,
  );
  assert.equal(nodes.filter((n) => n.type === "Agreement").length, 1);
  nodes
    .find(
      (n) =>
        n.type === "Button" &&
        n.props.label === externalSubmissionCopy("sv").send,
    )
    .props.onPress();
  await new Promise(setImmediate);
  assert.equal(f.get().submitted, 1);
  assert.equal(f.get().saved, null);
});
test("first submission collects six sender fields and explicit consent, never a bank account", async () => {
  const f = fixture(false);
  let nodes = f.render();
  const a = shippingAddressCopy("sv"),
    s = centralShippingCopy("sv");
  assert.equal(nodes.filter((n) => n.type === "Field").length, 6);
  for (const [label, value] of [
    [a.firstName, "Alex"],
    [a.lastName, "Example"],
    [a.phone, "+46700000000"],
    [s.street, "Test 1"],
    [s.postalCode, "123 45"],
    [s.city, "Teststad"],
  ])
    nodes
      .find((n) => n.type === "Field" && n.props.label === label)
      .props.onChangeText(value);
  assert.equal(
    nodes.find(
      (n) =>
        n.type === "Button" &&
        n.props.label === centralIntakeCopy("sv").continue,
    ).props.disabled,
    true,
  );
  nodes.find((n) => n.type === "Choice").props.onPress();
  nodes = f.render();
  const button = nodes.find(
    (n) =>
      n.type === "Button" && n.props.label === centralIntakeCopy("sv").continue,
  );
  button.props.onPress();
  button.props.onPress();
  await new Promise(setImmediate);
  assert.equal(f.get().submitted, 0);
  assert.equal(f.get().saved.agreementVersionId, id(3));
  assert.equal(f.get().saved.address.postalCode, "12345");
  assert.equal(f.get().saved.expectedRevision, -1);
  assert.equal(f.get().saved.acceptAgreement, true);
});
test("an existing sender without a payout preference can send only after confirming a destination", async () => {
  const f = fixture(true, true, false);
  const nodes = f.render();
  const panel = nodes.find((n) => n.type === "Preference");
  assert.ok(panel);
  assert.equal(f.get().submitted, 0);
  await panel.props.onSaved(false);
  assert.equal(f.get().submitted, 0);
  await panel.props.onSaved(true);
  assert.equal(f.get().submitted, 1);
});
test("new terms show consent again while preserving the saved sender summary", () => {
  const nodes = fixture(true, false).render();
  assert.equal(nodes.filter((n) => n.type === "Choice").length, 1);
  assert.equal(nodes.filter((n) => n.type === "Field").length, 0);
});
test("retrying an old profile command does not submit a new request under different terms", async () => {
  const f = fixture(true);
  f.pending();
  const nodes = f.render();
  nodes
    .find((n) => n.type === "Button" && n.props.label === "Retry")
    .props.onPress();
  await new Promise(setImmediate);
  assert.equal(f.get().submitted, 0);
  assert.ok(f.get().refreshed > 0);
});
