import { router } from "expo-router";
import { externalOfferCopy } from "@/lib/external-offer-copy";
import { externalHandoverCopy } from "@/lib/external-handover-copy";
import { offerAmount, type ExternalOffer } from "@/lib/external-offer";
import { Pressable, Text, View } from "react-native";
import { useI18n } from "@/lib/i18n";
import { formattingLocale } from "@/lib/locale";
import { photoFlowCopy } from "@/lib/photo-flow-copy";
import { externalSubmissionCopy } from "@/lib/external-submission-copy";
import type { ExternalRequest } from "@/lib/external-submission";
import { ExternalPhotoGallery } from "./external-photo-gallery";
import { StatusBadge, uiStyles } from "./ui";
import { externalLifecycleCopy } from "@/lib/external-lifecycle-copy";
import { WithdrawExternalRequest } from "./withdraw-external-request";

export function ExternalItemRow({
  item,
  owner,
  offer,
  offersLoaded = true,
  onChanged,
}: {
  item: ExternalRequest;
  owner: string;
  offer?: ExternalOffer;
  offersLoaded?: boolean;
  onChanged?: () => void;
}) {
  const { locale } = useI18n();
  const t = externalSubmissionCopy(locale),
    flow = photoFlowCopy(locale);
  const dates = new Intl.DateTimeFormat(formattingLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const date = dates.format(new Date(item.created_at));
  const o = externalOfferCopy(locale),
    h = externalHandoverCopy(locale);
  const lifecycle = externalLifecycleCopy(locale);
  const terminal = item.lifecycleStatus;
  const knownStatus =
    terminal === "open"
      ? h.open
      : terminal === "received" || terminal === "registered"
        ? h.received
        : terminal === "cancelled"
          ? h.cancelled
          : terminal === "accepted"
            ? o.accepted
            : terminal === "offered" && !offer
              ? o.title
              : undefined;
  const status =
    knownStatus ??
    (terminal === "expired"
      ? o.expired
      : terminal === "rejected"
        ? t.declined
        : terminal === "declined"
          ? o.declined
          : terminal &&
              ["withdrawn", "sold", "acquired", "ended"].includes(terminal)
            ? lifecycle[terminal as "withdrawn" | "sold" | "acquired" | "ended"]
            : offer?.handover
              ? h[offer.handover.status]
              : offer
                ? offer.status === "offered"
                  ? o.offerBadge.replace(
                      "{amount}",
                      offerAmount(
                        offer.sellerAmountOre,
                        formattingLocale(locale),
                      ),
                    )
                  : offer.status === "accepted"
                    ? o.accepted
                    : offer.status === "declined"
                      ? o.declined
                      : o.expired
                : item.status === "waiting"
                  ? t.waiting
                  : t.declined);
  const open = () => {
    if (offer)
      router.push({
        pathname:
          offer.status === "accepted"
            ? "/external-onboarding/[offer]"
            : "/external-offer/[offer]",
        params: { offer: offer.id },
      });
  };
  return (
    <View style={[uiStyles.card, { gap: 8 }]}>
      <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
        <ExternalPhotoGallery
          owner={owner}
          photos={item.photos}
          label={item.description}
        />
        <Pressable
          style={{ flex: 1, gap: 4 }}
          disabled={!offer}
          onPress={open}
          accessibilityRole={offer ? "button" : undefined}
          accessibilityLabel={
            offer ? `${item.description}. ${status}` : undefined
          }
        >
          <Text selectable style={uiStyles.itemName}>
            {item.description}
            {item.brand ? ` · ${item.brand}` : ""}
          </Text>
          {offersLoaded ||
          item.lifecycleStatus ||
          item.status === "declined" ? (
            <StatusBadge
              tone={
                offer?.handover?.status === "open"
                  ? "warning"
                  : offer?.handover?.status === "received"
                    ? "positive"
                    : offer?.status === "offered"
                      ? "positive"
                      : item.status === "waiting"
                        ? "neutral"
                        : "warning"
              }
            >
              {status}
            </StatusBadge>
          ) : null}
          <Text style={uiStyles.note}>
            {offer?.handover?.receivedAt
              ? h.receivedAt.replace(
                  "{date}",
                  dates.format(new Date(offer.handover.receivedAt)),
                )
              : flow.submitted.replace("{date}", date)}
          </Text>
          {item.store_name !== "Komisio" ? (
            <Text style={uiStyles.note}>{item.store_name}</Text>
          ) : null}
        </Pressable>
      </View>
      {item.decline_note ? (
        <Text selectable style={uiStyles.body}>
          {item.decline_note}
        </Text>
      ) : null}
      {item.canWithdraw && onChanged ? (
        <WithdrawExternalRequest
          owner={owner}
          request={item.id}
          onChanged={onChanged}
        />
      ) : null}
    </View>
  );
}
