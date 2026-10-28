import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// The auth session holds a refresh token, so on phones it lives in the
// Keychain/Keystore. SecureStore values should stay small, so long values are
// split into chunks. Web has no secure store; it is only used in development.
const CHUNK = 1800;

async function read(key: string) {
  const count = Number(await SecureStore.getItemAsync(`${key}.n`));
  if (!count) return SecureStore.getItemAsync(key);
  const parts = await Promise.all(
    Array.from({ length: count }, (_, i) =>
      SecureStore.getItemAsync(`${key}.${i}`),
    ),
  );
  return parts.some((p) => p === null) ? null : parts.join("");
}

async function remove(key: string) {
  const count = Number(await SecureStore.getItemAsync(`${key}.n`));
  await Promise.all([
    SecureStore.deleteItemAsync(key),
    SecureStore.deleteItemAsync(`${key}.n`),
    ...Array.from({ length: count || 0 }, (_, i) =>
      SecureStore.deleteItemAsync(`${key}.${i}`),
    ),
  ]);
}

async function write(key: string, value: string) {
  await remove(key);
  if (value.length <= CHUNK) return SecureStore.setItemAsync(key, value);
  const parts = value.match(new RegExp(`.{1,${CHUNK}}`, "gs")) ?? [];
  await Promise.all(
    parts.map((p, i) => SecureStore.setItemAsync(`${key}.${i}`, p)),
  );
  await SecureStore.setItemAsync(`${key}.n`, String(parts.length));
}

export const secureStorage =
  Platform.OS === "web"
    ? {
        getItem: async (key: string) =>
          typeof localStorage === "undefined" ? null : localStorage.getItem(key),
        setItem: async (key: string, value: string) => {
          if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
        },
        removeItem: async (key: string) => {
          if (typeof localStorage !== "undefined") localStorage.removeItem(key);
        },
      }
    : { getItem: read, setItem: write, removeItem: remove };
