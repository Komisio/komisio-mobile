import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import * as Crypto from "expo-crypto";
import { PendingDiscard } from "@/components/pending-discard";
import { SellerGate } from "@/components/seller-gate";
import {
  Button,
  uiStyles,
  Field,
  Loading,
  Message,
  Screen,
} from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { createScopedRead } from "@/lib/scoped-read";
import {
  bankEndpoint,
  bankWriter,
  readBank,
  readBankCountry,
} from "@/lib/bank-account-api";
import {
  localBankFields,
  localBankDetails,
  type LocalBankFields,
  type BankCommand,
  type BankDetails,
  type BankVersion,
} from "@/lib/bank-account";

export default function BankAccountScreen() {
  const { account, session, store } = useSession();
  const { d } = useI18n();
  return (
    <SellerGate title={d.bank.title}>
      {account &&
      account !== "failed" &&
      session &&
      store &&
      account.tenantId === store.id ? (
        <BankAccount
          key={`${session.user.id}:${account.tenantId}:${account.sellerId}:${store.slug}`}
          user={session.user.id}
          tenant={account.tenantId}
          seller={account.sellerId}
          slug={store.slug}
        />
      ) : null}
    </SellerGate>
  );
}

function BankAccount({
  user,
  tenant,
  seller,
  slug,
}: {
  user: string;
  tenant: string;
  seller: string;
  slug: string;
}) {
  const { d } = useI18n(),
    t = d.bank;
  const { chooseStore, signOut, refreshAssurance } = useSession();
  const read = useMemo(
    () => createScopedRead((signal) => readBank(tenant, seller, signal)),
    [tenant, seller],
  );
  const writer = useMemo(
    () => bankWriter(user, tenant, seller),
    [user, tenant, seller],
  );
  const countryRead = useMemo(
    () => createScopedRead((signal) => readBankCountry(slug, signal)),
    [slug],
  );
  const country = useSyncExternalStore(
    countryRead.subscribe,
    countryRead.getState,
    countryRead.getState,
  );
  const bank = useSyncExternalStore(
    read.subscribe,
    read.getState,
    read.getState,
  );
  const change = useSyncExternalStore(
    writer.subscribe,
    writer.getState,
    writer.getState,
  );
  useFocusEffect(
    useCallback(() => {
      void read.refresh();
      void writer.load();
      void countryRead.refresh();
      return () => {
        read.cancel();
        countryRead.cancel();
      };
    }, [read, writer, countryRead]),
  );
  const refresh = () => {
    void read.refresh();
    void writer.load();
    void countryRead.refresh();
  };
  return (
    <Screen title={t.title} intro={t.intro}>
      <Button
        label={t.back}
        variant="secondary"
        onPress={() =>
          router.canGoBack() ? router.back() : router.replace("/(tabs)/profile")
        }
      />
      {!bankEndpoint ? <Message>{t.notConfigured}</Message> : null}
      {change.status === "idle" || change.status === "busy" ? (
        <Loading />
      ) : null}
      {change.status === "pending" || change.status === "cleanup" ? (
        <>
          <Message>
            {change.status === "pending"
              ? t.pending
              : change.code === "success"
                ? t.cleanupSuccess
                : change.code === "rejected"
                  ? t.rejected
                  : t.cleanupConflict}
          </Message>
          {change.command ? (
            <View style={styles.card}>
              <Text style={styles.heading} accessibilityRole="header">
                {t.pendingTitle}
              </Text>
              <BankSummary details={change.command.details} />
            </View>
          ) : null}
          {change.code === "AUTH_REQUIRED" ? (
            <>
              <Message tone="error">{t.auth}</Message>
              <Button label={d.account.logout} onPress={() => void signOut()} />
            </>
          ) : null}
          {change.code === "MFA_REQUIRED" ? (
            <>
              <Message tone="error">{t.mfa}</Message>
              <Button
                label={t.verify}
                onPress={() => void refreshAssurance()}
              />
            </>
          ) : null}
          {change.code === "PASSWORD_UPDATE_REQUIRED" ? (
            <>
              <Message tone="error">{t.recovery}</Message>
              <Button label={d.account.logout} onPress={() => void signOut()} />
            </>
          ) : null}
          <Button
            label={change.status === "cleanup" ? t.finish : t.retrySame}
            disabled={!bankEndpoint && change.status === "pending"}
            onPress={() => void writer.retry()}
          />
          {change.status === "pending" && change.command ? (
            <PendingDiscard
              key={change.command.requestId}
              onDiscard={() => void writer.discard()}
            />
          ) : null}
        </>
      ) : null}
      {change.status === "blocked" ? (
        <>
          <Message tone="error">
            {change.code === "BUSY"
              ? t.busy
              : change.code === "UNSUPPORTED"
                ? t.unsupported
                : t.storage}
          </Message>
          <Button label={d.retry} onPress={() => void writer.load()} />
        </>
      ) : null}
      {change.status === "success" || change.status === "conflict" ? (
        <>
          <Message>{change.status === "success" ? t.saved : t.changed}</Message>
          <Button label={t.refresh} onPress={refresh} />
        </>
      ) : null}
      {change.status === "rejected" || change.status === "discarded" ? (
        <>
          <Message>
            {change.status === "rejected" ? t.rejected : t.discarded}
          </Message>
          <Button label={t.refresh} onPress={refresh} />
        </>
      ) : null}
      {bank.status === "idle" || bank.status === "loading" ? (
        <Loading />
      ) : bank.status === "failed" ? (
        <>
          <Message tone="error">
            {bank.failure === "denied" ? t.denied : t.failed}
          </Message>
          <Button label={d.retry} onPress={() => void read.refresh()} />
          {bank.failure === "denied" ? (
            <Button
              label={d.login.changeStore}
              onPress={() => chooseStore(null)}
            />
          ) : null}
        </>
      ) : change.status === "ready" &&
        (country.status === "idle" || country.status === "loading") ? (
        <Loading />
      ) : change.status === "ready" &&
        (country.status !== "ready" || !country.data) ? (
        <>
          {bank.data ? <BankSummary details={bank.data.details} /> : null}
          <Message tone="error">
            {country.status === "failed" ? t.countryFailed : t.countryMissing}
          </Message>
          <Button label={d.retry} onPress={() => void countryRead.refresh()} />
        </>
      ) : change.status === "ready" && country.data ? (
        <BankForm
          key={`${bank.data?.id ?? "new"}:${country.data}`}
          current={bank.data}
          country={country.data}
          enabled={Boolean(bankEndpoint)}
          onSave={(details) => {
            const command: BankCommand = {
              action: "saveBank",
              tenantId: tenant,
              sellerId: seller,
              requestId: Crypto.randomUUID(),
              expected: bank.data?.id ?? null,
              details,
            };
            void writer.submit(command);
          }}
        />
      ) : null}
    </Screen>
  );
}

