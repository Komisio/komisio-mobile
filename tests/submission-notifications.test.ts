import assert from "node:assert/strict";
import test from "node:test";
import { compilePreview } from "./helpers/compile-preview.ts";
import { externalSubmissionCopy } from "../src/lib/external-submission-copy.ts";
import { photoDraftCopy } from "../src/lib/photo-draft-copy.ts";
import { photoFlowCopy } from "../src/lib/photo-flow-copy.ts";
import { itemDraftCopy } from "../src/lib/item-draft-copy.ts";
import { centralIntakeCopy } from "../src/lib/central-intake-copy.ts";
import type { PushSnapshot } from "../src/lib/push-controller.ts";

/** Exercise the real components, replacing only hooks and native/IO boundaries. */
function hooks() {
  let index = 0;
  const slots: any[] = [];
  const effects: (() => void)[] = [];
  const memo = (fn: () => any, deps: unknown[]) => {
    const i = index++;
    const old = slots[i];
    if (!old || deps.some((d, n) => !Object.is(d, old.deps[n]))) {
      slots[i] = { deps, value: fn() };
    }
    return slots[i].value;
  };
  const react = {
    useState(value: any) {
      const i = index++;
      slots[i] ??= { value };
      return [
        slots[i].value,
        (v: any) => {
          slots[i].value = typeof v === "function" ? v(slots[i].value) : v;
        },
      ];
    },
    useRef(value: any) {
      const i = index++;
      return slots[i] ?? (slots[i] = { current: value });
    },
    useCallback: (fn: any, deps: unknown[]) => memo(() => fn, deps),
    useEffect(run: () => any, deps: unknown[]) {
      const i = index++;
      const old = slots[i];
      if (!old || deps.some((d, n) => !Object.is(d, old.deps[n]))) {
        old?.cleanup?.();
        const slot = { deps, cleanup: undefined as any };
        slots[i] = slot;
        effects.push(() => {
          slot.cleanup = run();
        });
      }
    },
    useSyncExternalStore: (_: any, get: () => any) => get(),
  };
  return {
    react,
    render(fn: () => any) {
      index = 0;
      const tree = fn();
      effects.splice(0).forEach((e) => e());
      return tree;
    },
    stop: () => slots.forEach((slot) => slot?.cleanup?.()),
  };
}
function nodes(element: any): any[] {
  if (!element || typeof element !== "object") return [];
  if (Array.isArray(element)) return element.flatMap(nodes);
  return [element, ...nodes(element.props?.children)];
}
const ui = Object.fromEntries(
  ["Button", "Card", "Choice", "Loading", "Message", "Screen"].map((v) => [
    v,
    v,
  ]),
);
const tick = () => new Promise((resolve) => setImmediate(resolve));
function button(tree: any, label: string) {
  if (label === externalSubmissionCopy("sv").send) {
    const setup = nodes(tree).find((n) => n.type === "IntakeSetup");
    if (setup) return { onPress: () => setup.props.onSubmit("agreement") };
  }
  const b = nodes(tree).find(
    (n) => n.type === "Button" && n.props.label === label,
  );
  assert(b, label);
  return b.props;
}

function review(status: PushSnapshot["status"] | null, pending = false) {
  const h = hooks(),
    calls: string[] = [];
  let user = "one";
  let release: (() => void) | undefined;
  let hold: Promise<void> | undefined;
  const attempt = {
    state: "pending",
    command: { description: "Jacket" },
    storeName: "Komisio",
  };
  const { PhotoReviewScreen } = compilePreview(
    "components/photo-review-screen.tsx",
    {
      react: h.react,
      "react-native": { Text: "Text" },
      "expo-router": {
        router: { push: () => {}, navigate: () => {}, replace: () => {} },
        useFocusEffect: (fn: () => void) => h.react.useEffect(fn, [fn]),
        usePreventRemove: () => () => {},
      },
      "./ui": { ...ui, uiStyles: {} },
      "./central-intake-setup": { CentralIntakeSetup: "IntakeSetup" },
      "./photo-flow-ui": { PhotoStep: "Step", PhotoStrip: "Photos" },
      "@/lib/i18n": {
        useI18n: () => ({ locale: "sv", d: { retry: "Retry" } }),
      },
      "@/lib/session": {
        useSession: () => ({
          session: { user: { id: user } },
          refreshAssurance: async () => {},
        }),
      },
      "@/lib/identity-gates": { hasVerifiedEmail: () => true },
      "@/lib/use-item-draft": {
        useItemDraft: () => ({
          snapshot: {
            draft: {
              store: { currency: "SEK" },
              details: {
                description: "Jacket",
                condition: "good",
                desiredSellerAmount: "",
              },
            },
            photos: [{ id: "photo" }],
          },
        }),
      },
      "@/lib/item-draft-details": { itemDetailsErrors: () => [] },
      "@/lib/photo-flow-copy": { photoFlowCopy },
      "@/lib/photo-draft-copy": { photoDraftCopy },
      "@/lib/item-draft-copy": { itemDraftCopy },
      "@/lib/central-intake-copy": { centralIntakeCopy },
      "@/lib/external-submission-copy": {
        externalSubmissionCopy,
        externalSubmissionError: () => "error",
      },
      "@/lib/push-runtime": {
        sellerPush: {
          checkBeforeSubmission: async () => {
            calls.push("check");
            return status;
          },
        },
      },
      "@/lib/external-submission-runtime": {
        externalSubmission: async () => {
          await hold;
          return {
            load: async () => (pending ? attempt : null),
            prepare: async () => {
              calls.push("prepare");
            },
            resume: async () => {
              calls.push("submit");
              return { state: "rejected", rejection: "test" };
            },
          };
        },
      },
    },
  );
  const render = () => h.render(PhotoReviewScreen);
  return {
    calls,
    render,
    stop: h.stop,
    async ready() {
      render();
      await tick();
      return render();
    },
    switchUser: () => {
      user = "two";
      render();
    },
    hold: () => {
      hold = new Promise<void>((r) => {
        release = r;
      });
    },
    release: () => release!(),
  };
}
test("submission never checks or requests notifications, including denied and failed permissions", async () => {
  for (const status of [
    "off",
    "denied",
    "error",
    "on",
    "unavailable",
    null,
  ] as const) {
    const f = review(status);
    const submit = button(await f.ready(), externalSubmissionCopy("sv").send);
    submit.onPress();
    submit.onPress();
    await tick();
    assert.deepEqual(f.calls, ["prepare", "submit"]);
    assert.notEqual(f.render().type, "Reminder");
    f.stop();
  }
});

test("existing unknown submissions resume without preparing again", async () => {
  const f = review("off", true);
  button(await f.ready(), externalSubmissionCopy("sv").resume).onPress();
  await tick();
  assert.deepEqual(f.calls, ["submit"]);
  f.stop();
});

test("leaving review or switching account before controller preparation prevents submission", async () => {
  for (const change of ["leave", "account"] as const) {
    const f = review("on");
    const tree = await f.ready();
    f.hold();
    button(tree, externalSubmissionCopy("sv").send).onPress();
    if (change === "leave") f.stop();
    else f.switchUser();
    f.release();
    await tick();
    assert.deepEqual(f.calls, []);
    f.stop();
  }
});
