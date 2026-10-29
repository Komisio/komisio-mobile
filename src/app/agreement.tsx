import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import * as Crypto from "expo-crypto";
import { PendingDiscard } from "@/components/pending-discard";
import { SellerGate } from "@/components/seller-gate";
import {
  Button,
  Choice,
  ItemCard,
  uiStyles,
  Loading,
  Message,
  Screen,
} from "@/components/ui";
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
    <SellerGate topSafeArea={false} title={d.agreement.title}>
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
    <Screen topSafeArea={false} title={t.title}>
      {selection.version || selection.text || selection.page > 0 ? (
        <Button
          label={t.current}
          variant="secondary"
          onPress={() => setSelection({ version: null, text: null, page: 0 })}
        />
      ) : null}
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
                : change.code === "rejected"
                  ? d.bank.rejected
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
          {change.status === "pending" && change.command ? (
            <PendingDiscard
              key={change.command.command.requestId}
              onDiscard={() => void writer.discard()}
            />
          ) : null}
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
      {change.status === "rejected" || change.status === "discarded" ? (
        <>
          <Message>
            {change.status === "rejected" ? d.bank.rejected : d.bank.discarded}
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
              {data.languages.length > 1 ? (
                <View style={styles.languages}>
                  {data.languages.map((row) => (
                    <Choice
                      key={row.id}
                      label={agreementLanguages[row.language]}
                      selected={
                        row.id === (agreement.translationId ?? agreement.id)
                      }
                      onPress={() =>
                        setSelection({
                          ...selection,
                          version: agreement.id,
                          text: row.id,
                        })
                      }
                    />
                  ))}
                </View>
              ) : null}
              <Text style={styles.note}>
                {data.languages.length > 1 ? t.verbatim : t.asPublished}
              </Text>
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
              <ItemCard
                key={row.id}
                label={`${versionLabel(row.version)}: ${row.title}`}
                onPress={() =>
                  setSelection({ ...selection, version: row.id, text: null })
                }
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
              </ItemCard>
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
      <Choice
        role="checkbox"
        label={label}
        selected={checked}
        onPress={() => setChecked(!checked)}
      />
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
  card: uiStyles.card,
  heading: uiStyles.heading,
  rowTitle: uiStyles.rowTitle,
  body: { ...uiStyles.body, fontSize: 17, lineHeight: 27 },
  text: uiStyles.body,
  note: uiStyles.note,
  languages: uiStyles.choices,
});
