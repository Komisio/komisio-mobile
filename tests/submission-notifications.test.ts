import assert from "node:assert/strict";
import test from "node:test";
import { compilePreview } from "./helpers/compile-preview.ts";
import { pushCopy } from "../src/lib/push-copy.ts";
import { submissionNotificationsCopy } from "../src/lib/submission-notifications-copy.ts";
import { externalSubmissionCopy } from "../src/lib/external-submission-copy.ts";
import { photoDraftCopy } from "../src/lib/photo-draft-copy.ts";
import { photoFlowCopy } from "../src/lib/photo-flow-copy.ts";
import { itemDraftCopy } from "../src/lib/item-draft-copy.ts";
import { centralIntakeCopy } from "../src/lib/central-intake-copy.ts";
import { locales } from "../src/lib/locale.ts";
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
  const b = nodes(tree).find(
    (n) => n.type === "Button" && n.props.label === label,
  );
  assert(b, label);
  return b.props;
}

function reminder(status: PushSnapshot["status"] = "off") {
  const h = hooks();
  const state: PushSnapshot = { status, busy: false, error: null };
  const calls: string[] = [];
  let appState: (state: string) => void = () => {};
  let outcome: PushSnapshot["status"] = "on";
  let settingsFail = false;
  const { SubmissionNotifications } = compilePreview(
    "components/submission-notifications.tsx",
    {
      react: h.react,
      "react-native": {
        AppState: {
          addEventListener: (_: string, fn: typeof appState) => {
            appState = fn;
            return {
              remove: () => {
                appState = () => {};
              },
            };
          },
        },
        Linking: {
          openSettings: async () => {
            calls.push("settings");
            if (settingsFail) throw Error("unavailable");
          },
        },
      },
      "@/lib/i18n": { useI18n: () => ({ locale: "sv" }) },
      "@/lib/push-runtime": {
        sellerPush: {
          subscribe: () => () => {},
          getSnapshot: () => state,
          enable: async (user: string) => {
            calls.push(`enable:${user}`);
            state.status = outcome;
          },
        },
      },
      "@/lib/push-copy": { pushCopy },
      "@/lib/submission-notifications-copy": { submissionNotificationsCopy },
      "@/lib/external-submission-copy": { externalSubmissionCopy },
      "./ui": ui,
    },
  );
  return {
    calls,
    state,
    render: () =>
      h.render(() =>
        SubmissionNotifications({
          user: "one",
          onContinue: () => calls.push("submit"),
          onCancel: () => calls.push("cancel"),
        }),
      ),
    app: (s: string) => appState(s),
    outcome: (s: PushSnapshot["status"]) => {
      outcome = s;
    },
    failSettings: () => {
      settingsFail = true;
    },
    stop: h.stop,
  };
}
test("reminder offers explicit consent, confirms activation and waits for Submit", async () => {
  const f = reminder();
  let tree = f.render();
  button(tree, pushCopy.sv.enable).onPress();
  await tick();
  tree = f.render();
  assert.deepEqual(f.calls, ["enable:one"]);
  assert(
    nodes(tree).some(
      (n) => n.props?.children === submissionNotificationsCopy.sv.enabled,
    ),
  );
  button(tree, externalSubmissionCopy("sv").send).onPress();
  assert.deepEqual(f.calls, ["enable:one", "submit"]);
  f.stop();
});
test("Settings return enables only after an explicit action, never submits, and cancels on unmount", async () => {
  const f = reminder("denied");
  let tree = f.render();
  f.app("active");
  assert.deepEqual(f.calls, []);
  button(tree, pushCopy.sv.settings).onPress();
  await tick();
  f.app("background");
  f.app("active");
  await tick();
  tree = f.render();
  assert.deepEqual(f.calls, ["settings", "enable:one"]);
  assert.equal(button(tree, externalSubmissionCopy("sv").send).disabled, false);
  f.app("active");
  assert.equal(f.calls.length, 2);
  f.stop();
  const gone = reminder("denied");
  button(gone.render(), pushCopy.sv.settings).onPress();
  await tick();
  gone.stop();
  gone.app("active");
  assert.deepEqual(gone.calls, ["settings"]);
});
test("denial, registration failure and unavailable Settings retain Continue without and Back", async () => {
  for (const outcome of ["denied", "error"] as const) {
    const f = reminder();
    f.outcome(outcome);
    button(f.render(), pushCopy.sv.enable).onPress();
    await tick();
    const tree = f.render();
    assert.equal(f.calls.includes("submit"), false);
    button(tree, submissionNotificationsCopy.sv.without).onPress();
    assert.equal(f.calls.at(-1), "submit");
    f.stop();
  }
  const f = reminder("denied");
  f.failSettings();
  button(f.render(), pushCopy.sv.settings).onPress();
  await tick();
  const tree = f.render();
  assert(nodes(tree).some((n) => n.props?.children === pushCopy.sv.failed));
  f.app("active");
  assert.deepEqual(f.calls, ["settings"]);
  button(tree, submissionNotificationsCopy.sv.back).onPress();
  assert.equal(f.calls.at(-1), "cancel");
  f.stop();
});

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
      "./photo-phone-screen": { PhotoPhoneScreen: "Phone" },
      "./photo-flow-ui": { PhotoStep: "Step", PhotoStrip: "Photos" },
      "./submission-notifications": { SubmissionNotifications: "Reminder" },
      "@/lib/i18n": {
        useI18n: () => ({ locale: "sv", d: { retry: "Retry" } }),
      },
      "@/lib/session": {
        useSession: () => ({
          session: { user: { id: user } },
          refreshAssurance: async () => {},
        }),
      },
      "@/lib/identity-gates": { hasVerifiedPhone: () => true },
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
            await hold;
            return status;
          },
        },
      },
      "@/lib/external-submission-runtime": {
        externalSubmission: async () => ({
          load: async () => (pending ? attempt : null),
          prepare: async () => {
            calls.push("prepare");
          },
          resume: async () => {
            calls.push("submit");
            return { state: "rejected", rejection: "test" };
          },
        }),
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
      if (!pending)
        nodes(render())
          .find((n) => n.type === "Choice")!
          .props.onPress();
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
test("new submission pauses before any prepare/upload; Continue sends once and cancel sends nothing", async () => {
  for (const status of ["off", "denied", "error"] as const) {
    const f = review(status);
    button(await f.ready(), externalSubmissionCopy("sv").send).onPress();
    await tick();
    let prompt = f.render();
    assert.equal(prompt.type, "Reminder");
    assert.deepEqual(f.calls, ["check"]);
    prompt.props.onCancel();
    button(f.render(), externalSubmissionCopy("sv").send).onPress();
    await tick();
    prompt = f.render();
    prompt.props.onContinue();
    prompt.props.onContinue();
    await tick();
    assert.deepEqual(f.calls, ["check", "check", "prepare", "submit"]);
    f.stop();
  }
});
test("enabled notifications and web keep normal submission; existing unknown writes resume without a new gate", async () => {
  for (const status of ["on", "unavailable"] as const) {
    const f = review(status);
    button(await f.ready(), externalSubmissionCopy("sv").send).onPress();
    await tick();
    assert.deepEqual(f.calls, ["check", "prepare", "submit"]);
    f.stop();
  }
  const f = review("off", true);
  button(await f.ready(), externalSubmissionCopy("sv").resume).onPress();
  await tick();
  assert.deepEqual(f.calls, ["submit"]);
  f.stop();
});
test("leaving review or switching account while permission is checked prevents submission", async () => {
  for (const change of ["leave", "account"] as const) {
    const f = review("on");
    f.hold();
    button(await f.ready(), externalSubmissionCopy("sv").send).onPress();
    if (change === "leave") f.stop();
    else f.switchUser();
    f.release();
    await tick();
    assert.deepEqual(f.calls, ["check"]);
    f.stop();
  }
});
test("all reminder copy is translated and has an explicit non-notification option", () => {
  for (const locale of locales) {
    for (const value of Object.values(submissionNotificationsCopy[locale]))
      assert(value.trim());
    assert.notEqual(
      submissionNotificationsCopy[locale].without,
      pushCopy[locale].enable,
    );
  }
});
