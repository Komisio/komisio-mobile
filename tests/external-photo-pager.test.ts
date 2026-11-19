import test from "node:test";
import assert from "node:assert/strict";
import { compilePreview } from "./helpers/compile-preview.ts";
import { externalLifecycleCopy } from "../src/lib/external-lifecycle-copy.ts";
import { externalItemDetailCopy } from "../src/lib/external-item-detail-copy.ts";

function flatten(v: any): any[] {
  if (v == null || typeof v === "boolean") return [];
  if (Array.isArray(v)) return v.flatMap(flatten);
  if (typeof v !== "object") return [v];
  if (typeof v.type === "function") return flatten(v.type(v.props));
  return [v, ...flatten(v.props?.children)];
}
function harness(count = 3, offered = false) {
  const slots: any[] = [],
    effects: (() => void)[] = [],
    scrolls: number[] = [];
  let cursor = 0,
    owner = "owner",
    resolveSigning: (() => void) | undefined;
  let paused = false,
    signed = 0;
  const signings: { paths: string[]; ttl: number }[] = [];
  const photos = Array.from({ length: count }, (_, n) => `photo-${n}`);
  const { ExternalPhotoPager } = compilePreview(
    "components/external-photo-pager.tsx",
    {
      react: {
        useState: (initial: any) => {
          const n = cursor++;
          if (!(n in slots))
            slots[n] = typeof initial === "function" ? initial() : initial;
          return [
            slots[n],
            (next: any) => {
              slots[n] = typeof next === "function" ? next(slots[n]) : next;
            },
          ];
        },
        useRef: (initial: any) => {
          const n = cursor++;
          return (slots[n] ??= { current: initial });
        },
        useEffect: (effect: () => any, deps: any[]) => {
          const n = cursor++,
            old = slots[n];
          if (!old || deps.some((v, i) => v !== old.deps[i])) {
            effects.push(() => {
              old?.cleanup?.();
              slots[n] = { deps, cleanup: effect() };
            });
          }
        },
      },
      "react-native": {
        Platform: { OS: "ios" },
        ScrollView: "ScrollView",
        View: "View",
        Text: "Text",
        StyleSheet: { create: (v: any) => v },
      },
      "expo-image": { Image: "Image" },
      "@/lib/i18n": {
        useI18n: () => ({ locale: "sv", d: { retry: "Försök igen" } }),
      },
      "@/lib/session": {
        useSession: () => ({ session: { user: { id: owner } } }),
      },
      "@/lib/supabase": {
        supabase: {
          auth: {
            getSession: async () => ({
              data: { session: { user: { id: owner } } },
              error: null,
            }),
          },
          storage: {
            from: (bucket: string) => {
              assert.equal(bucket, "external-item-photos");
              return {
                createSignedUrls: async (paths: string[], ttl: number) => {
                  signings.push({ paths: Array.from(paths), ttl });
                  if (paused)
                    await new Promise<void>((r) => {
                      resolveSigning = r;
                    });
                  signed++;
                  return {
                    data: paths.map((path) => ({
                      signedUrl: `https://example.test/${path}?attempt=${signed}`,
                    })),
                    error: null,
                  };
                },
              };
            },
          },
        },
      },
      "@/lib/external-offer-runtime": {
        readExternalOfferItem: async (o: string, id: string) => {
          assert.equal(o, "owner");
          assert.equal(id, "offer");
          return { item: { photos } };
        },
      },
      "@/lib/external-lifecycle-copy": { externalLifecycleCopy },
      "@/lib/external-item-detail-copy": { externalItemDetailCopy },
      "./ui": {
        Button: "Button",
        Loading: "Loading",
        Message: "Message",
        colors: {},
        uiStyles: {},
      },
    },
  );
  const render = () => {
    cursor = 0;
    const nodes = flatten(
      ExternalPhotoPager({
        owner: "owner",
        photos: offered ? [photos[0]] : photos,
        label: "Klänning",
        offerId: offered ? "offer" : undefined,
      }),
    );
    for (const node of nodes)
      if (node.type === "ScrollView")
        node.props.ref.current = { scrollTo: (p: any) => scrolls.push(p.x) };
    effects.splice(0).forEach((f) => f());
    return nodes;
  };
  const flush = async () => {
    for (let n = 0; n < 12; n++) await Promise.resolve();
  };
  const viewport = () => render().find((n) => n.props?.onLayout);
  const scroll = () => render().find((n) => n.type === "ScrollView");
  return {
    render,
    flush,
    scroll,
    viewport,
    scrolls,
    signings,
    layout: (width: number) =>
      viewport().props.onLayout({ nativeEvent: { layout: { width } } }),
    swipe: (x: number, width = 320) =>
      scroll().props.onScroll({
        nativeEvent: { layoutMeasurement: { width }, contentOffset: { x } },
      }),
    switchOwner: () => {
      owner = "other";
    },
    pause: () => {
      paused = true;
    },
    resume: () => resolveSigning?.(),
    unmount: () => slots.forEach((s) => s?.cleanup?.()),
  };
}

