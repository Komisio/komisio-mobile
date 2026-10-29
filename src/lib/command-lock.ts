import { Platform } from "react-native";
import type { CommandLock } from "./pending-command";

const held = new Set<string>();
export const commandLock: CommandLock = async (key, work) => {
  if (Platform.OS === "web") {
    if (typeof navigator === "undefined" || !navigator.locks)
      throw new Error("UNSUPPORTED");
    return navigator.locks.request(
      key,
      { mode: "exclusive", ifAvailable: true },
      async (lock) => {
        if (!lock) throw new Error("BUSY");
        return work();
      },
    );
  }
  // One JS runtime on native; shared across every mounted account screen.
  if (held.has(key)) throw new Error("BUSY");
  held.add(key);
  try {
    return await work();
  } finally {
    held.delete(key);
  }
};
