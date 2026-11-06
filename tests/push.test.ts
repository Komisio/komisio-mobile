import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import {
  createPushController,
  type PushPermission,
} from "../src/lib/push-controller.ts";
import {
  parsePushData,
  deviceReply,
  type PushCommand,
  type DeviceState,
} from "../src/lib/push-contract.ts";
import { ownsPush, pushDestination } from "../src/lib/push-routing.ts";
import { pushCopy } from "../src/lib/push-copy.ts";
import { locales } from "../src/lib/locale.ts";

function fixture(options: { stored?: string; platform?: "ios" | "web" } = {}) {
  let stored: string | null = options.stored ?? null;
  let remote: DeviceState = { revision: 0, enabled: false, requestId: null };
  let owner = "",
    permission: PushPermission = "granted",
    fail = false;
  let token = "ExpoPushToken[first]";
  const writes: { user: string; command: PushCommand }[] = [];
  const prompts: boolean[] = [];
  let answer: PushPermission | null = null;
  let promptHook: (() => Promise<void>) | null = null;
  const controller = createPushController({
    storageKey: "test",
    platform: options.platform ?? "ios",
    randomId: randomUUID,
    storage: {
      getItem: async () => stored,
      setItem: async (_, v) => {
        stored = v;
      },
    },
    permission: async (request) => {
      prompts.push(request);
      if (request) {
        await promptHook?.();
        if (answer) permission = answer;
      }
      return permission;
    },
    token: async () => token,
    read: async (user) => ({
      ...remote,
      enabled: remote.enabled && user === owner,
      requestId: user === owner ? remote.requestId : null,
    }),
    write: async (user, command) => {
      writes.push({ user, command });
      if (command.requestId !== remote.requestId) {
        if (command.expectedRevision !== remote.revision)
          throw new Error("PUSH_DEVICE_CHANGED");
        remote = {
          revision: remote.revision + 1,
          enabled: command.enabled,
          requestId: command.requestId,
        };
        owner = user;
      }
      if (fail) throw new Error("UNKNOWN_REPLY");
      return remote;
    },
    dismiss: async () => {},
  });
  return {
    controller,
    writes,
    prompts,
    state: () => remote,
    saved: () => JSON.parse(stored!),
    permission: (p: PushPermission) => {
      permission = p;
    },
    answer: (p: PushPermission) => {
      answer = p;
    },
    onPrompt: (hook: () => Promise<void>) => {
      promptHook = hook;
    },
    fail: (f: boolean) => {
      fail = f;
    },
    token: (t: string) => {
      token = t;
    },
  };
}
test("opening app does not prompt or opt in; explicit consent and disable are confirmed", async () => {
  const f = fixture();
  await f.controller.setContext("one", "sv");
  assert.equal(f.writes.length, 0);
  assert.ok(f.prompts.every((p) => !p));
  await f.controller.enable();
  assert.equal(f.controller.getSnapshot().status, "on");
  assert.equal(f.writes[0].command.locale, "sv");
  await f.controller.disable();
  assert.equal(f.state().enabled, false);
  assert.equal(f.controller.getSnapshot().status, "off");
});
test("first seller sign-in requests native permission once and preserves manual controls", async () => {
  const f = fixture();
  f.permission("undetermined");
  f.answer("granted");
  await f.controller.setContext("one", "sv");
  assert.equal(f.prompts.filter(Boolean).length, 0);
  await f.controller.requestInitialPermission("one");
  assert.equal(f.prompts.filter(Boolean).length, 1);
  assert.equal(f.controller.getSnapshot().status, "on");
  assert.equal(f.writes[0].user, "one");
  await f.controller.refresh();
  await f.controller.setContext("one", "en");
  await f.controller.requestInitialPermission("one");
  assert.equal(f.prompts.filter(Boolean).length, 1);
  await f.controller.disable();
  await f.controller.requestInitialPermission("one");
  assert.equal(f.controller.getSnapshot().status, "off");
  await f.controller.enable();
  assert.equal(f.controller.getSnapshot().status, "on");
});
test("initial refusal is saved before prompting and survives refresh and relaunch", async () => {
  const f = fixture();
  f.permission("undetermined");
  f.answer("denied");
  f.onPrompt(async () => {
    assert.equal(f.saved().initialPermissionAsked, true);
  });
  await f.controller.setContext("one", "sv");
  await f.controller.requestInitialPermission("one");
  await f.controller.refresh();
  await f.controller.requestInitialPermission("one");
  assert.equal(f.prompts.filter(Boolean).length, 1);
  assert.equal(f.writes.length, 0);
  assert.equal(f.controller.getSnapshot().status, "denied");
  const restarted = fixture({ stored: JSON.stringify(f.saved()) });
  restarted.permission("undetermined");
  await restarted.controller.setContext("one", "sv");
  await restarted.controller.requestInitialPermission("one");
  assert.equal(restarted.prompts.filter(Boolean).length, 0);
  assert.equal(restarted.writes.length, 0);
});
test("initial request never replaces an existing OS choice or a manual disable", async () => {
  for (const permission of ["granted", "denied", "unavailable"] as const) {
    const f = fixture();
    f.permission(permission);
    await f.controller.setContext("one", "sv");
    const legacy = f.saved();
    delete legacy.initialPermissionAsked;
    const migrated = fixture({ stored: JSON.stringify(legacy) });
    migrated.permission(permission);
    await migrated.controller.setContext("one", "sv");
    await migrated.controller.requestInitialPermission("one");
    assert.equal(migrated.prompts.filter(Boolean).length, 0);
    assert.equal(migrated.writes.length, 0);
  }
  const f = fixture();
  f.permission("undetermined");
  await f.controller.setContext("one", "sv");
  await f.controller.disable();
  await f.controller.requestInitialPermission("one");
  assert.equal(f.prompts.filter(Boolean).length, 0);
});
test("initial permission requires the current signed-in native identity", async () => {
  for (const platform of ["ios", "web"] as const) {
    const f = fixture({ platform });
    f.permission("undetermined");
    await f.controller.requestInitialPermission("one");
    await f.controller.setContext("one", "sv");
    await f.controller.requestInitialPermission("other");
    if (platform === "web") await f.controller.requestInitialPermission("one");
    const queued = f.controller.requestInitialPermission("one");
    const switched = f.controller.setContext("two", "sv");
    await Promise.all([queued, switched]);
    assert.equal(f.prompts.filter(Boolean).length, 0);
    assert.equal(f.writes.length, 0);
  }
});
test("changing account while the native prompt is open cannot register either account", async () => {
  const f = fixture();
  f.permission("undetermined");
  f.answer("granted");
  let release!: () => void;
  let started!: () => void;
  const entered = new Promise<void>((resolve) => {
    started = resolve;
  });
  const waiting = new Promise<void>((resolve) => {
    release = resolve;
  });
  f.onPrompt(async () => {
    started();
    await waiting;
  });
  await f.controller.setContext("one", "sv");
  const initial = f.controller.requestInitialPermission("one");
  await entered;
  const switched = f.controller.setContext("two", "sv");
  release();
  await Promise.all([initial, switched]);
  await f.controller.requestInitialPermission("two");
  assert.equal(f.writes.length, 0);
  assert.equal(f.saved().desired, false);
  assert.equal(f.prompts.filter(Boolean).length, 1);
});
test("unknown enable response stays pending and replays the exact request", async () => {
  const f = fixture();
  await f.controller.setContext("one", "en");
  f.fail(true);
  await f.controller.enable();
  assert.equal(f.controller.getSnapshot().status, "error");
  const pending = f.saved().pending.command;
  f.fail(false);
  await f.controller.refresh();
  assert.deepEqual(f.writes[1].command, pending);
  assert.equal(f.saved().pending, null);
  assert.equal(f.controller.getSnapshot().status, "on");
});
test("disable overrides an unknown enable and logout waits for confirmed revocation", async () => {
  const f = fixture();
  await f.controller.setContext("one", "en");
  f.fail(true);
  await f.controller.enable();
  await assert.rejects(f.controller.beforeLogout(), /UNKNOWN_REPLY/);
  assert.equal(f.controller.getSnapshot().status, "error");
  f.fail(false);
  await f.controller.beforeLogout();
  assert.equal(f.state().enabled, false);
  assert.ok(f.writes.slice(1).every((w) => !w.command.enabled));
});
test("account switch revokes the previous account without inheriting consent", async () => {
  const f = fixture();
  await f.controller.setContext("one", "en");
  await f.controller.enable();
  await f.controller.setContext("two", "en");
  assert.equal(f.state().enabled, false);
  assert.equal(f.controller.getSnapshot().status, "off");
  assert.equal(f.writes.at(-1)?.user, "two");
  assert.equal(f.saved().desired, false);
});
test("denied permission revokes existing push; token rotation uses current token", async () => {
  const f = fixture();
  await f.controller.setContext("one", "en");
  await f.controller.enable();
  f.token("ExpoPushToken[rotated]");
  await f.controller.refresh();
  assert.equal(f.writes.at(-1)?.command.token, "ExpoPushToken[rotated]");
  f.permission("denied");
  await f.controller.refresh();
  assert.equal(f.state().enabled, false);
  assert.equal(f.controller.getSnapshot().status, "denied");
});
test("queued enable cannot register a user after context changes", async () => {
  const f = fixture();
  await f.controller.setContext("one", "en");
  const enabling = f.controller.enable();
  const switching = f.controller.setContext("two", "en");
  await Promise.all([enabling, switching]);
  assert.equal(f.writes.length, 0);
  assert.equal(f.state().enabled, false);
});
test("payload routes require valid IDs and exact seller in an app-visible store", () => {
  const p = {
    v: 1 as const,
    notificationId: randomUUID(),
    kind: "item_sold" as const,
    tenantId: randomUUID(),
    sellerId: randomUUID(),
    itemId: randomUUID(),
  };
  const accounts = [{ tenantId: p.tenantId, sellerId: p.sellerId }],
    store = { id: p.tenantId, name: "Test", slug: "test" };
  assert.deepEqual(parsePushData({ ...p, url: "https://untrusted.test" }), p);
  assert.equal(parsePushData({ ...p, itemId: "../../other" }), null);
  assert.equal(parsePushData({ ...p, kind: "admin_sale" }), null);
  assert.equal(
    ownsPush(p, [{ ...accounts[0], sellerId: randomUUID() }]),
    false,
  );
  assert.equal(pushDestination(p, accounts, []), null);
  assert.deepEqual(pushDestination(p, accounts, [store]), store);
});
test("all app languages have complete nonempty notification copy", () => {
  for (const locale of locales)
    for (const value of Object.values(pushCopy[locale]))
      assert.ok(value.trim());
});
test("mismatched response cannot confirm a device write", () => {
  const c: PushCommand = {
    action: "set",
    deviceId: randomUUID(),
    deviceSecret: "a".repeat(64),
    requestId: randomUUID(),
    expectedRevision: 1,
    token: "ExpoPushToken[x]",
    platform: "ios",
    locale: "sv",
    enabled: true,
  };
  assert.throws(
    () =>
      deviceReply(
        {
          ok: true,
          id: randomUUID(),
          deviceId: c.deviceId,
          revision: 2,
          enabled: true,
        },
        c,
      ),
    /INVALID_REPLY/,
  );
});
