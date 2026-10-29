import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SellerGate } from "@/components/seller-gate";
import { Button, colors, Loading, Message, Screen } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { createScopedRead } from "@/lib/scoped-read";
import {
  agreementLanguages,
  agreementOffset,
  formatAgreementTime,
  parseAgreementArchive,
  type AgreementSelection,
} from "@/lib/seller-agreement";

export default function AgreementScreen() {
  const { account, session, store } = useSession();
  const { d } = useI18n();
  return (
    <SellerGate title={d.agreement.title}>
      {account &&
      account !== "failed" &&
      session &&
      store &&
      account.tenantId === store.id ? (
        <AgreementRead
          key={`${session.user.id}:${account.tenantId}:${account.sellerId}`}
          tenant={account.tenantId}
          seller={account.sellerId}
        />
      ) : null}
    </SellerGate>
  );
}
function AgreementRead({ tenant, seller }: { tenant: string; seller: string }) {
  const { d, locale } = useI18n();
  const { chooseStore } = useSession();
  const t = d.agreement;
  const [selection, setSelection] = useState<AgreementSelection>({
    version: null,
    text: null,
    page: 0,
  });
  const read = useMemo(
    () =>
      createScopedRead(async (signal) => {
        const { data, error } = await supabase
          .rpc("my_seller_agreement_text", {
            p_tenant: tenant,
            p_seller: seller,
            p_version: selection.version,
            p_text: selection.text,
            p_offset: agreementOffset(selection),
          })
          .abortSignal(signal);
        if (error) throw error;
        return parseAgreementArchive(data, selection);
      }),
    [tenant, seller, selection],
  );
  const state = useSyncExternalStore(
    read.subscribe,
    read.getState,
    read.getState,
  );
  useFocusEffect(
    useCallback(() => {
      void read.refresh();
      return read.cancel;
    }, [read]),
  );
  const data = state.data,
    agreement = data?.agreement,
    acceptance = data?.acceptance;
  const versionLabel = (version: number) =>
    t.version.replace("{version}", String(version));
  return (
    <Screen title={t.title}>
      <Button
        label={t.back}
        variant="secondary"
        onPress={() =>
          router.canGoBack() ? router.back() : router.replace("/(tabs)/profile")
        }
      />
      <Button
        label={t.current}
        variant="secondary"
        onPress={() => setSelection({ version: null, text: null, page: 0 })}
      />
      {state.status === "idle" || state.status === "loading" ? (
        <Loading />
      ) : state.status === "failed" ? (
        <>
          <Message tone="error">
            {state.failure === "denied" ? t.denied : t.failed}
          </Message>
          <Button label={d.retry} onPress={() => void read.refresh()} />
          {state.failure === "denied" ? (
            <Button
              label={d.login.changeStore}
              onPress={() => chooseStore(null)}
            />
          ) : null}
        </>
      ) : data ? (
        <>
          {agreement ? (
            <>
              <Text style={styles.note}>
                {data.current ? t.current : t.historical} ·{" "}
                {versionLabel(agreement.version)}
              </Text>
              <Text style={styles.heading} accessibilityRole="header">
                {agreement.title}
              </Text>
              <Text style={styles.text}>
                {t.language}: {agreementLanguages[agreement.language]}
              </Text>
              <View style={styles.languages}>
                {data.languages.map((row) => (
                  <Pressable
                    key={row.id}
                    accessibilityRole="button"
                    accessibilityState={{
                      selected:
                        row.id === (agreement.translationId ?? agreement.id),
                    }}
                    onPress={() =>
                      setSelection({
                        ...selection,
                        version: agreement.id,
                        text: row.id,
                      })
                    }
                    style={({ pressed }) => [
                      styles.language,
                      row.id === (agreement.translationId ?? agreement.id) &&
                        styles.selected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.languageText}>
                      {agreementLanguages[row.language]}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.note}>{t.verbatim}</Text>
              <View style={styles.card}>
                <Text selectable style={styles.body}>
                  {agreement.body}
                </Text>
              </View>
              <View style={styles.card}>
                {acceptance ? (
                  <>
                    <Text style={styles.heading} accessibilityRole="header">
                      {t.accepted}
                    </Text>
                    <Text style={styles.text}>
                      {formatAgreementTime(acceptance.at, locale)}
                    </Text>
                    <Text style={styles.text}>
                      {acceptance.source === "staff_recorded"
                        ? t.staff
                        : t.seller}
                    </Text>
                    {acceptance.language ? (
                      <Text style={styles.text}>
                        {t.acceptanceLanguage}:{" "}
                        {agreementLanguages[acceptance.language]}
                      </Text>
                    ) : null}
                  </>
                ) : (
                  <>
                    <Text style={styles.text}>{t.notAccepted}</Text>
                    {data.current ? (
                      <Text style={styles.note}>{t.readOnly}</Text>
                    ) : null}
                  </>
                )}
              </View>
            </>
          ) : (
            <Message>{selection.version ? t.unavailable : t.missing}</Message>
          )}
          <Text style={styles.heading} accessibilityRole="header">
            {t.history}
          </Text>
          {data.history.length ? (
            data.history.map((row) => (
              <Pressable
                key={row.id}
                accessibilityRole="button"
                accessibilityLabel={`${versionLabel(row.version)}: ${row.title}`}
                onPress={() =>
                  setSelection({ ...selection, version: row.id, text: null })
                }
                style={({ pressed }) => [
                  styles.card,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.rowTitle}>
                  {row.title} · {versionLabel(row.version)}
                </Text>
                <Text style={styles.text}>
                  {formatAgreementTime(row.at, locale)}
                </Text>
                <Text style={styles.note}>
                  {row.source === "staff_recorded" ? t.staff : t.seller}
                </Text>
              </Pressable>
            ))
          ) : (
            <Text style={styles.text}>{t.noHistory}</Text>
          )}
          {data.total > 20 ? (
            <>
              <Text style={styles.note}>
                {t.page
                  .replace("{page}", String(selection.page + 1))
                  .replace("{pages}", String(Math.ceil(data.total / 20)))}
              </Text>
              <Button
                label={t.previous}
                variant="secondary"
                disabled={selection.page === 0}
                onPress={() =>
                  setSelection({ ...selection, page: selection.page - 1 })
                }
              />
              <Button
                label={t.next}
                variant="secondary"
                disabled={
                  (selection.page + 1) * 20 >= data.total ||
                  selection.page >= 100000
                }
                onPress={() =>
                  setSelection({ ...selection, page: selection.page + 1 })
                }
              />
            </>
          ) : null}
          <Button
            label={t.refresh}
            variant="secondary"
            onPress={() => void read.refresh()}
          />
        </>
      ) : null}
    </Screen>
  );
}
const styles = StyleSheet.create({
  card: {
    padding: 16,
    gap: 10,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    minHeight: 48,
  },
  heading: { color: colors.brand, fontWeight: "700", fontSize: 22 },
  rowTitle: { color: colors.brand, fontWeight: "600", fontSize: 17 },
  body: { color: colors.text, fontSize: 17, lineHeight: 27 },
  text: { color: colors.text, fontSize: 16, lineHeight: 24 },
  note: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  languages: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  language: {
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.brand,
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  selected: { backgroundColor: colors.accent, borderWidth: 2 },
  languageText: { color: colors.brand, fontSize: 16, fontWeight: "600" },
  pressed: { opacity: 0.6 },
});
