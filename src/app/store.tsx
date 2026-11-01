import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { useSession, type AppStore } from "@/lib/session";
import { LanguagePicker } from "@/components/language-picker";
import {
  Button,
  NavigationRow,
  Field,
  Loading,
  Message,
  Screen,
} from "@/components/ui";

// S01: stores that chose to appear in the app (public_app_stores).
export default function ChooseStore() {
  const { d } = useI18n();
  const { chooseStore } = useSession();
  const [stores, setStores] = useState<AppStore[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!supabaseConfigured) return;
    let current = true;
    supabase.rpc("public_app_stores").then(({ data, error }) => {
      if (!current) return;
      if (error || !Array.isArray(data)) setFailed(true);
      else setStores(data as AppStore[]);
    });
    return () => {
      current = false;
    };
  }, [attempt]);

  const needle = query.trim().toLocaleLowerCase();
  const shown = (stores ?? []).filter((s) =>
    s.name.toLocaleLowerCase().includes(needle),
  );

  return (
    <Screen brand title={d.store.title} intro={d.store.intro}>
      <LanguagePicker />
      {!supabaseConfigured ? (
        <Message tone="error">{d.notConfigured}</Message>
      ) : failed ? (
        <>
          <Message tone="error">{d.store.failed}</Message>
          <Button
            label={d.retry}
            variant="secondary"
            onPress={() => {
              setFailed(false);
              setAttempt((n) => n + 1);
            }}
          />
        </>
      ) : !stores ? (
        <Loading />
      ) : (
        <>
          <Field
            label={d.store.search}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            returnKeyType="search"
          />
          {shown.length === 0 ? <Message>{d.store.empty}</Message> : null}
          <View style={styles.list}>
            {shown.map((s) => (
              <NavigationRow
                key={s.id}
                label={s.name}
                onPress={() => chooseStore(s)}
              />
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({ list: { gap: 8 } });
