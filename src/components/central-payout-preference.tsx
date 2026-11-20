import {
  useCallback,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { randomUUID } from "expo-crypto";
import { BankAccount } from "./bank-account";
import { CentralPayoutEmail } from "./central-payout-email";
import { useSession } from "@/lib/session";
import { hasVerifiedEmail } from "@/lib/identity-gates";
import { Button, Card, Choice, Field, Loading, Message, uiStyles } from "./ui";
import { centralPayoutCopy } from "@/lib/central-payout-copy";
import { useI18n } from "@/lib/i18n";
import {
  payoutPreferenceWriter,
  readIntakeProfile,
} from "@/lib/central-intake-profile-runtime";
import { createScopedRead } from "@/lib/scoped-read";
import {
  swishNumber,
  type PayoutDestination,
} from "@/lib/central-payout-preference";
import type { IntakeProfile } from "@/lib/central-intake-profile";

type Props = {
  user: string;
  tenant: string;
  seller: string;
  onSaved?: (sendItem: boolean) => void | Promise<void>;
  submitLabel?: string;
  disabled?: boolean;
};
export function CentralPayoutPreference(props: Props) {
  const { d } = useI18n();
  const { user, tenant, seller } = props;
  const { session } = useSession();
  const [returningFromBank, setReturningFromBank] = useState(false);
  const [addingBank, setAddingBank] = useState(false);
  const read = useMemo(
    () => createScopedRead(() => readIntakeProfile(user)),
    [user],
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
  const returnFromBank = useCallback(() => {
    setAddingBank(false);
    void read.refresh();
  }, [read]);
  if (addingBank && !hasVerifiedEmail(session?.user))
    return <CentralPayoutEmail owner={user} />;
  if (addingBank)
    return (
      <BankAccount
        user={user}
        tenant={tenant}
        seller={seller}
        embedded
        onReturnToPayout={returnFromBank}
      />
    );
  if (
    state.status === "failed" ||
    (state.data &&
      (state.data.tenantId !== tenant ||
        state.data.account?.sellerId !== seller ||
        state.data.payoutPreference === undefined))
  )
    return (
      <Card>
        <Message tone="error">{d.payouts.failed}</Message>
        <Button label={d.retry} onPress={() => void read.refresh()} />
      </Card>
    );
  if (!state.data || state.status === "loading") return <Loading />;
  return (
    <PreferenceEditor
      key={JSON.stringify([
        user,
        tenant,
        seller,
        state.data.payoutPreference?.id,
        state.data.payoutBank?.id,
      ])}
      {...props}
      returningFromBank={returningFromBank}
      onOpenBank={() => {
        setReturningFromBank(true);
        setAddingBank(true);
      }}
      profile={state.data}
      reload={() => void read.refresh()}
    />
  );
}
function PreferenceEditor({
  user,
  tenant,
  seller,
  profile,
  reload,
  onSaved,
  submitLabel,
  disabled,
  returningFromBank,
  onOpenBank,
}: Props & {
  profile: IntakeProfile;
  reload: () => void;
  returningFromBank: boolean;
  onOpenBank: () => void;
}) {
  const { d, locale } = useI18n(),
    t = centralPayoutCopy[locale];
  const pref = profile.payoutPreference,
    bank = profile.payoutBank;
  const [editing, setEditing] = useState(!pref || Boolean(onSaved));
  const [method, setMethod] = useState<"bank" | "swish">(
    returningFromBank ? "bank" : (pref?.method ?? "swish"),
  );
  const [phone, setPhone] = useState(
    pref?.phone ?? profile.account?.contact?.phone ?? "",
  );
  const [error, setError] = useState("");
  const writer = useMemo(
    () => payoutPreferenceWriter(user, tenant, seller),
    [user, tenant, seller],
  );
  const state = useSyncExternalStore(
    writer.subscribe,
    writer.getState,
    writer.getState,
  );
  const active = useRef(false),
    locked = useRef(false);
  useFocusEffect(
    useCallback(() => {
      active.current = true;
      void writer.load();
      return () => {
        active.current = false;
      };
    }, [writer]),
  );
  async function save(retry = false) {
    if (locked.current || disabled) return;
    locked.current = true;
    try {
      setError("");
      if (retry) await writer.retry();
      else {
        let destination: PayoutDestination;
        if (method === "swish") {
          let normalized;
          try {
            normalized = swishNumber(phone);
          } catch {
            setError(t.invalidPhone);
            return;
          }
          destination = { method, phone: normalized };
        } else {
          if (!bank) return;
          destination = { method, bankVersionId: bank.id };
        }
        await writer.submit({
          action: "savePayoutPreference",
          tenantId: tenant,
          sellerId: seller,
          requestId: randomUUID(),
          expected: pref?.id ?? null,
          destination,
        });
      }
      if (active.current && writer.getState().status === "success") {
        if (onSaved) await onSaved(!retry);
        if (active.current) reload();
      }
    } catch {
      if (active.current) setError(d.payouts.failed);
    } finally {
      locked.current = false;
    }
  }
  if (state.status === "pending" || state.status === "cleanup")
    return (
      <Card>
        <Message>{d.payouts.pending}</Message>
        <Button label={d.payouts.retrySame} onPress={() => void save(true)} />
      </Card>
    );
  if (["rejected", "blocked", "discarded", "conflict"].includes(state.status))
    return (
      <Card>
        <Message>{d.payouts.changed}</Message>
        <Button
          label={d.retry}
          onPress={() => {
            void writer.load();
            reload();
          }}
        />
      </Card>
    );
  if (!editing && pref)
    return (
      <Card>
        <Text style={uiStyles.heading}>{t.method}</Text>
        <Text selectable style={uiStyles.body}>
          {pref.method === "swish"
            ? "Swish · " + pref.phone
            : t.bank + " · …" + pref.bankLastFour}
        </Text>
        <Button
          label={t.edit}
          variant="text"
          onPress={() => setEditing(true)}
        />
      </Card>
    );
  const busy = Boolean(disabled) || state.status !== "ready";
  return (
    <Card>
      <Text accessibilityRole="header" style={uiStyles.heading}>
        {t.method}
      </Text>
      <View
        style={uiStyles.choices}
        accessibilityRole="radiogroup"
        accessibilityLabel={t.method}
      >
        {(["swish", "bank"] as const).map((v) => (
          <Choice
            key={v}
            role="radio"
            label={v === "swish" ? "Swish" : t.bank}
            selected={v === method}
            disabled={busy}
            onPress={() => {
              setMethod(v);
              setError("");
            }}
          />
        ))}
      </View>
      {method === "swish" ? (
        <Field
          label={t.phone}
          value={phone}
          editable={!busy}
          keyboardType="phone-pad"
          autoComplete="tel"
          maxLength={30}
          onChangeText={(v) => {
            setPhone(v);
            setError("");
          }}
        />
      ) : (
        <View style={{ gap: 6 }}>
          {bank ? (
            <Text selectable style={uiStyles.body}>
              {t.bank} · …{bank.lastFour}
            </Text>
          ) : null}
          <Button
            label={bank ? t.editBank : d.bank.title}
            variant="secondary"
            disabled={busy}
            onPress={onOpenBank}
          />
        </View>
      )}
      <Text style={uiStyles.note}>{t.autoHint}</Text>
      {error ? <Message tone="error">{error}</Message> : null}
      <Button
        label={submitLabel ?? (method === "swish" ? t.confirmSwish : t.save)}
        disabled={busy || (method === "bank" && !bank)}
        onPress={() => void save()}
      />
    </Card>
  );
}
