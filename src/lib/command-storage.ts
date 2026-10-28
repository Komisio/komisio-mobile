import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { CommandStorage } from "./pending-command";

function webStorage() {
  if (typeof localStorage === "undefined") throw new Error("STORAGE");
  return localStorage;
}

// A journal is one atomic value. Do not use the auth store's chunking: an
// incomplete set of chunks must never be mistaken for no pending command.
// Devices that reject a large value fail before dispatch and remain read-only.
export const commandStorage: CommandStorage =
  Platform.OS === "web"
    ? {
        getItem: async (key) => webStorage().getItem(key),
        setItem: async (key, value) => webStorage().setItem(key, value),
        removeItem: async (key) => webStorage().removeItem(key),
      }
    : {
        getItem: (key) => SecureStore.getItemAsync(key),
        setItem: (key, value) => SecureStore.setItemAsync(key, value),
        removeItem: (key) => SecureStore.deleteItemAsync(key),
      };
