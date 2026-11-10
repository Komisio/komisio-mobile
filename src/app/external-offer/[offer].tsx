import { createScopedRead } from "@/lib/scoped-read";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { AppState, Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { randomUUID } from "expo-crypto";
import {
  Button,
  Card,
  Loading,
  Message,
  Screen,
  StatusBadge,
  colors,
  uiStyles,
} from "@/components/ui";
import { ExternalItemPhoto } from "@/components/external-item-photo";
import {
  readExternalOfferItem,
  externalOfferWriter,
} from "@/lib/external-offer-runtime";
import { offerAmount, offerIsExpired } from "@/lib/external-offer";
import { externalOfferCopy } from "@/lib/external-offer-copy";
import { externalOnboardingCopy } from "@/lib/external-onboarding-copy";
import { useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { formattingLocale } from "@/lib/locale";
import { hasVerifiedPhone } from "@/lib/identity-gates";
import { isId } from "@/lib/catalogue";

export default function ExternalOfferScreen() {
  const { offer } = useLocalSearchParams<{ offer: string }>();
  const { session } = useSession(),
    { locale } = useI18n();
  if (!session || !hasVerifiedPhone(session.user) || !isId(offer))
    return (
      <Screen topSafeArea={false}>
        <Message>{externalOfferCopy(locale).loadError}</Message>
      </Screen>
    );
  return (
    <Offer
      key={`${session.user.id}:${offer}`}
      user={session.user.id}
      id={offer}
    />
  );
}
function Offer({ user, id }: { user: string; id: string }) {
  const { locale, d } = useI18n(),
    t = externalOfferCopy(locale);
  const { refreshAssurance } = useSession();
  const writer = useMemo(() => externalOfferWriter(user, id), [user, id]);
  const change = useSyncExternalStore(
    writer.subscribe,
    writer.getState,
    writer.getState,
  );
  const [terms, setTerms] = useState(false);
  const [now, setNow] = useState(() => performance.now());
  const read = useMemo(
    () =>
      createScopedRead(async () => {
        try {
          return await readExternalOfferItem(user, id);
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
  const state = useSyncExternalStore(
    read.subscribe,
    read.getState,
    read.getState,
  );
  const data = state.data,
    error = state.status === "failed";
  const reload = useCallback(() => {
    setTerms(false);
    void read.refresh();
  }, [read]);
  useFocusEffect(
    useCallback(() => {
      reload();
      void writer.load();
      const app = AppState.addEventListener("change", (status) => {
        if (status === "active") reload();
      });
      const timer = setInterval(() => setNow(performance.now()), 1000);
      return () => {
        read.cancel();
        app.remove();
        clearInterval(timer);
      };
    }, [read, writer, reload]),
  );
  async function finish(work: Promise<void>) {
    await work;
    const state = writer.getState();
    if (state.status === "success" || state.status === "conflict") reload();
    if (
      ["AUTH_REQUIRED", "MFA_REQUIRED", "PASSWORD_UPDATE_REQUIRED"].includes(
        state.code ?? "",
      )
    )
      void refreshAssurance();
  }
  const pending = ["pending", "cleanup", "blocked"].includes(change.status);
  const busy = change.status === "busy";
  const ready = [
    "ready",
    "rejected",
    "discarded",
    "success",
    "conflict",
  ].includes(change.status);
  const o = data?.offer;
  const expired = o ? offerIsExpired(o, now - data.received) : false;
  const amount = o
    ? offerAmount(o.sellerAmountOre, formattingLocale(locale))
    : "";
  const time = o
    ? new Intl.DateTimeFormat(formattingLocale(locale), {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(o.expiresAt))
    : "";
  const send = (accepted: boolean) => {
    if (
      !o ||
      !ready ||
      busy ||
      pending ||
      accepted ||
      (!accepted && !o.canDecline)
    )
      return;
    void finish(
      writer.submit({
        action: "respond",
        requestId: randomUUID(),
        offerId: o.id,
        accepted,
        agreementVersionId: accepted ? o.agreementVersionId : null,
      }),
    );
  };
  return (
    <Screen
      topSafeArea={false}
      refresh={{
        refreshing: !data && !error,
        onRefresh: reload,
        label: d.retry,
      }}
    >
      {error ? (
        <>
          <Message tone="error">{t.loadError}</Message>
          <Button label={d.retry} onPress={reload} />
        </>
      ) : !data ? (
        <Loading />
      ) : null}
      {data && o ? (
        <>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <ExternalItemPhoto
              owner={user}
              photo={data.item.photos[0]}
              label={data.item.description}
            />
            <View style={{ flex: 1 }}>
              <Text selectable style={uiStyles.itemName}>
                {data.item.description}
              </Text>
              <Text style={uiStyles.note}>{data.item.brand}</Text>
            </View>
          </View>
          <Text accessibilityRole="header" style={uiStyles.heading}>
            {t.heading}
          </Text>
          <View
            style={[
              uiStyles.card,
              {
                backgroundColor: colors.brand,
                borderColor: colors.brand,
                gap: 8,
              },
            ]}
          >
            <Text style={[uiStyles.body, { color: colors.onBrandMuted }]}>
              {t.guaranteed}
            </Text>
            <Text
              selectable
              style={{
                fontSize: 38,
                lineHeight: 46,
                fontWeight: "700",
                fontVariant: ["tabular-nums"],
                color: colors.onBrand,
              }}
            >
              {amount}
            </Text>
            <Text style={[uiStyles.note, { color: colors.onBrandMuted }]}>
              {t.planned.replace(
                "{amount}",
                offerAmount(o.expectedSalePriceOre, formattingLocale(locale)),
              )}
            </Text>
          </View>
          <Card>
            <View style={{ gap: 6 }}>
              <StatusBadge>{t.sold}</StatusBadge>
              <Text style={uiStyles.body}>
                {t.soldText.replace("{amount}", amount)}
              </Text>
            </View>
            <View style={{ gap: 6 }}>
              <StatusBadge tone="neutral">{t.day45}</StatusBadge>
              <Text style={uiStyles.body}>
                {t.day45Text.replace("{amount}", amount)}
              </Text>
            </View>
            <Text style={uiStyles.note}>{t.fixed}</Text>
          </Card>
          {o.status === "accepted" ? (
            <>
              <StatusBadge>{t.accepted}</StatusBadge>
              <Text style={uiStyles.body}>{t.acceptedText}</Text>
              {!pending && !busy ? (
                <Button
                  label={externalOnboardingCopy(locale).continue}
                  onPress={() =>
                    router.push({
                      pathname: "/external-onboarding/[offer]",
                      params: { offer: o.id },
                    })
                  }
                />
              ) : null}
            </>
          ) : o.status === "declined" ? (
            <StatusBadge tone="neutral">{t.declined}</StatusBadge>
          ) : o.status === "superseded" ? (
            <Message>{t.superseded}</Message>
          ) : expired ? (
            <Message>{t.expired}</Message>
          ) : (
            <Text style={uiStyles.note}>
              {t.deadline.replace("{date}", time)}
            </Text>
          )}
          {pending ? (
            <>
              <Message>{t.pending}</Message>
              <Button
                label={d.retry}
                busy={busy}
                onPress={() => void finish(writer.retry())}
              />
            </>
          ) : null}
          {change.status === "conflict" ? <Message>{t.changed}</Message> : null}
          {terms ? (
            <Card>
              <Text accessibilityRole="header" style={uiStyles.heading}>
                {o.agreement.title}
              </Text>
              <Text style={uiStyles.note}>
                {d.agreement.version.replace(
                  "{version}",
                  String(o.agreement.version),
                )}
              </Text>
              <Text selectable style={uiStyles.body}>
                {o.agreement.body}
              </Text>
            </Card>
          ) : null}
          {o.canAccept && !expired && !pending ? (
            <Button
              label={t.yes}
              busy={busy}
              disabled={!ready}
              onPress={() =>
                router.push({
                  pathname: "/external-onboarding/[offer]",
                  params: { offer: o.id },
                })
              }
            />
          ) : null}
          {o.canDecline && !pending ? (
            <Button
              label={t.no}
              variant="secondary"
              busy={busy}
              disabled={!ready}
              onPress={() => send(false)}
            />
          ) : null}
          {!terms ? (
            <Button
              label={t.terms}
              variant="text"
              onPress={() => setTerms(true)}
            />
          ) : null}
        </>
      ) : null}
      <Button
        label={t.back}
        variant="text"
        onPress={() => router.dismissTo("/external-items")}
      />
    </Screen>
  );
}