test("swiping pages updates the counter, clamps at either end and preserves the image after resizing", async () => {
  const h = harness();
  h.render();
  await h.flush();
  h.layout(320);
  assert.ok(h.render().includes("Bild 1 av 3"));
  assert.equal(h.scroll().props.horizontal, true);
  assert.equal(h.scroll().props.pagingEnabled, true);
  h.swipe(320);
  assert.ok(h.render().includes("Bild 2 av 3"));
  h.swipe(640);
  assert.ok(h.render().includes("Bild 3 av 3"));
  h.swipe(9999);
  assert.ok(h.render().includes("Bild 3 av 3"));
  h.layout(480);
  h.render();
  assert.equal(h.scrolls.at(-1), 960);
  h.swipe(0, 320);
  assert.ok(h.render().includes("Bild 3 av 3")); // stale orientation event
  h.swipe(-50, 480);
  assert.ok(h.render().includes("Bild 1 av 3"));
  assert.ok(!h.render().some((n) => n.type === "Button"));
  h.unmount();
});
test("screen readers can change photos without visible previous/next buttons; one photo does not page", async () => {
  const h = harness();
  h.render();
  await h.flush();
  h.layout(320);
  h.viewport().props.onAccessibilityAction({
    nativeEvent: { actionName: "increment" },
  });
  assert.ok(h.render().includes("Bild 2 av 3"));
  assert.equal(h.scrolls.at(-1), 320);
  h.viewport().props.onAccessibilityAction({
    nativeEvent: { actionName: "decrement" },
  });
  assert.ok(h.render().includes("Bild 1 av 3"));
  h.unmount();
  const single = harness(1);
  single.render();
  await single.flush();
  single.layout(320);
  assert.equal(single.scroll().props.scrollEnabled, false);
  assert.equal(single.viewport().props.accessibilityRole, "image");
  assert.equal(single.viewport().props.accessibilityActions, undefined);
  single.unmount();
});
test("private photos use short-lived owner-scoped URLs, recover a failed image and resolve all handover originals", async () => {
  const h = harness(3, true);
  h.render();
  await h.flush();
  h.layout(320);
  assert.deepEqual(h.signings, [
    {
      paths: ["owner/photo-0.jpg", "owner/photo-1.jpg", "owner/photo-2.jpg"],
      ttl: 60,
    },
  ]);
  const images = h.render().filter((n) => n.type === "Image");
  assert.ok(images.every((n) => n.props.cachePolicy === "none"));
  images[1].props.onError();
  h.swipe(320);
  assert.ok(h.render().includes(externalItemDetailCopy("sv").photoError));
  assert.equal(h.render().filter((n) => n.type === "Image").length, 2);
  h.render()
    .find((n) => n.type === "Button")
    .props.onPress();
  h.render();
  await h.flush();
  assert.equal(h.render().filter((n) => n.type === "Image").length, 3);
  assert.ok(h.render().includes("Bild 2 av 3"));
  h.switchOwner();
  assert.deepEqual(h.render(), []);
  h.unmount();
});
test("a signing response arriving after an account change or closing cannot expose photos", async () => {
  for (const change of ["account", "close"]) {
    const h = harness();
    h.pause();
    h.render();
    await h.flush();
    if (change === "account") h.switchOwner();
    else h.unmount();
    h.resume();
    await h.flush();
    if (change === "account") assert.deepEqual(h.render(), []);
    else assert.ok(!h.render().some((n) => n.type === "Image"));
    h.unmount();
  }
});
