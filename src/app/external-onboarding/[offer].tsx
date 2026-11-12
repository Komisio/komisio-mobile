import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { Text, View } from "react-native";
import {
  Stack,
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import { randomUUID } from "expo-crypto";
import {
  Button,
  Card,
  Choice,
  Field,
  Loading,
  Message,
  Screen,
  StatusBadge,
  colors,
  uiStyles,
} from "@/components/ui";
import { ExternalItemPhoto } from "@/components/external-item-photo";
import { CentralShipping } from "@/components/central-shipping";
import { centralShippingCopy } from "@/lib/central-shipping-copy";
import { useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { hasVerifiedEmail, hasVerifiedPhone } from "@/lib/identity-gates";
import { emailLoginCopy } from "@/lib/email-login-copy";
import { isId } from "@/lib/catalogue";
import { createScopedRead } from "@/lib/scoped-read";
import {
  externalOnboardingWriter,
  readExternalOnboarding,
} from "@/lib/external-onboarding-runtime";
import { externalOnboardingCopy } from "@/lib/external-onboarding-copy";
import { externalOfferCopy } from "@/lib/external-offer-copy";
import { localBankDetails } from "@/lib/bank-account";
import {
  parseCompleteExternalOffer,
  type CompleteExternalOffer,
  type ExternalOnboarding,
} from "@/lib/external-onboarding";
import { offerAmount, type ExternalOfferDetail } from "@/lib/external-offer";
import { externalHandoverCopy } from "@/lib/external-handover-copy";
import { formattingLocale } from "@/lib/locale";

export default function ExternalOnboardingScreen() {
  const { offer } = useLocalSearchParams<{ offer: string }>();
  const { session } = useSession();
  const { locale } = useI18n();
  if (!session || !hasVerifiedPhone(session.user) || !isId(offer))
    return (
      <Screen topSafeArea={false}>
        <Message>{externalOfferCopy(locale).loadError}</Message>
      </Screen>
    );
  return (
    <Onboarding
      key={`${session.user.id}:${offer}`}
      user={session.user.id}
      id={offer}
    />
  );
}
function Onboarding({ user, id }: { user: string; id: string }) {
  const { locale, d } = useI18n(),
    t = externalOnboardingCopy(locale),
    o = externalOfferCopy(locale);
  const { refreshAssurance, session } = useSession();
  const read = useMemo(
    () =>
      createScopedRead(async () => {
        try {
          return await readExternalOnboarding(user, id);
        } catch (e) {
          if (
            e instanceof Error &&
            [
              "AUTH_REQUIRED",
              "MFA_REQUIRED",
              "PASSWORD_UPDATE_REQUIRED",
            ].includes(e.message)
          )
            void refreshAssurance();
          throw e;
        }
      }),
    [user, id, refreshAssurance],
  );
  const writer = useMemo(() => externalOnboardingWriter(user, id), [user, id]);
  const state = useSyncExternalStore(
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
      return () => read.cancel();
    }, [read, writer]),
  );
  async function finish(work: Promise<void>) {
    await work;
    const c = writer.getState();
    if (["success", "conflict"].includes(c.status)) void read.refresh();
    if (
      ["AUTH_REQUIRED", "MFA_REQUIRED", "PASSWORD_UPDATE_REQUIRED"].includes(
        c.code ?? "",
      )
    )
      void refreshAssurance();
  }
  const data = state.data,
    pending = ["pending", "cleanup", "blocked"].includes(change.status),
    busy = change.status === "busy";
  const ready = [
    "ready",
    "success",
    "conflict",
    "rejected",
    "discarded",
  ].includes(change.status);
  return (
    <Screen
      topSafeArea={false}
      refresh={{
        refreshing: state.status === "loading",
        onRefresh: () => void read.refresh(),
        label: d.retry,
      }}
    >
      <Stack.Screen
        options={{
          title: data?.account.handover
            ? centralShippingCopy(locale).title
            : t.title,
        }}
      />
      {state.status === "failed" ? (
        <>
          <Message tone="error">{o.loadError}</Message>
          <Button label={d.retry} onPress={() => void read.refresh()} />
        </>
      ) : !data ? (
        <Loading />
      ) : null}
      {pending ? (
        <>
          <Message>{d.bank.pending}</Message>
          <Button
            label={d.retry}
            busy={busy}
            onPress={() => void finish(writer.retry())}
          />
        </>
      ) : null}
      {change.status === "rejected" ? (
        <Message tone="error">{d.bank.rejected}</Message>
      ) : null}
      {change.status === "conflict" ? <Message>{o.changed}</Message> : null}
      {data?.account.handover ? (
        <Handover data={data.account} offer={data.offer} user={user} />
      ) : data ? (
        data.offer.canAccept || data.offer.status === "accepted" ? (
          <AccountForm
            key={data.account.account?.id ?? "new"}
            data={data.account}
            offer={data.offer}
            disabled={!ready || pending}
            busy={busy}
            onSubmit={(command) => void finish(writer.submit(command))}
          />
        ) : (
          <Message>
            {data.offer.status === "expired" ? o.expired : o.changed}
          </Message>
        )
      ) : null}
      {data?.account.account &&
      data.account.handover &&
      !hasVerifiedEmail(session?.user) ? (
        <Button
          label={emailLoginCopy(locale).title}
          variant="secondary"
          onPress={() =>
            router.push({
              pathname: "/email-login",
              params: { email: data.account.account!.email },
            })
          }
        />
      ) : null}
      <Button
        label={o.back}
        variant="text"
        onPress={() => router.dismissTo("/external-items")}
      />
    </Screen>
  );
}
function AccountForm({
  data,
  offer,
  disabled,
  busy,
  onSubmit,
}: {
  data: ExternalOnboarding;
  offer: ExternalOfferDetail;
  disabled: boolean;
  busy: boolean;
  onSubmit: (command: CompleteExternalOffer) => void;
}) {
  const { locale, d } = useI18n(),
    t = externalOnboardingCopy(locale),
    o = externalOfferCopy(locale);
  const existing = !!data.account;
  const [step, setStep] = useState(existing ? 2 : 0),
    [name, setName] = useState(""),
    [email, setEmail] = useState("");
  const [holder, setHolder] = useState(""),
    [routing, setRouting] = useState(""),
    [account, setAccount] = useState(""),
    [agreed, setAgreed] = useState(false),
    [error, setError] = useState("");
  const profile = () => ({
    name: name.trim(),
    email: email.trim().toLowerCase(),
  });
  const bank = () => localBankDetails({ holder, routing, account }, "SE");
  function advance() {
    setError("");
    if (step === 0) {
      const p = profile();
      if (!p.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) {
        setError(t.invalid);
        return;
      }
      if (!holder) setHolder(p.name);
      setStep(1);
    } else {
      try {
        const b = bank();
        if (!b.routing.trim()) throw Error();
        setStep(2);
      } catch {
        setError(d.bank.invalid);
      }
    }
  }
  function submit() {
    if (disabled || busy || !agreed) return;
    try {
      onSubmit(
        parseCompleteExternalOffer(
          {
            action: "complete",
            requestId: randomUUID(),
            offerId: offer.id,
            agreementVersionId: offer.agreementVersionId,
            profile: existing ? null : profile(),
            bank: existing ? null : bank(),
          },
          offer.id,
        ),
      );
    } catch {
      setError(d.bank.invalid);
    }
  }
  return (
    <>
      <Text accessibilityRole="header" style={uiStyles.heading}>
        {existing ? t.saved : t.heading}
      </Text>
      {!existing ? (
        <>
          <Text style={uiStyles.note}>{t.intro}</Text>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {[t.about, t.bank, t.agreement].map((label, i) => (
              <View key={label} style={{ flex: 1, gap: 6 }}>
                <View
                  style={{
                    height: 3,
                    backgroundColor: i <= step ? colors.brand : colors.line,
                    borderRadius: 2,
                  }}
                />
                <Text style={uiStyles.note}>{label}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}
      {step === 0 ? (
        <>
          <Card>
            <Text style={uiStyles.label}>{t.phone}</Text>
            <Text selectable style={uiStyles.body}>
              +{data.phone.replace(/^\+/, "")}
            </Text>
            <StatusBadge>{t.verified}</StatusBadge>
          </Card>
          <Field
            label={t.name}
            value={name}
            onChangeText={setName}
            autoComplete="name"
            maxLength={120}
            editable={!disabled && !busy}
          />
          <Field
            label={t.email}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={254}
            editable={!disabled && !busy}
          />
        </>
      ) : step === 1 ? (
        <>
          <Field
            label={d.bank.holder}
            value={holder}
            onChangeText={setHolder}
            maxLength={160}
            editable={!disabled && !busy}
          />
          <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
            <View style={{ flex: 1, minWidth: 110 }}>
              <Field
                label={t.routing}
                value={routing}
                onChangeText={setRouting}
                keyboardType="number-pad"
                maxLength={100}
                editable={!disabled && !busy}
              />
            </View>
            <View style={{ flex: 2, minWidth: 160 }}>
              <Field
                label={d.bank.account}
                value={account}
                onChangeText={setAccount}
                keyboardType="number-pad"
                maxLength={100}
                editable={!disabled && !busy}
              />
            </View>
          </View>
        </>
      ) : (
        <Card>
          <Text accessibilityRole="header" style={uiStyles.heading}>
            {offer.agreement.title}
          </Text>
          <Text style={uiStyles.note}>
            {d.agreement.version.replace(
              "{version}",
              String(offer.agreement.version),
            )}
          </Text>
          <Text selectable style={uiStyles.body}>
            {offer.agreement.body}
          </Text>
          <Choice
            role="checkbox"
            listRow
            label={o.agree}
            selected={agreed}
            disabled={disabled || busy}
            onPress={() => setAgreed((v) => !v)}
          />
        </Card>
      )}
      {error ? <Message tone="error">{error}</Message> : null}
      <Button
        label={step === 2 ? t.finish : step === 1 ? t.toAgreement : t.next}
        disabled={disabled || (step === 2 && !agreed)}
        busy={busy}
        onPress={step === 2 ? submit : advance}
      />
      {!existing && step > 0 ? (
        <Button
          label={d.bank.back}
          variant="text"
          disabled={disabled || busy}
          onPress={() => {
            setError("");
            setStep((s) => s - 1);
          }}
        />
      ) : null}
    </>
  );
}
function Handover({
  data,
  offer,
  user,
}: {
  data: ExternalOnboarding;
  offer: ExternalOfferDetail;
  user: string;
}) {
  const { locale } = useI18n(),
    t = externalOnboardingCopy(locale),
    h = data.handover!;
  return (
    <>
      <Text accessibilityRole="header" style={uiStyles.heading}>
        {h.status === "received"
          ? t.received
          : h.status === "cancelled"
            ? t.cancelled
            : centralShippingCopy(locale).title}
      </Text>
      {h.status === "received" &&
      offer.guarantee &&
      !offer.guarantee.creditedAt ? (
        <Card>
          <Text style={uiStyles.label}>
            {h.items.find((item) => item.offerId === offer.id)?.description}
          </Text>
          <Text style={uiStyles.body}>
            {externalHandoverCopy(locale)
              .due.replace(
                "{amount}",
                offerAmount(
                  offer.guarantee.amountOre,
                  formattingLocale(locale),
                ),
              )
              .replace(
                "{date}",
                new Intl.DateTimeFormat(formattingLocale(locale), {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  timeZone: "Europe/Stockholm",
                }).format(new Date(offer.guarantee.dueAt)),
              )}
          </Text>
        </Card>
      ) : null}
      <Card>
        <Text style={uiStyles.label}>
          {h.itemCount === 1
            ? t.single
            : t.grouped.replace("{count}", String(h.itemCount))}
        </Text>
        {h.items.map((i) => (
          <View
            key={i.offerId}
            style={{ flexDirection: "row", gap: 12, alignItems: "center" }}
          >
            <ExternalItemPhoto
              owner={user}
              photo={i.photoId}
              label={i.description}
            />
            <View style={{ flex: 1 }}>
              <Text style={uiStyles.itemName}>{i.description}</Text>
              {i.brand ? <Text style={uiStyles.note}>{i.brand}</Text> : null}
            </View>
          </View>
        ))}
      </Card>
      {h.status === "open" ? (
        <CentralShipping user={user} offer={offer.id} itemCount={h.itemCount} />
      ) : null}
    </>
  );
}
export { ExternalFlowError as ErrorBoundary } from "@/components/external-flow-error";
