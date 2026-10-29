import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import * as Crypto from "expo-crypto";
import { PendingDiscard } from "@/components/pending-discard";
import { SellerGate } from "@/components/seller-gate";
import {
  Button,
  uiStyles,
  Choice,
  Field,
  Loading,
  Message,
  Screen,
} from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { createScopedRead } from "@/lib/scoped-read";
import { bankEndpoint, bankWriter, readBank } from "@/lib/bank-account-api";
import { bankCountries } from "@/lib/bank-countries";
import {
  normalizeBankDetails,
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
          key={`${session.user.id}:${account.tenantId}:${account.sellerId}`}
          user={session.user.id}
          tenant={account.tenantId}
          seller={account.sellerId}
        />
      ) : null}
    </SellerGate>
  );
}

function BankAccount({
  user,
  tenant,
  seller,
}: {
  user: string;
  tenant: string;
  seller: string;
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
      return read.cancel;
    }, [read, writer]),
  );
  const refresh = () => {
    void read.refresh();
    void writer.load();
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
      ) : change.status === "ready" ? (
        <BankForm
          key={bank.data?.id ?? "new"}
          current={bank.data}
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
  enabled,
  onSave,
}: {
  current: BankVersion | null;
  enabled: boolean;
  onSave: (details: BankDetails) => void;
}) {
  const { d, locale } = useI18n(),
    t = d.bank;
  const [details, setDetails] = useState<BankDetails>(
    () =>
      current?.details ?? {
        holder: "",
        country: "",
        kind: "local",
        account: "",
        routing: "",
      },
  );
  const [invalid, setInvalid] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false),
    [search, setSearch] = useState("");
  const names = useMemo(() => {
    try {
      return new Intl.DisplayNames([locale], { type: "region" });
    } catch {
      return null;
    }
  }, [locale]);
  const countryName = (code: string) =>
    code ? `${names?.of(code) ?? code} (${code})` : t.chooseCountry;
  const countries = bankCountries.filter((code) =>
    countryName(code)
      .toLocaleLowerCase(locale)
      .includes(search.trim().toLocaleLowerCase(locale)),
  );
  function update(patch: Partial<BankDetails>) {
    setDetails({ ...details, ...patch });
    setInvalid(false);
  }
  return (
    <>
      {!current ? <Message>{t.missing}</Message> : null}
      <Field
        label={t.holder}
        value={details.holder}
        onChangeText={(holder) => update({ holder })}
        maxLength={160}
        editable={enabled}
        autoComplete="off"
      />
      <Text style={styles.label}>{t.country}</Text>
      <Button
        label={countryName(details.country)}
        variant="secondary"
        disabled={!enabled}
        onPress={() => {
          setSearch("");
          setCountryOpen(!countryOpen);
        }}
        accessibilityLabel={`${t.country}: ${countryName(details.country)}`}
        expanded={countryOpen}
      />
      {countryOpen ? (
        <View style={styles.card}>
          <Field
            label={t.countrySearch}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
            maxLength={80}
          />
          {countries.slice(0, 10).map((code) => (
            <Button
              key={code}
              label={countryName(code)}
              variant="secondary"
              onPress={() => {
                update({ country: code });
                setCountryOpen(false);
              }}
            />
          ))}
          {!countries.length ? (
            <Message>{t.noCountries}</Message>
          ) : countries.length > 10 ? (
            <Message>{t.moreCountries}</Message>
          ) : null}
        </View>
      ) : null}
      <Text style={styles.label}>{t.kind}</Text>
      <View style={styles.choices}>
        {(["local", "iban"] as const).map((kind) => (
          <Choice
            key={kind}
            label={t[kind]}
            selected={details.kind === kind}
            disabled={!enabled}
            onPress={() => update({ kind })}
          />
        ))}
      </View>
      <Field
        label={details.kind === "iban" ? t.iban : t.account}
        value={details.account}
        onChangeText={(account) => update({ account })}
        maxLength={100}
        editable={enabled}
        autoCorrect={false}
        autoCapitalize="characters"
        autoComplete="off"
      />
      {details.kind === "local" ? (
        <Field
          label={t.routing}
          value={details.routing}
          onChangeText={(routing) => update({ routing })}
          maxLength={100}
          editable={enabled}
          autoCorrect={false}
          autoComplete="off"
        />
      ) : null}
      {invalid ? <Message tone="error">{t.invalid}</Message> : null}
      {saveFailed ? <Message tone="error">{t.storage}</Message> : null}
      <Button
        label={t.save}
        disabled={!enabled}
        onPress={() => {
          let normalized: BankDetails;
          try {
            normalized = normalizeBankDetails(details);
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
  label: uiStyles.label,
  choices: uiStyles.choices,
});
