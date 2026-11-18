import {
  useCallback,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Text } from "react-native";
import { useFocusEffect } from "expo-router";
import { randomUUID } from "expo-crypto";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { createScopedRead } from "@/lib/scoped-read";
import {
  readIntakeProfile,
  intakeProfileWriter,
} from "@/lib/central-intake-profile-runtime";
import {
  parseSaveIntakeProfile,
  type IntakeProfile,
} from "@/lib/central-intake-profile";
import { fixedIntakeCopy } from "@/lib/fixed-intake-copy";
import { shippingAddressCopy } from "@/lib/shipping-address-copy";
import { centralShippingCopy } from "@/lib/central-shipping-copy";
import { externalSubmissionCopy } from "@/lib/external-submission-copy";
import { phoneEntryValue } from "@/lib/phone-entry";
import { OfferAgreementLink } from "./offer-agreement-link";
import { Button, Card, Choice, Field, Loading, Message, uiStyles } from "./ui";

type Props = {
  user: string;
  tenant: string;
  disabled: boolean;
  onSubmit: (agreement: string) => Promise<void>;
};
export function CentralIntakeSetup(props: Props) {
  const { locale, d } = useI18n(),
    t = fixedIntakeCopy(locale);
  const { refreshAssurance } = useSession();
  const read = useMemo(
    () =>
      createScopedRead(async () => {
        try {
          return await readIntakeProfile(props.user);
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
    [props.user, refreshAssurance],
  );
  const state = useSyncExternalStore(
    read.subscribe,
    read.getState,
    read.getState,
  );
  useFocusEffect(
    useCallback(() => {
      void read.refresh();
      return () => read.cancel();
    }, [read]),
  );
  if (state.status === "failed")
    return (
      <Card>
        <Message tone="error">
          {externalSubmissionCopy(locale).sendError}
        </Message>
        <Button label={d.retry} onPress={() => void read.refresh()} />
      </Card>
    );
  if (!state.data) return <Loading />;
  if (state.data.tenantId !== props.tenant)
    return <Message tone="error">{t.changed}</Message>;
  return (
    <IntakeEditor
      key={`${props.user}:${props.tenant}:${state.data.agreement.id}:${state.data.account?.revision ?? -1}`}
      {...props}
      data={state.data}
      refresh={() => void read.refresh()}
    />
  );
}
function IntakeEditor({
  user,
  tenant,
  data,
  disabled,
  onSubmit,
  refresh,
}: Props & { data: IntakeProfile; refresh: () => void }) {
  const { locale, d } = useI18n(),
    t = fixedIntakeCopy(locale),
    a = shippingAddressCopy(locale),
    s = centralShippingCopy(locale);
  const { refreshAssurance } = useSession();
  const account = data.account;
  const [editing, setEditing] = useState(!account?.address || !account.contact);
  const [firstName, setFirstName] = useState(account?.contact?.firstName ?? "");
  const [lastName, setLastName] = useState(account?.contact?.lastName ?? "");
  const [phone, setPhone] = useState(account?.contact?.phone ?? "");
  const [street, setStreet] = useState(account?.address?.street ?? "");
  const [postalCode, setPostalCode] = useState(
    account?.address?.postalCode ?? "",
  );
  const [city, setCity] = useState(account?.address?.city ?? "");
  const [accepted, setAccepted] = useState(data.agreementAccepted);
  const [error, setError] = useState(""),
    [sending, setSending] = useState(false);
  const active = useRef(false),
    locked = useRef(false);
  const writer = useMemo(
    () => intakeProfileWriter(user, tenant),
    [user, tenant],
  );
  const state = useSyncExternalStore(
    writer.subscribe,
    writer.getState,
    writer.getState,
  );
  useFocusEffect(
    useCallback(() => {
      active.current = true;
      void writer.load();
      return () => {
        active.current = false;
      };
    }, [writer]),
  );
  const pending = ["pending", "blocked", "cleanup"].includes(state.status);
  const busy = disabled || sending || state.status === "busy";
  async function submit(retry = false) {
    if (locked.current || disabled) return;
    locked.current = true;
    setSending(true);
    setError("");
    try {
      const agreement = retry
        ? writer.getState().command?.agreementVersionId
        : data.agreement.id;
      if (retry) await writer.retry();
      else if (editing || !data.agreementAccepted) {
        if (!accepted) {
          setError(t.consent);
          return;
        }
        let command;
        try {
          command = parseSaveIntakeProfile(
            {
              action: "save",
              requestId: randomUUID(),
              tenantId: tenant,
              agreementVersionId: data.agreement.id,
              expectedRevision: account?.revision ?? -1,
              address: {
                street: street.trim(),
                postalCode: postalCode.replace(/\s/g, ""),
                city: city.trim(),
              },
              contact: {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                phone: phoneEntryValue({ callingCode: "+46", number: phone }),
              },
              acceptAgreement: !data.agreementAccepted && accepted,
            },
            tenant,
          );
        } catch {
          setError(t.invalid);
          return;
        }
        await writer.submit(command);
      } else {
        if (active.current) await onSubmit(data.agreement.id);
        return;
      }
      if (!active.current) return;
      const result = writer.getState();
      if (result.status === "success") {
        if (agreement === data.agreement.id) await onSubmit(data.agreement.id);
        if (active.current) refresh();
      } else if (
        ["AUTH_REQUIRED", "MFA_REQUIRED", "PASSWORD_UPDATE_REQUIRED"].includes(
          result.code ?? "",
        )
      )
        await refreshAssurance();
    } finally {
      locked.current = false;
      if (active.current) setSending(false);
    }
  }
  if (state.status === "idle") return <Loading />;
  if (state.status === "conflict")
    return (
      <Card>
        <Message>{t.changed}</Message>
        <Button label={d.retry} onPress={refresh} />
      </Card>
    );
  if (pending)
    return (
      <Card>
        <Message>{a.pending}</Message>
        <Button label={d.retry} busy={busy} onPress={() => void submit(true)} />
      </Card>
    );
  return (
    <>
      <Card>
        <Text accessibilityRole="header" style={uiStyles.heading}>
          {t.title}
        </Text>
        {editing ? (
          <>
            <Text style={uiStyles.note}>{t.hint}</Text>
            <Field
              label={a.firstName}
              value={firstName}
              onChangeText={setFirstName}
              editable={!busy}
              autoComplete="given-name"
              textContentType="givenName"
              autoCapitalize="words"
              maxLength={58}
            />
            <Field
              label={a.lastName}
              value={lastName}
              onChangeText={setLastName}
              editable={!busy}
              autoComplete="family-name"
              textContentType="familyName"
              autoCapitalize="words"
              maxLength={58}
            />
            <Field
              label={a.phone}
              value={phone}
              onChangeText={setPhone}
              editable={!busy}
              autoComplete="tel"
              textContentType="telephoneNumber"
              keyboardType="phone-pad"
              placeholder="070 123 45 67"
              maxLength={30}
            />
            <Field
              label={s.street}
              value={street}
              onChangeText={setStreet}
              editable={!busy}
              autoComplete="street-address"
              textContentType="fullStreetAddress"
              maxLength={50}
            />
            <Field
              label={s.postalCode}
              value={postalCode}
              onChangeText={setPostalCode}
              editable={!busy}
              keyboardType="number-pad"
              autoComplete="postal-code"
              textContentType="postalCode"
              maxLength={6}
            />
            <Field
              label={s.city}
              value={city}
              onChangeText={setCity}
              editable={!busy}
              textContentType="addressCity"
              maxLength={35}
            />
          </>
        ) : (
          <>
            <Text selectable style={uiStyles.body}>
              {firstName} {lastName}
              {"\n"}
              {phone}
              {"\n"}
              {street}
              {"\n"}
              {postalCode} {city}
            </Text>
            <Button
              label={t.edit}
              variant="text"
              disabled={busy}
              onPress={() => setEditing(true)}
            />
          </>
        )}
        <OfferAgreementLink agreement={data.agreement} />
        {!data.agreementAccepted ? (
          <Choice
            role="checkbox"
            label={t.consent}
            selected={accepted}
            disabled={busy}
            onPress={() => setAccepted((v) => !v)}
          />
        ) : null}
      </Card>
      <Text style={uiStyles.note}>{t.reviewHint}</Text>
      {error ? <Message tone="error">{error}</Message> : null}
      <Button
        label={externalSubmissionCopy(locale).send}
        busy={busy}
        disabled={!accepted}
        onPress={() => void submit()}
      />
    </>
  );
}
