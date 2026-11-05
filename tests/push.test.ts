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

function fixture() {
  let stored: string | null = null;
  let remote: DeviceState = { revision: 0, enabled: false, requestId: null };
  let owner = "",
    permission: PushPermission = "granted",
    fail = false;
  let token = "ExpoPushToken[first]";
  const writes: { user: string; command: PushCommand }[] = [];
  const prompts: boolean[] = [];
  const controller = createPushController({
    storageKey: "test",
    platform: "ios",
    randomId: randomUUID,
    storage: {
      getItem: async () => stored,
      setItem: async (_, v) => {
        stored = v;
      },
    },
    permission: async (request) => {
      prompts.push(request);
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
