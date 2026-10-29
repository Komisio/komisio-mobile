import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import * as Crypto from "expo-crypto";
import { SellerGate } from "@/components/seller-gate";
import { Button, colors, Loading, Message, Screen } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { createScopedRead } from "@/lib/scoped-read";
import {
  agreementEndpoint,
  agreementWriter,
} from "@/lib/agreement-command-api";
import { agreementIntent } from "@/lib/agreement-command";
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
          user={session.user.id}
          tenant={account.tenantId}
          seller={account.sellerId}
        />
      ) : null}
    </SellerGate>
  );
}
function AgreementRead({
  user,
  tenant,
  seller,
}: {
  user: string;
  tenant: string;
  seller: string;
}) {
  const { d, locale } = useI18n();
  const { chooseStore, signOut, refreshAssurance } = useSession();
  const t = d.agreement;
  const a = d.agreementAccept;
  const writer = useMemo(
    () => agreementWriter(user, tenant, seller),
    [user, tenant, seller],
  );
  const change = useSyncExternalStore(
    writer.subscribe,
    writer.getState,
    writer.getState,
  );
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
      void writer.load();
      return read.cancel;
    }, [read, writer]),
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
      {!agreementEndpoint ? <Message>{a.unavailable}</Message> : null}
      {change.status === "idle" || change.status === "busy" ? (
        <Loading />
      ) : null}
      {change.status === "pending" || change.status === "cleanup" ? (
        <>
          <Message>
            {change.status === "pending"
              ? a.pending
              : change.code === "success"
                ? a.cleanupSuccess
                : a.cleanupConflict}
          </Message>
          {change.command ? (
            <View style={styles.card}>
              <Text style={styles.text}>
                {a.pendingDocument
                  .replace("{version}", String(change.command.document.version))
                  .replace(
                    "{language}",
                    agreementLanguages[change.command.document.language],
                  )
                  .replace("{title}", change.command.document.title)}
              </Text>
              <Button
                label={a.viewPending}
                variant="secondary"
                onPress={() => {
                  const pending = change.command!;
                  setSelection({
                    version: pending.command.agreementId,
                    text:
                      pending.command.translationId ??
                      pending.command.agreementId,
                    page: 0,
                  });
                }}
              />
            </View>
          ) : null}
          {change.code === "AUTH_REQUIRED" ||
          change.code === "PASSWORD_UPDATE_REQUIRED" ? (
            <>
              <Message tone="error">
                {change.code === "AUTH_REQUIRED"
                  ? d.bank.auth
                  : d.bank.recovery}
              </Message>
              <Button label={d.account.logout} onPress={() => void signOut()} />
            </>
          ) : null}
          {change.code === "MFA_REQUIRED" ? (
            <>
              <Message tone="error">{d.bank.mfa}</Message>
              <Button
                label={d.bank.verify}
                onPress={() => void refreshAssurance()}
              />
            </>
          ) : null}
          <Button
            label={change.status === "cleanup" ? a.finish : a.retrySame}
            disabled={!agreementEndpoint && change.status === "pending"}
            onPress={() => void writer.retry()}
          />
        </>
      ) : null}
      {change.status === "blocked" ? (
        <>
          <Message tone="error">
            {change.code === "BUSY"
              ? d.bank.busy
              : change.code === "UNSUPPORTED"
                ? a.unsupported
                : d.bank.storage}
          </Message>
          <Button label={d.retry} onPress={() => void writer.load()} />
        </>
      ) : null}
      {change.status === "success" || change.status === "conflict" ? (
        <>
          <Message>
            {change.status === "success" ? a.registered : a.changed}
          </Message>
          <Button
            label={a.refresh}
            onPress={() => setSelection({ version: null, text: null, page: 0 })}
          />
        </>
      ) : null}
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
                    {data.current &&
                    change.status === "ready" &&
                    agreementEndpoint ? (
                      <AcceptanceForm
                        key={`${agreement.id}:${agreement.translationId ?? agreement.id}`}
                        title={agreement.title}
                        version={agreement.version}
                        language={agreementLanguages[agreement.language]}
                        onAccept={() =>
                          void writer.submit(
                            agreementIntent(
                              data,
                              tenant,
                              seller,
                              Crypto.randomUUID(),
                            ),
                          )
                        }
                      />
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
function AcceptanceForm({
  title,
  version,
  language,
  onAccept,
}: {
  title: string;
  version: number;
  language: string;
  onAccept: () => void;
}) {
  const { d } = useI18n();
  const [checked, setChecked] = useState(false);
  const [failed, setFailed] = useState(false);
  const label = d.agreementAccept.confirm
    .replace("{version}", String(version))
    .replace("{language}", language)
    .replace("{title}", title);
  return (
    <>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={label}
        accessibilityState={{ checked }}
        style={[styles.language, checked && styles.selected]}
        onPress={() => setChecked(!checked)}
      >
        <Text style={styles.text}>
          {checked ? "☑" : "☐"} {label}
        </Text>
      </Pressable>
      {failed ? <Message tone="error">{d.bank.storage}</Message> : null}
      <Button
        label={d.agreementAccept.accept}
        disabled={!checked}
        onPress={() => {
          try {
            setFailed(false);
            onAccept();
          } catch {
            setFailed(true);
          }
        }}
      />
    </>
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
