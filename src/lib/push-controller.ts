import {
  validIdentity,
  validPushCommand,
  type DeviceIdentity,
  type DeviceState,
  type PushCommand,
} from "./push-contract.ts";

export type PushPermission =
  "granted" | "denied" | "undetermined" | "unavailable";
type Stored = DeviceIdentity & {
  owner: string;
  desired: boolean;
  registered: boolean;
  pending: { user: string; command: PushCommand } | null;
};
export type PushSnapshot = {
  status: "loading" | "on" | "off" | "denied" | "unavailable" | "error";
  busy: boolean;
  error: string | null;
};
export type PushDependencies = {
  storage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
  };
  storageKey: string;
  platform: "ios" | "android" | "web";
  randomId(): string;
  permission(request: boolean): Promise<PushPermission>;
  token(): Promise<string>;
  read(user: string, device: DeviceIdentity): Promise<DeviceState>;
  write(user: string, command: PushCommand): Promise<DeviceState>;
  dismiss(): Promise<void>;
};

/** Serializes installation state, exact pending requests and account changes.
 * An unknown write remains on disk. Optimistic revisions fence delayed requests
 * from an older account even when that account can no longer replay its request. */
export function createPushController(deps: PushDependencies) {
  let user: string | null = null,
    locale = "en",
    generation = 0;
  let snapshot: PushSnapshot = {
    status: deps.platform === "web" ? "unavailable" : "off",
    busy: false,
    error: null,
  };
  let queue = Promise.resolve();
  const listeners = new Set<() => void>();
  const emit = (value: PushSnapshot) => {
    snapshot = value;
    listeners.forEach((fn) => fn());
  };
  async function load(currentUser: string): Promise<Stored> {
    const raw = await deps.storage.getItem(deps.storageKey);
    if (raw) {
      const r = JSON.parse(raw) as Stored;
      if (
        !validIdentity(r) ||
        typeof r.owner !== "string" ||
        typeof r.desired !== "boolean" ||
        typeof r.registered !== "boolean" ||
        (r.pending !== null &&
          (!r.pending ||
            typeof r.pending.user !== "string" ||
            !validPushCommand(r.pending.command) ||
            r.pending.command.deviceId !== r.deviceId ||
            r.pending.command.deviceSecret !== r.deviceSecret))
      )
        throw new Error("STORAGE");
      return r;
    }
    const r: Stored = {
      deviceId: deps.randomId(),
      deviceSecret: `${deps.randomId()}${deps.randomId()}`.replaceAll("-", ""),
      owner: currentUser,
      desired: false,
      registered: false,
      pending: null,
    };
    await save(r);
    return r;
  }
  async function save(value: Stored) {
    await deps.storage.setItem(deps.storageKey, JSON.stringify(value));
  }
  function schedule(action: () => Promise<void>) {
    const result = queue.then(action);
    queue = result.catch(() => {});
    return result;
  }
  async function synchronize(
    intent: "refresh" | "enable" | "disable" | "logout",
    expected: number,
  ) {
    const currentUser = user;
    if (!currentUser || deps.platform === "web" || expected !== generation)
      return;
    const current = () => generation === expected && user === currentUser;
    emit({ ...snapshot, busy: true, error: null });
    try {
      const r = await load(currentUser);
      if (!current()) return;
      if (r.owner !== currentUser) {
        r.owner = currentUser;
        r.desired = false;
        await save(r);
      }
      let permission = await deps.permission(false);
      if (!current()) return;
      if (intent === "enable" && permission !== "unavailable") {
        permission = await deps.permission(true);
        if (!current()) return;
        r.desired = permission === "granted";
        await save(r);
      }
      if (intent === "disable" || intent === "logout") {
        r.desired = false;
        await save(r);
        await deps.dismiss();
      }
      if (permission === "unavailable" && !r.registered && !r.pending) {
        emit({ status: "unavailable", busy: false, error: null });
        return;
      }
      const desired = r.desired && permission === "granted";
      // A phone that never registered (or confirmed revocation) can stay usable
      // offline, including logout. Unknown requests always require reconciliation.
      if (!desired && !r.registered && !r.pending) {
        emit({
          status: permission === "denied" ? "denied" : "off",
          busy: false,
          error: null,
        });
        return;
      }
      // A same-account pending request can be replayed exactly. Explicit disable
      // overrides a pending enable using a fresh state revision instead.
      if (
        r.pending?.user === currentUser &&
        r.pending.command.enabled === desired
      ) {
        try {
          await deps.write(currentUser, r.pending.command);
        } catch (error) {
          // A revoked token, newer device revision or a new login session can
          // supersede this consent write. Reconcile state; do not call it saved.
          if (
            !(error instanceof Error) ||
            !["PUSH_DEVICE_CHANGED", "REQUEST_CONFLICT"].includes(error.message)
          )
            throw error;
        }
        if (!current()) return;
        r.pending = null;
        await save(r);
      }
      let remote = await deps.read(currentUser, r);
      if (!current()) return;
      const token = desired ? await deps.token() : null;
      if (!current()) return;
      if (
        desired ||
        r.registered ||
        remote.enabled ||
        (remote.revision > 0 && remote.requestId === null) ||
        r.pending !== null
      ) {
        // One retry is allowed for an explicit revision conflict, never for an
        // unknown reply. This also fences a delayed older-account registration.
        for (let attempt = 0; attempt < 2; attempt++) {
          const command: PushCommand = {
            action: "set",
            deviceId: r.deviceId,
            deviceSecret: r.deviceSecret,
            requestId: deps.randomId(),
            expectedRevision: remote.revision,
            token,
            platform: deps.platform,
            locale,
            enabled: desired,
          };
          r.pending = { user: currentUser, command };
          r.registered = true;
          await save(r);
          if (!current()) return;
          try {
            await deps.write(currentUser, command);
          } catch (error) {
            if (
              !(error instanceof Error) ||
              error.message !== "PUSH_DEVICE_CHANGED" ||
              attempt !== 0
            )
              throw error;
            remote = await deps.read(currentUser, r);
            if (!current()) return;
            continue;
          }
          if (!current()) return;
          r.pending = null;
          r.registered = desired;
          await save(r);
          break;
        }
      }
      if (current())
        emit({
          status: desired ? "on" : permission === "denied" ? "denied" : "off",
          busy: false,
          error: null,
        });
    } catch (error) {
      if (current())
        emit({
          status: "error",
          busy: false,
          error: error instanceof Error ? error.message : "REQUEST_FAILED",
        });
      if (intent === "logout") throw error;
    }
  }
  return {
    subscribe(fn: () => void) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    getSnapshot: () => snapshot,
    setContext(nextUser: string | null, nextLocale: string) {
      const changed = nextUser !== user || nextLocale !== locale;
      if (!changed) return queue;
      user = nextUser;
      locale = nextLocale;
      generation++;
      emit({
        status:
          deps.platform === "web"
            ? "unavailable"
            : nextUser
              ? "loading"
              : "off",
        busy: false,
        error: null,
      });
      const expected = generation;
      return schedule(() => synchronize("refresh", expected));
    },
    refresh() {
      const expected = generation;
      return schedule(() => synchronize("refresh", expected));
    },
    enable() {
      const expected = generation;
      return schedule(() => synchronize("enable", expected));
    },
    disable() {
      const expected = generation;
      return schedule(() => synchronize("disable", expected));
    },
    beforeLogout() {
      const expected = generation;
      return schedule(() => synchronize("logout", expected));
    },
  };
}
