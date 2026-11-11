import type { CommandStorage } from "./pending-command.ts";

const SENSITIVE_PREFIXES = [
  "komisio.pending.bank.v1.",
  "komisio.pending.onboarding.v1.",
];
type BrowserStorage = Pick<
  Storage,
  "length" | "key" | "getItem" | "setItem" | "removeItem"
>;

/** Keep replay IDs for payouts/agreements; erase sensitive bank payloads on logout.
 * The guard also prevents a stale mounted writer from recreating them afterwards.
 * Web storage is not encrypted; native commands use SecureStore instead. */
export function createWebCommandStorage(storage: () => BrowserStorage) {
  let user: string | null = null;
  function authorize(key: string) {
    if (
      SENSITIVE_PREFIXES.some(
        (prefix) =>
          key.startsWith(prefix) &&
          (!user || !key.startsWith(`${prefix}${user}.`)),
      )
    )
      throw new Error("STORAGE");
  }
  function setUser(next: string | null) {
    user = null;
    const browser = storage();
    const remove: string[] = [];
    for (let i = 0; i < browser.length; i++) {
      const key = browser.key(i);
      if (
        key &&
        SENSITIVE_PREFIXES.some(
          (prefix) =>
            key.startsWith(prefix) &&
            (!next || !key.startsWith(`${prefix}${next}.`)),
        )
      )
        remove.push(key);
    }
    for (const key of remove) {
      browser.removeItem(key);
      if (browser.getItem(key) !== null) throw new Error("STORAGE");
    }
    user = next;
  }
  const commands: CommandStorage = {
    getItem: async (key) => {
      authorize(key);
      return storage().getItem(key);
    },
    setItem: async (key, value) => {
      authorize(key);
      storage().setItem(key, value);
    },
    removeItem: async (key) => {
      authorize(key);
      storage().removeItem(key);
    },
  };
  return { commands, setUser };
}
