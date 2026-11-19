import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { hasCentralIdentity } from "@/lib/identity-gates";
import { isId } from "@/lib/catalogue";
import { createScopedRead } from "@/lib/scoped-read";
import { externalRequestApi } from "@/lib/external-submission-runtime";
import { externalOfferApi } from "@/lib/external-offer-runtime";
import { externalItemDetailCopy } from "@/lib/external-item-detail-copy";
import { centralPayoutCopy } from "@/lib/central-payout-copy";
import { externalOfferCopy } from "@/lib/external-offer-copy";
import { itemDraftCopy } from "@/lib/item-draft-copy";
import {
  externalItemPresentation,
  externalItemAmounts,
  agreedItemPayout,
} from "@/lib/external-item-presentation";
import { offerAmount, type ExternalOffer } from "@/lib/external-offer";
import { formattingLocale } from "@/lib/locale";
import { ExternalPhotoPager } from "./external-photo-pager";
import { DetailSheet } from "./detail-sheet";
import { InfoIcon } from "./brand";
import { WithdrawExternalRequest } from "./withdraw-external-request";
import {
  Button,
  Card,
  IconButton,
  Loading,
  Message,
  Screen,
  StatusBadge,
  uiStyles,
} from "./ui";

export function ExternalItemDetailsScreen() {
  const { request } = useLocalSearchParams<{ request: string }>();
  const { session } = useSession(),
    { locale } = useI18n();
  if (!session || !hasCentralIdentity(session.user) || !isId(request))
    return (
      <Screen topSafeArea={false}>
        <Message>{externalItemDetailCopy(locale).loadError}</Message>
      </Screen>
    );
  return (
    <ItemDetails
      key={`${session.user.id}:${request}`}
      owner={session.user.id}
      id={request}
    />
  );
}

