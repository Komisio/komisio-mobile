import {
  useCallback,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Text } from "react-native";
import { useFocusEffect } from "expo-router";
import { randomUUID } from "expo-crypto";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { createScopedRead } from "@/lib/scoped-read";
import {
  readShippingAccount,
  shippingAddressWriter,
} from "@/lib/central-shipping-address-runtime";
import {
  parseSaveShippingAddress,
  type ShippingAccount,
} from "@/lib/central-shipping-address";
import type { ShippingAddress } from "@/lib/central-shipping";
import { centralShippingCopy } from "@/lib/central-shipping-copy";
import { shippingAddressCopy } from "@/lib/shipping-address-copy";
import { Button, Card, Field, Loading, Message, uiStyles } from "./ui";

type Props = {
  user: string;
  disabled?: boolean;
  hideUnavailable?: boolean;
  children?: (address: ShippingAddress) => ReactNode;
};
export function CentralShippingAddress({
  user,
  disabled = false,
  hideUnavailable = false,
  children,
}: Props) {
  const { locale, d } = useI18n(),
    t = shippingAddressCopy(locale),
    shipping = centralShippingCopy(locale);
  const { refreshAssurance } = useSession();
  const read = useMemo(
    () =>
      createScopedRead(async () => {
        try {
          return await readShippingAccount(user);
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
    [user, refreshAssurance],
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
        <Message tone="error">{shipping.error}</Message>
        <Button label={d.retry} onPress={() => void read.refresh()} />
      </Card>
    );
  if (!state.data) return <Loading />;
  const account = state.data.account;
  if (!account) return hideUnavailable ? null : <Message>{t.required}</Message>;
  return (
    <AddressEditor
      key={`${user}:${account.tenantId}:${account.sellerId}:${account.revision}`}
      user={user}
      account={account}
      disabled={disabled}
      refresh={() => void read.refresh()}
    >
      {children}
    </AddressEditor>
  );
}
function AddressEditor({
  user,
  account,
  disabled,
  refresh,
  children,
}: Props & { account: ShippingAccount; refresh: () => void }) {
  const { locale, d } = useI18n(),
    t = shippingAddressCopy(locale),
    shipping = centralShippingCopy(locale);
  const { refreshAssurance } = useSession();
  const [editing, setEditing] = useState(!account.address);
  const [street, setStreet] = useState(account.address?.street ?? ""),
    [postalCode, setPostalCode] = useState(account.address?.postalCode ?? ""),
    [city, setCity] = useState(account.address?.city ?? "");
  const [invalid, setInvalid] = useState(false);
  const writer = useMemo(
    () => shippingAddressWriter(user, account.tenantId, account.sellerId),
    [user, account.tenantId, account.sellerId],
  );
  const change = useSyncExternalStore(
    writer.subscribe,
    writer.getState,
    writer.getState,
  );
  useFocusEffect(
    useCallback(() => {
      void writer.load();
    }, [writer]),
  );
  const busy = change.status === "busy";
  const pending = ["pending", "blocked", "cleanup"].includes(change.status);
  async function finish(work: Promise<void>) {
    await work;
    const current = writer.getState();
    if (current.status === "success") refresh();
    if (
      ["AUTH_REQUIRED", "MFA_REQUIRED", "PASSWORD_UPDATE_REQUIRED"].includes(
        current.code ?? "",
      )
    )
      void refreshAssurance();
  }
  function save() {
    try {
      const c = parseSaveShippingAddress(
        {
          action: "save",
          requestId: randomUUID(),
          tenantId: account.tenantId,
          sellerId: account.sellerId,
          expectedRevision: account.revision,
          address: {
            street: street.trim(),
            postalCode: postalCode.replace(/\s/g, ""),
            city: city.trim(),
          },
        },
        account.tenantId,
        account.sellerId,
      );
      setInvalid(false);
      void finish(writer.submit(c));
    } catch {
      setInvalid(true);
    }
  }
  if (pending || change.status === "conflict")
    return (
      <Card>
        <Text accessibilityRole="header" style={uiStyles.heading}>
          {t.title}
        </Text>
        <Message>{pending ? t.pending : t.changed}</Message>
        <Button
          label={d.retry}
          disabled={disabled}
          onPress={() => (pending ? void finish(writer.retry()) : refresh())}
        />
      </Card>
    );
  if (change.status === "idle" || (busy && !editing)) return <Loading />;
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
              label={shipping.street}
              value={street}
              onChangeText={setStreet}
              editable={!busy && !disabled}
              autoComplete="street-address"
              maxLength={50}
            />
            <Field
              label={shipping.postalCode}
              value={postalCode}
              onChangeText={setPostalCode}
              editable={!busy && !disabled}
              keyboardType="number-pad"
              autoComplete="postal-code"
              maxLength={6}
            />
            <Field
              label={shipping.city}
              value={city}
              onChangeText={setCity}
              editable={!busy && !disabled}
              maxLength={35}
            />
            {invalid || change.status === "rejected" ? (
              <Message tone="error">{t.invalid}</Message>
            ) : null}
            <Button
              label={t.save}
              busy={busy}
              disabled={disabled}
              onPress={save}
            />
            {account.address ? (
              <Button
                label={t.cancel}
                variant="text"
                disabled={busy || disabled}
                onPress={() => {
                  setStreet(account.address!.street);
                  setPostalCode(account.address!.postalCode);
                  setCity(account.address!.city);
                  setInvalid(false);
                  setEditing(false);
                }}
              />
            ) : null}
          </>
        ) : (
          <>
            <Text selectable style={uiStyles.body}>
              {account.address!.street}
              {"\n"}
              {account.address!.postalCode} {account.address!.city}
            </Text>
            <Button
              label={t.change}
              variant="text"
              disabled={disabled}
              onPress={() => setEditing(true)}
            />
          </>
        )}
      </Card>
      {!editing && account.address ? children?.(account.address) : null}
    </>
  );
}
