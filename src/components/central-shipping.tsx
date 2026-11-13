import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { Text } from "react-native";
import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";
import { randomUUID } from "expo-crypto";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { createScopedRead } from "@/lib/scoped-read";
import { readShipping, shippingWriter } from "@/lib/central-shipping-runtime";
import {
  parseBookParcel,
  parcelTrackingUrl,
  type ShippingAddress,
} from "@/lib/central-shipping";
import { centralShippingCopy } from "@/lib/central-shipping-copy";
import { shippingAddressCopy } from "@/lib/shipping-address-copy";
import { CentralShippingAddress } from "./central-shipping-address";
import { Button, Card, Loading, Message, uiStyles } from "./ui";
import { ExternalPageButton } from "./external-page-button";

export function CentralShipping({
  user,
  offer,
  itemCount,
}: {
  user: string;
  offer: string;
  itemCount: number;
}) {
  const { locale, d } = useI18n(),
    t = centralShippingCopy(locale),
    addressCopy = shippingAddressCopy(locale);
  const { refreshAssurance } = useSession();
  const read = useMemo(
    () =>
      createScopedRead(async () => {
        try {
          return await readShipping(user, offer);
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
    [user, offer, refreshAssurance],
  );
  const writer = useMemo(() => shippingWriter(user, offer), [user, offer]);
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
  const [invalid, setInvalid] = useState(false);
  useFocusEffect(
    useCallback(() => {
      void read.refresh();
      void writer.load();
      return () => read.cancel();
    }, [read, writer]),
  );
  async function finish(work: Promise<void>) {
    await work;
    if (["success", "conflict"].includes(writer.getState().status))
      void read.refresh();
    if (
      ["AUTH_REQUIRED", "MFA_REQUIRED", "PASSWORD_UPDATE_REQUIRED"].includes(
        writer.getState().code ?? "",
      )
    )
      void refreshAssurance();
  }
  function book(address: ShippingAddress) {
    try {
      const command = parseBookParcel(
        {
          action: "book",
          requestId: randomUUID(),
          offerId: offer,
          address,
        },
        offer,
      );
      setInvalid(false);
      void finish(writer.submit(command));
    } catch {
      setInvalid(true);
    }
  }
  const parcel = state.data?.parcel;
  const pending = ["pending", "blocked", "cleanup"].includes(change.status);
  const busy = change.status === "busy";
  if (state.status === "failed")
    return (
      <Card>
        <Message tone="error">{t.error}</Message>
        <Button label={d.retry} onPress={() => void read.refresh()} />
      </Card>
    );
  if (!state.data) return <Loading />;
  if (parcel)
    return (
      <Card>
        {parcel.environment === "sandbox" ? (
          <Message>{t.sandbox}</Message>
        ) : null}
        {parcel.status === "booked" && parcel.booking ? (
          <>
            <Text accessibilityRole="header" style={uiStyles.heading}>
              {t.code}
            </Text>
            <Image
              source={{ uri: parcel.booking.qrPng }}
              accessibilityLabel={t.code}
              style={{
                width: 220,
                height: 220,
                alignSelf: "center",
                maxWidth: "100%",
              }}
              contentFit="contain"
              cachePolicy="none"
            />
            <Text selectable style={[uiStyles.label, { textAlign: "center" }]}>
              {parcel.booking.returnId}
            </Text>
            <Text style={uiStyles.body}>{t.instructions}</Text>
            <ExternalPageButton
              label={t.tracking}
              url={parcelTrackingUrl(parcel)}
              variant="secondary"
            />
          </>
        ) : (
          <>
            <Message>
              {parcel.status === "pending" ? t.pending : t.review}
            </Message>
            <Button
              label={d.retry}
              busy={busy}
              onPress={() =>
                void (pending ? finish(writer.retry()) : read.refresh())
              }
            />
          </>
        )}
        <Text selectable style={uiStyles.note}>
          {parcel.reference}
        </Text>
        <Text style={uiStyles.label}>{t.recipient}</Text>
        <Text selectable style={uiStyles.body}>
          {parcel.recipient.name}
          {"\n"}
          {parcel.recipient.street}
          {"\n"}
          {parcel.recipient.postalCode} {parcel.recipient.city}
        </Text>
      </Card>
    );
  if (itemCount !== 1) return <Message>{t.grouped}</Message>;
  if (!state.data.available || !state.data.measurementsOptional)
    return (
      <Card>
        <Message>{t.unavailable}</Message>
        <Button label={d.retry} onPress={() => void read.refresh()} />
      </Card>
    );
  if (pending)
    return (
      <Card>
        <Message>{t.pending}</Message>
        <Button
          label={d.retry}
          busy={busy}
          onPress={() => void finish(writer.retry())}
        />
      </Card>
    );
  return (
    <>
      <Text style={uiStyles.body}>{t.intro}</Text>
      <CentralShippingAddress user={user} disabled={busy}>
        {(address) => (
          <>
            <Text style={uiStyles.note}>{addressCopy.limits}</Text>
            {invalid || change.status === "rejected" ? (
              <Message tone="error">{addressCopy.bookingInvalid}</Message>
            ) : null}
            {change.status === "conflict" ? (
              <Message>
                {change.code === "PARCEL_GROUP_UNSUPPORTED"
                  ? t.grouped
                  : change.code === "SHIPPING_CONTACT_UNSUPPORTED"
                    ? t.contactUnsupported
                    : t.error}
              </Message>
            ) : null}
            <Button
              label={t.book}
              busy={busy}
              disabled={
                ![
                  "ready",
                  "success",
                  "conflict",
                  "rejected",
                  "discarded",
                ].includes(change.status)
              }
              onPress={() => book(address)}
            />
          </>
        )}
      </CentralShippingAddress>
    </>
  );
}
