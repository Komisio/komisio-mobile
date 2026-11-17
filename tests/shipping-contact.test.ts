import test from "node:test";
import assert from "node:assert/strict";
import { parseShippingContact } from "../src/lib/central-shipping.ts";
import { phoneEntryValue } from "../src/lib/phone-entry.ts";
import { accountReturnPath } from "../src/lib/account-return-path.ts";
import { hasVerifiedEmail } from "../src/lib/identity-gates.ts";
import { compilePreview } from "./helpers/compile-preview.ts";
import * as address from "../src/lib/central-shipping-address.ts";
import { shippingAddressCopy } from "../src/lib/shipping-address-copy.ts";
import { centralShippingCopy } from "../src/lib/central-shipping-copy.ts";

const contact = {
  firstName: "Anna Maria",
  lastName: "Öberg",
  phone: "+46701234567",
};
test("sender validation keeps both names and normalizes a local phone without verifying ownership", () => {
  assert.deepEqual(
    parseShippingContact({
      ...contact,
      phone: phoneEntryValue({ callingCode: "+46", number: "070 123 45 67" }),
    }),
    contact,
  );
  for (const extra of [
    { firstName: "" },
    { lastName: " " },
    { phone: "0701234567" },
    { firstName: "a".repeat(40), lastName: "b".repeat(40) },
    { verified: true },
  ])
    assert.throws(() => parseShippingContact({ ...contact, ...extra }));
});

test("sign-in resumes only a known photo step; a contact phone never authorizes intake", () => {
  assert.equal(accountReturnPath("photo-details"), "/photo-details");
  assert.equal(accountReturnPath("photo-review"), "/photo-review");
  assert.equal(accountReturnPath("external-items"), "/external-items");
  for (const path of [
    "https://evil.test",
    "//evil.test",
    "/bank-account",
    ["photo-details"],
    null,
  ])
    assert.equal(accountReturnPath(path), "/home");
  const user = {
    email: "seller@example.test",
    email_confirmed_at: "2026-11-17",
  };
  assert.equal(hasVerifiedEmail(user as never), true);
  assert.equal(
    hasVerifiedEmail({ ...user, is_anonymous: true } as never),
    false,
  );
  assert.equal(
    hasVerifiedEmail({
      ...user,
      email_confirmed_at: null,
      phone_confirmed_at: "2026-11-17",
    } as never),
    false,
  );
});

test("sender editor blocks incomplete names, saves contact once and shows the same details before booking", async () => {
  const id = (n: number) =>
    `f7800000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  let account: address.ShippingAccount = {
    tenantId: id(1),
    sellerId: id(2),
    revision: 0,
    address: null,
    contact: null,
  };
  const values: any[] = [];
  let cursor = 0;
  const saved: any[] = [];
  let selected: any = null;
  const writer = {
    getState: () => ({ status: "ready" }),
    subscribe: () => () => {},
    load: async () => {},
    submit: async (c: any) => {
      saved.push(c);
    },
  };
  const read = {
    getState: () => ({ status: "ready", data: { account } }),
    subscribe: () => () => {},
    refresh: async () => {},
    cancel: () => {},
  };
  const { CentralShippingAddress } = compilePreview(
    "components/central-shipping-address.tsx",
    {
      react: {
        useMemo: (f: any) => f(),
        useCallback: (f: any) => f,
        useSyncExternalStore: (_: any, get: any) => get(),
        useState: (initial: any) => {
          const slot = cursor++;
          if (!(slot in values)) values[slot] = initial;
          return [
            values[slot],
            (next: any) => {
              values[slot] = next;
            },
          ];
        },
      },
      "react-native": { Text: "Text" },
      "expo-router": { useFocusEffect: () => {} },
      "expo-crypto": { randomUUID: () => id(3) },
      "@/lib/i18n": {
        useI18n: () => ({ locale: "sv", d: { retry: "Försök igen" } }),
      },
      "@/lib/session": { useSession: () => ({ refreshAssurance() {} }) },
      "@/lib/scoped-read": { createScopedRead: () => read },
      "@/lib/central-shipping-address-runtime": {
        readShippingAccount() {},
        shippingAddressWriter: () => writer,
      },
      "@/lib/central-shipping-address": address,
      "@/lib/phone-entry": { phoneEntryValue },
      "@/lib/central-shipping-copy": { centralShippingCopy },
      "@/lib/shipping-address-copy": { shippingAddressCopy },
      "./ui": {
        Text: "Text",
        Card: "Card",
        Field: "Field",
        Button: "Button",
        Loading: "Loading",
        Message: "Message",
        uiStyles: {},
      },
    },
  );
  function flatten(v: any): any[] {
    if (v == null || typeof v === "boolean") return [];
    if (Array.isArray(v)) return v.flatMap(flatten);
    if (typeof v === "string") return [v];
    if (typeof v.type === "function") return flatten(v.type(v.props));
    return [v, ...flatten(v.props?.children)];
  }
  function render() {
    cursor = 0;
    return flatten(
      CentralShippingAddress({
        user: id(4),
        children: (sender: any) => {
          selected = sender;
          return "Book";
        },
      }),
    );
  }
  const t = shippingAddressCopy("sv"),
    s = centralShippingCopy("sv");
  const field = (label: string, value: string) =>
    render()
      .find((v) => v.type === "Field" && v.props.label === label)
      .props.onChangeText(value);
  const save = () =>
    render()
      .find((v) => v.type === "Button" && v.props.label === t.save)
      .props.onPress();
  field(t.firstName, "Anna Maria");
  field(t.phone, "070 123 45 67");
  field(s.street, "Testgatan 1");
  field(s.postalCode, "123 45");
  field(s.city, "Teststad");
  save();
  assert.equal(saved.length, 0);
  assert.equal(selected, null);
  assert.ok(render().includes(t.invalid));
  field(t.lastName, "Öberg");
  save();
  await Promise.resolve();
  assert.equal(saved.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(saved[0].contact)), contact);
  assert.equal(saved[0].address.postalCode, "12345");
  account = {
    ...account,
    revision: 1,
    contact: saved[0].contact,
    address: saved[0].address,
  };
  values.length = 0;
  const summary = render();
  for (const value of [...Object.values(contact), "Testgatan 1"])
    assert.ok(summary.includes(value));
  assert.deepEqual(JSON.parse(JSON.stringify(selected)), {
    ...account.address,
    ...contact,
  });
  assert.equal(summary.filter((v) => v.type === "Field").length, 0);
});
