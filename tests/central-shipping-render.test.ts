import test from "node:test";
import assert from "node:assert/strict";
import { compilePreview } from "./helpers/compile-preview.ts";
import * as shipping from "../src/lib/central-shipping.ts";
import { centralShippingCopy } from "../src/lib/central-shipping-copy.ts";
import { shippingAddressCopy } from "../src/lib/shipping-address-copy.ts";

async function verifySelection(limit: number) {
  const id = (n: number) =>
    `f7800000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  const items = Array.from({ length: 10 }, (_, n) => ({
    offerId: id(401 + n),
    handoverId: id(501 + n),
    description: `Dress ${n + 1}`,
    reference: `H-${n + 1}`,
    status: "open",
    selectionWeightG: limit / 5,
  }));
  const values: any[] = [];
  let cursor = 0;
  let submitted: any = null;
  const read = {
    getState: () => ({
      status: "ready",
      data: {
        offerId: id(401),
        available: true,
        measurementsOptional: true,
        bundlingAvailable: true,
        selectionWeightLimitG: limit,
        eligibleItems: items,
        parcel: null,
      },
    }),
    subscribe: () => () => {},
    refresh: async () => {},
    cancel: () => {},
  };
  const writer = {
    getState: () => ({ status: "ready" }),
    subscribe: () => () => {},
    load: async () => {},
    submit: async (command: any) => {
      submitted = command;
    },
  };
  const modules = {
    react: {
      useMemo: (f: () => unknown) => f(),
      useCallback: (f: unknown) => f,
      useSyncExternalStore: (_: unknown, get: () => unknown) => get(),
      useState: (initial: unknown) => {
        const slot = cursor++;
        if (!(slot in values)) values[slot] = initial;
        return [
          values[slot],
          (next: any) => {
            values[slot] =
              typeof next === "function" ? next(values[slot]) : next;
          },
        ];
      },
    },
    "react-native": { Text: "Text" },
    "expo-image": { Image: "Image" },
    "expo-router": { useFocusEffect: () => {} },
    "expo-crypto": { randomUUID: () => id(601) },
    "@/lib/i18n": {
      useI18n: () => ({ locale: "sv", d: { retry: "Försök igen" } }),
    },
    "@/lib/session": { useSession: () => ({ refreshAssurance: () => {} }) },
    "@/lib/scoped-read": { createScopedRead: () => read },
    "@/lib/central-shipping-runtime": {
      readShipping: () => {},
      shippingWriter: () => writer,
    },
    "@/lib/central-shipping": shipping,
    "@/lib/central-shipping-copy": { centralShippingCopy },
    "@/lib/shipping-address-copy": { shippingAddressCopy },
    "./central-shipping-address": {
      CentralShippingAddress: ({ children }: any) =>
        children({
          firstName: "Alex",
          lastName: "Example",
          phone: "+46701234567",
          street: "Testgatan 1",
          postalCode: "12345",
          city: "Teststad",
        }),
    },
    "./ui": {
      Button: "Button",
      Card: "Card",
      Choice: "Choice",
      Loading: "Loading",
      Message: "Message",
      uiStyles: {},
    },
    "./external-page-button": { ExternalPageButton: "ExternalPageButton" },
  };
  const { CentralShipping } = compilePreview(
    "components/central-shipping.tsx",
    modules,
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
      CentralShipping({ user: id(2), offer: id(401), itemCount: 1 }),
    );
  }
  function choices() {
    return render().filter((v: any) => v.type === "Choice");
  }
  for (let n = 1; n < 5; n++) {
    assert.equal(choices()[n].props.disabled, false);
    choices()[n].props.onPress();
  }
  assert.equal(choices().filter((v: any) => v.props.selected).length, 5);
  for (const choice of choices().slice(5))
    assert.equal(choice.props.disabled, true);
  const t = centralShippingCopy("sv");
  assert.ok(render().includes(t.packageLimit));
  assert.ok(
    !render()
      .filter((v: any) => typeof v === "string")
      .some((v: string) => /2000|400 g|2 kg/.test(v)),
  );
  const button = render().find(
    (v: any) => v.type === "Button" && v.props.label === t.bookTogether,
  );
  assert.equal(button.props.disabled, false);
  button.props.onPress();
  await Promise.resolve();
  assert.deepEqual(
    Array.from(submitted.offerIds),
    items.slice(0, 5).map((i) => i.offerId),
  );
  assert.equal(submitted.weightG, undefined);
  choices()[4].props.onPress();
  assert.equal(choices()[5].props.disabled, false);
}

for (const limit of [2000, 2500])
  test(`package selection at ${limit} g disables a sixth item and submits only the five selected items`, () =>
    verifySelection(limit));
