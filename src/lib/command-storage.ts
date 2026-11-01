import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { CommandStorage } from "./pending-command";
import { createWebCommandStorage } from "./web-command-storage";

function webStorage() {
  if (typeof localStorage === "undefined") throw new Error("STORAGE");
  return localStorage;
}

const webCommands = createWebCommandStorage(webStorage);
export function setCommandUser(user: string | null) {
  if (Platform.OS === "web") webCommands.setUser(user);
}

// A journal is one atomic value. Do not use the auth store's chunking: an
// incomplete set of chunks must never be mistaken for no pending command.
// Devices that reject a large value fail before dispatch and remain read-only.
export const commandStorage: CommandStorage =
  Platform.OS === "web"
    ? webCommands.commands
    : {
        getItem: (key) => SecureStore.getItemAsync(key),
        setItem: (key, value) => SecureStore.setItemAsync(key, value),
        removeItem: (key) => SecureStore.deleteItemAsync(key),
      };