function BankSummary({ details }: { details: BankDetails }) {
  const { d } = useI18n(),
    t = d.bank;
  return (
    <>
      <Text style={styles.text}>
        {t.holder}: {details.holder}
      </Text>
      <Text style={styles.text}>
        {t.country}: {details.country}
      </Text>
      <Text style={styles.text}>
        {details.kind === "iban" ? t.iban : t.local}: {details.account}
      </Text>
      {details.routing ? (
        <Text style={styles.text}>
          {t.routing}: {details.routing}
        </Text>
      ) : null}
    </>
  );
}

function BankForm({
  current,
  country,
  enabled,
  onSave,
}: {
  current: BankVersion | null;
  country: string;
  enabled: boolean;
  onSave: (details: BankDetails) => void;
}) {
  const { d } = useI18n(),
    t = d.bank;
  const [details, setDetails] = useState(() =>
    localBankFields(current, country),
  );
  const replacing =
    current &&
    (current.details.kind !== "local" || current.details.country !== country);
  const [invalid, setInvalid] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  function update(patch: Partial<LocalBankFields>) {
    setDetails({ ...details, ...patch });
    setInvalid(false);
  }
  return (
    <>
      {!current ? <Message>{t.missing}</Message> : null}
      {replacing ? (
        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.heading}>
            {t.currentAccount}
          </Text>
          <BankSummary details={current.details} />
          <Message>{t.replaceLocal}</Message>
        </View>
      ) : null}
      <Field
        label={t.holder}
        value={details.holder}
        onChangeText={(holder) => update({ holder })}
        maxLength={160}
        editable={enabled}
        autoComplete="off"
      />
      <Field
        label={t.routing}
        value={details.routing}
        onChangeText={(routing) => update({ routing })}
        maxLength={100}
        editable={enabled}
        autoCorrect={false}
        autoComplete="off"
      />
      <Field
        label={t.account}
        value={details.account}
        onChangeText={(account) => update({ account })}
        maxLength={100}
        editable={enabled}
        autoCorrect={false}
        autoCapitalize="characters"
        autoComplete="off"
      />
      {invalid ? <Message tone="error">{t.invalid}</Message> : null}
      {saveFailed ? <Message tone="error">{t.storage}</Message> : null}
      <Button
        label={t.save}
        disabled={!enabled}
        onPress={() => {
          let normalized: BankDetails;
          try {
            normalized = localBankDetails(details, country);
          } catch {
            setInvalid(true);
            return;
          }
          try {
            setSaveFailed(false);
            onSave(normalized);
          } catch {
            setSaveFailed(true);
          }
        }}
      />
    </>
  );
}
const styles = StyleSheet.create({
  card: uiStyles.card,
  heading: uiStyles.heading,
  text: uiStyles.body,
});
