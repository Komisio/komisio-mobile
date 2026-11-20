import { Platform } from "react-native";
import { secureStorage } from "./secure-storage";

export type AppStore = { id: string; name: string; slug: string };
type Preferences = { store: AppStore | null; lastStore: AppStore | null };

function parseStore(value: unknown): AppStore | null {
  const v = value as Partial<AppStore> | null;
  return typeof v?.id === "string" &&
    typeof v.name === "string" &&
    typeof v.slug === "string"
    ? { id: v.id, name: v.name, slug: v.slug }
    : null;
}

function parseJson(raw: string | null) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const filename = "komisio-store-preferences.json";

export async function readStorePreferences(): Promise<Preferences> {
  if (Platform.OS === "ios") {
    // Keychain entries can outlive an uninstall. Only a choice from this
    // app container belongs on its home screen, including on first upgrade.
    const { File, Paths } = await import("expo-file-system");
    const file = new File(Paths.document, filename);
    const saved = file.exists ? parseJson(await file.text()) : null;
    const store = parseStore(saved?.store);
    return { store, lastStore: store ?? parseStore(saved?.lastStore) };
  }
  const [active, previous] = await Promise.all([
    secureStorage.getItem("komisio.store"),
    secureStorage.getItem("komisio.lastStore").catch(() => null),
  ]);
  const store = parseStore(parseJson(active));
  return { store, lastStore: store ?? parseStore(parseJson(previous)) };
}

export async function saveStorePreferences({ store, lastStore }: Preferences) {
  if (Platform.OS === "ios") {
    const { File, Paths } = await import("expo-file-system");
    const pending = new File(Paths.document, filename + ".pending");
    pending.create({ overwrite: true });
    await pending.write(JSON.stringify({ store, lastStore }));
    await pending.move(new File(Paths.document, filename), { overwrite: true });
    return;
  }
  if (store)
    await secureStorage.setItem("komisio.store", JSON.stringify(store));
  else await secureStorage.removeItem("komisio.store");
  if (lastStore)
    await secureStorage.setItem("komisio.lastStore", JSON.stringify(lastStore));
}
