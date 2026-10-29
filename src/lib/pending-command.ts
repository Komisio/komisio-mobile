export type CommandOutcome =
  | { kind: "success"; id: string }
  | { kind: "conflict"; code: string }
  | { kind: "rejected"; code: string }
  | { kind: "unknown"; code: string };
export type CommandState<C> = {
  status:
    | "idle"
    | "busy"
    | "ready"
    | "pending"
    | "success"
    | "conflict"
    | "rejected"
    | "discarded"
    | "cleanup"
    | "blocked";
  command: C | null;
  code: string | null;
};
export type CommandStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};
export type CommandLock = <T>(
  key: string,
  work: () => Promise<T>,
) => Promise<T>;

/** Durable intent, never a background sender. Recovery requires an explicit retry. */
export function createPendingCommand<C>(deps: {
  key: string;
  binding: string;
  storage: CommandStorage;
  lock: CommandLock;
  parse: (value: unknown) => C;
  send: (command: C) => Promise<CommandOutcome>;
}) {
  let state: CommandState<C> = { status: "idle", command: null, code: null };
  let busy = false;
  let completed: Exclude<CommandOutcome, { kind: "unknown" }> | null = null;
  let completedRaw: string | null = null;
  const listeners = new Set<() => void>();
  function publish(next: CommandState<C>) {
    state = next;
    listeners.forEach((listener) => listener());
  }
  function decode(raw: string): C {
    if (raw.length > 16000) throw new Error("STORAGE");
    const value = JSON.parse(raw) as {
      version?: unknown;
      binding?: unknown;
      command?: unknown;
    };
    if (value.version !== 1 || value.binding !== deps.binding)
      throw new Error("STORAGE");
    return deps.parse(value.command);
  }
  async function settle(
    raw: string,
    command: C,
    outcome: Exclude<CommandOutcome, { kind: "unknown" }>,
  ) {
    completed = outcome;
    completedRaw = raw;
    try {
      const stored = await deps.storage.getItem(deps.key);
      if (stored !== null && stored !== raw) throw new Error("STORAGE");
      if (stored !== null) await deps.storage.removeItem(deps.key);
      if ((await deps.storage.getItem(deps.key)) !== null)
        throw new Error("STORAGE");
      completed = null;
      completedRaw = null;
      publish({
        status: outcome.kind,
        command: null,
        code: outcome.kind === "success" ? null : outcome.code,
      });
    } catch {
      publish({ status: "cleanup", command, code: outcome.kind });
    }
  }
  async function run(work: () => Promise<void>) {
    if (busy) return;
    busy = true;
    publish({ ...state, status: "busy", code: null });
    try {
      await deps.lock(deps.key, work);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      publish({
        ...state,
        status: "blocked",
        code:
          message === "BUSY" || message === "UNSUPPORTED" ? message : "STORAGE",
      });
    } finally {
      busy = false;
    }
  }
  async function dispatch(raw: string, command: C, firstAttempt = false) {
    let outcome: CommandOutcome;
    try {
      outcome = await deps.send(command);
    } catch {
      outcome = { kind: "unknown", code: "UNKNOWN" };
    }
    // A refusal before replay on a retry does not disprove an earlier commit.
    if (
      outcome.kind === "unknown" ||
      (outcome.kind === "rejected" && !firstAttempt)
    )
      publish({ status: "pending", command, code: outcome.code });
    else await settle(raw, command, outcome);
  }
  return {
    getState: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    load: () =>
      run(async () => {
        if (completed && completedRaw) {
          await settle(completedRaw, decode(completedRaw), completed);
          return;
        }
        const raw = await deps.storage.getItem(deps.key);
        publish(
          raw === null
            ? { status: "ready", command: null, code: null }
            : { status: "pending", command: decode(raw), code: null },
        );
      }),
    submit: (input: C) => {
      // Snapshot at the call boundary, before a lock or storage read can yield.
      const command = deps.parse(JSON.parse(JSON.stringify(input)));
      return run(async () => {
        if (completed && completedRaw) {
          await settle(completedRaw, decode(completedRaw), completed);
          return;
        }
        const previous = await deps.storage.getItem(deps.key);
        if (previous !== null) {
          publish({ status: "pending", command: decode(previous), code: null });
          return;
        }
        const raw = JSON.stringify({
          version: 1,
          binding: deps.binding,
          command,
        });
        if (raw.length > 16000) throw new Error("STORAGE");
        await deps.storage.setItem(deps.key, raw);
        if ((await deps.storage.getItem(deps.key)) !== raw)
          throw new Error("STORAGE");
        publish({ status: "busy", command, code: null });
        await dispatch(raw, command, true);
      });
    },
    discard: () => {
      // Bind confirmation to what this view showed, not a replacement from
      // another tab. Never delete while dispatch or known-result cleanup runs.
      if (busy || state.status !== "pending" || !state.command)
        return Promise.resolve();
      const confirmed = JSON.stringify(state.command);
      return run(async () => {
        const raw = await deps.storage.getItem(deps.key);
        if (raw !== null && JSON.stringify(decode(raw)) !== confirmed) {
          publish({ status: "pending", command: decode(raw), code: null });
          return;
        }
        if (raw !== null) await deps.storage.removeItem(deps.key);
        if ((await deps.storage.getItem(deps.key)) !== null)
          throw new Error("STORAGE");
        publish({ status: "discarded", command: null, code: null });
      });
    },
    retry: () =>
      run(async () => {
        if (completed && completedRaw) {
          await settle(completedRaw, decode(completedRaw), completed);
          return;
        }
        const raw = await deps.storage.getItem(deps.key);
        if (raw === null) {
          publish({ status: "ready", command: null, code: null });
          return;
        }
        const command = decode(raw);
        publish({ status: "busy", command, code: null });
        await dispatch(raw, command);
      }),
  };
}
