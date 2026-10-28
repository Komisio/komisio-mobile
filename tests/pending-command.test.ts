import assert from "node:assert/strict";
import test from "node:test";
import {
  createPendingCommand,
  type CommandLock,
  type CommandOutcome,
  type CommandStorage,
} from "../src/lib/pending-command.ts";

type Command = { id: string; details: { account: string } };
const command = (): Command => ({
  id: "original-id",
  details: { account: "synthetic-123" },
});
function fixture() {
  const values = new Map<string, string>(),
    log: string[] = [],
    held = new Set<string>();
  const storage: CommandStorage = {
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => {
      log.push("stored");
      values.set(key, value);
    },
    removeItem: async (key) => {
      log.push("removed");
      values.delete(key);
    },
  };
  const lock: CommandLock = async (key, work) => {
    if (held.has(key)) throw new Error("BUSY");
    held.add(key);
    try {
      return await work();
    } finally {
      held.delete(key);
    }
  };
  const sent: Command[] = [];
  let outcome: CommandOutcome = { kind: "unknown", code: "UNKNOWN" };
  const send = async (c: Command) => {
    log.push("sent");
    sent.push(structuredClone(c));
    return outcome;
  };
  const deps = {
    key: "scope",
    binding: "user/tenant/seller/api",
    storage,
    lock,
    send,
    parse: (value: unknown): Command => {
      const c = value as Command;
      if (!c?.id || typeof c.details?.account !== "string")
        throw new Error("INVALID");
      return c;
    },
  };
  return {
    values,
    log,
    storage,
    sent,
    deps,
    writer: () => createPendingCommand(deps),
    setOutcome: (next: CommandOutcome) => {
      outcome = next;
    },
  };
}

test("intent is stored and verified before sending; caller mutations cannot change it", async () => {
  const f = fixture(),
    writer = f.writer(),
    input = command();
  const saving = writer.submit(input);
  input.details.account = "changed after call";
  await saving;
  assert.deepEqual(f.log, ["stored", "sent"]);
  assert.equal(f.sent[0].details.account, "synthetic-123");
  assert.equal(writer.getState().status, "pending");
  assert.equal(
    JSON.parse(f.values.get("scope")!).command.details.account,
    "synthetic-123",
  );
});

test("save failure or a failed readback never dispatches", async () => {
  for (const mode of ["throw", "lost"] as const) {
    const f = fixture();
    f.storage.setItem = async () => {
      if (mode === "throw") throw new Error("disk full");
    };
    const writer = f.writer();
    await writer.submit(command());
    assert.equal(writer.getState().status, "blocked");
    assert.equal(f.sent.length, 0);
  }
});

test("restart restores an uncertain command without sending; explicit retry replays exact input", async () => {
  const f = fixture();
  await f.writer().submit(command());
  const recovered = f.writer();
  await recovered.load();
  assert.equal(recovered.getState().status, "pending");
  assert.equal(f.sent.length, 1);
  await recovered.submit({ id: "new-id", details: { account: "replacement" } });
  assert.equal(f.sent.length, 1);
  f.setOutcome({ kind: "success", id: "original-id" });
  await recovered.retry();
  assert.deepEqual(f.sent, [command(), command()]);
  assert.equal(recovered.getState().status, "success");
  assert.equal(f.values.size, 0);
});

test("a thrown network result and later auth failures retain the same journal", async () => {
  const f = fixture();
  const writer = createPendingCommand({
    ...f.deps,
    send: async () => {
      throw new Error("timeout");
    },
  });
  await writer.submit(command());
  const raw = f.values.get("scope");
  f.setOutcome({ kind: "unknown", code: "AUTH_REQUIRED" });
  const retry = f.writer();
  await retry.retry();
  assert.equal(retry.getState().code, "AUTH_REQUIRED");
  assert.equal(f.values.get("scope"), raw);
});

test("confirmed success with failed cleanup cannot send a new change; retry only cleans up", async () => {
  const f = fixture(),
    remove = f.storage.removeItem;
  f.storage.removeItem = async () => {
    throw new Error("device locked");
  };
  f.setOutcome({ kind: "success", id: "original-id" });
  const writer = f.writer();
  await writer.submit(command());
  assert.equal(writer.getState().status, "cleanup");
  await writer.submit({ id: "new", details: { account: "no" } });
  assert.equal(f.sent.length, 1);
  f.storage.removeItem = remove;
  await writer.retry();
  assert.equal(writer.getState().status, "success");
  assert.equal(f.sent.length, 1);
  assert.equal(f.values.size, 0);
});

test("a storage removal that silently fails keeps the journal locked", async () => {
  const f = fixture();
  f.setOutcome({ kind: "success", id: "original-id" });
  f.storage.removeItem = async () => {};
  const writer = f.writer();
  await writer.submit(command());
  assert.equal(writer.getState().status, "cleanup");
  assert.equal(f.values.size, 1);
});

test("scope/destination mismatch and malformed journals fail closed without deletion", async () => {
  const f = fixture();
  await f.writer().submit(command());
  const raw = f.values.get("scope")!;
  const wrongScope = createPendingCommand({
    ...f.deps,
    binding: "different project/user",
  });
  await wrongScope.retry();
  assert.equal(wrongScope.getState().status, "blocked");
  assert.equal(f.values.get("scope"), raw);
  for (const corrupt of [
    "{broken",
    "null",
    JSON.stringify({ version: 1, binding: f.deps.binding, command: {} }),
  ]) {
    f.values.set("scope", corrupt);
    const writer = f.writer();
    await writer.load();
    assert.equal(writer.getState().status, "blocked");
    assert.equal(f.values.get("scope"), corrupt);
  }
  assert.equal(f.sent.length, 1);
});

test("two views and repeated taps cannot dispatch concurrently", async () => {
  const f = fixture();
  let release!: (outcome: CommandOutcome) => void;
  const first = createPendingCommand({
    ...f.deps,
    send: async (c) => {
      f.sent.push(c);
      return new Promise<CommandOutcome>((resolve) => {
        release = resolve;
      });
    },
  });
  const pending = first.submit(command());
  await new Promise<void>((resolve) => setImmediate(resolve));
  await first.submit(command());
  const second = f.writer();
  await second.submit(command());
  assert.equal(second.getState().code, "BUSY");
  assert.equal(f.sent.length, 1);
  release({ kind: "unknown", code: "UNKNOWN" });
  await pending;
  await second.load();
  assert.equal(second.getState().status, "pending");
});

test("confirmed stale-version conflict releases the old intent without dispatching a replacement", async () => {
  const f = fixture();
  f.setOutcome({ kind: "conflict", code: "BANK_DETAILS_CHANGED" });
  const writer = f.writer();
  await writer.submit(command());
  assert.equal(writer.getState().status, "conflict");
  assert.equal(f.sent.length, 1);
  assert.equal(f.values.size, 0);
});