function ItemDetails({ owner, id }: { owner: string; id: string }) {
  const { locale, d } = useI18n(),
    { refreshAssurance } = useSession();
  const t = externalItemDetailCopy(locale),
    draft = itemDraftCopy(locale);
  const [showPayoutInfo, setShowPayoutInfo] = useState(false);
  const read = useMemo(
    () =>
      createScopedRead(async () => {
        try {
          const item = await externalRequestApi(owner).lookup(id);
          if (!item) throw new Error("REQUEST_NOT_FOUND");
          let offer: ExternalOffer | undefined;
          let offerFailed = false;
          try {
            offer = (await externalOfferApi(owner).list([id]))[0];
            if (offer && offer.tenantId !== item.tenant_id)
              throw new Error("OFFER_UNAVAILABLE");
          } catch (e) {
            if (
              e instanceof Error &&
              [
                "AUTH_REQUIRED",
                "MFA_REQUIRED",
                "PASSWORD_UPDATE_REQUIRED",
              ].includes(e.message)
            )
              throw e;
            offer = undefined;
            offerFailed = true;
          }
          return { item, offer, offerFailed };
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
    [owner, id, refreshAssurance],
  );
  const state = useSyncExternalStore(
    read.subscribe,
    read.getState,
    read.getState,
  );
  const refresh = useCallback(() => void read.refresh(), [read]);
  useFocusEffect(
    useCallback(() => {
      refresh();
      return () => {
        setShowPayoutInfo(false);
        read.cancel();
      };
    }, [read, refresh]),
  );
  const data = state.data;
  const presentation = data
    ? externalItemPresentation(data.item, data.offer, locale)
    : null;
  const amounts = data ? externalItemAmounts(data.item, data.offer) : [];
  const payout = data && agreedItemPayout(data.item, data.offer, locale);
  return (
    <Screen
      topSafeArea={false}
      refresh={{
        refreshing: state.status === "loading",
        onRefresh: refresh,
        label: d.retry,
      }}
    >
      {state.status === "failed" ? (
        <>
          <Message tone="error">{t.loadError}</Message>
          <Button label={d.retry} onPress={refresh} />
        </>
      ) : !data ? (
        <Loading />
      ) : null}
      {data && presentation ? (
        <>
          <ExternalPhotoPager
            owner={owner}
            photos={data.item.photos}
            label={data.item.description}
            style={{ width: "100%", aspectRatio: 1 }}
          />
          <View style={{ gap: 8 }}>
            <Text selectable accessibilityRole="header" style={uiStyles.title}>
              {data.item.description}
            </Text>
            {data.item.brand ? (
              <Text selectable style={uiStyles.body}>
                {data.item.brand}
              </Text>
            ) : null}
            <StatusBadge tone={presentation.tone}>
              {presentation.status}
            </StatusBadge>
            <Text style={uiStyles.note}>{presentation.date}</Text>
          </View>
          <Card>
            {payout?.congratulate ? (
              <Text accessibilityRole="header" style={uiStyles.heading}>
                {data.item.sale_method === "direct_purchase"
                  ? t.directApproval
                  : t.approvalGreeting}
              </Text>
            ) : null}
            {data.item.sale_method && data.item.approval_mode === "fixed" ? (
              <Text style={uiStyles.body}>{t[data.item.sale_method]}</Text>
            ) : null}
            {amounts.length ? (
              amounts.map((amount) => (
                <View key={amount.label} style={{ gap: 4 }}>
                  {amount.label === "agreedAmount" && payout ? (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Text style={[uiStyles.label, { flexShrink: 1 }]}>
                        {t.agreedAmount}
                      </Text>
                      <IconButton
                        label={t.payoutTitle}
                        onPress={() => setShowPayoutInfo(true)}
                      >
                        <InfoIcon />
                      </IconButton>
                    </View>
                  ) : (
                    <Text style={uiStyles.label}>{t[amount.label]}</Text>
                  )}
                  <Text selectable style={uiStyles.amount}>
                    {offerAmount(
                      amount.ore,
                      formattingLocale(locale),
                      amount.currency,
                    )}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={uiStyles.note}>{t.noAmount}</Text>
            )}
          </Card>
          {payout &&
          (data.offer?.purchaseCreditedAt ||
            data.offer?.guarantee?.creditedAt) ? (
            <Button
              label={centralPayoutCopy[locale].open}
              onPress={() =>
                router.push({
                  pathname: "/central-money",
                  params: { tenant: data.item.tenant_id },
                })
              }
            />
          ) : null}
          {payout ? (
            <DetailSheet
              title={t.payoutTitle}
              open={showPayoutInfo}
              onClose={() => setShowPayoutInfo(false)}
            >
              <Text style={uiStyles.label}>{data.item.description}</Text>
              <Text style={uiStyles.body}>{payout.message}</Text>
              <Text style={uiStyles.note}>{t.fromBalance}</Text>
            </DetailSheet>
          ) : null}
          <View style={{ gap: 4 }}>
            <Text style={uiStyles.label}>{draft.condition}</Text>
            <Text style={uiStyles.body}>
              {draft.conditions[data.item.condition]}
            </Text>
            {data.item.notes ? (
              <Text selectable style={[uiStyles.body, { marginTop: 8 }]}>
                {data.item.notes}
              </Text>
            ) : null}
          </View>
          {data.item.decline_note ? (
            <Message>{data.item.decline_note}</Message>
          ) : null}
          {data.offerFailed ? (
            <>
              <Message tone="error">
                {externalOfferCopy(locale).listError}
              </Message>
              <Button label={d.retry} variant="secondary" onPress={refresh} />
            </>
          ) : null}
          {data.offer ? (
            <Button
              label={
                data.offer.status === "accepted" ? t.openHandover : t.openOffer
              }
              onPress={() =>
                router.push({
                  pathname:
                    data.offer!.status === "accepted"
                      ? "/external-onboarding/[offer]"
                      : "/external-offer/[offer]",
                  params: { offer: data.offer!.id },
                })
              }
            />
          ) : null}
          {data.item.canWithdraw ? (
            <WithdrawExternalRequest
              owner={owner}
              request={data.item.id}
              onChanged={refresh}
            />
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}
