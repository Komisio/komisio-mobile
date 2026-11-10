import { router } from "expo-router";
import { externalOfferCopy } from "@/lib/external-offer-copy";
import { offerAmount, type ExternalOffer } from "@/lib/external-offer";
import { Text, View } from "react-native";
import { useI18n } from "@/lib/i18n";
import { formattingLocale } from "@/lib/locale";
import { photoFlowCopy } from "@/lib/photo-flow-copy";
import { externalSubmissionCopy } from "@/lib/external-submission-copy";
import type { ExternalRequest } from "@/lib/external-submission";
import { ExternalItemPhoto } from "./external-item-photo";
import { ItemCard, StatusBadge, uiStyles } from "./ui";

export function ExternalItemRow({
  item,
  owner,
  offer,
  offersLoaded = true,
}: {
  item: ExternalRequest;
  owner: string;
  offer?: ExternalOffer;
  offersLoaded?: boolean;
}) {
  const { locale } = useI18n();
  const t = externalSubmissionCopy(locale),
    flow = photoFlowCopy(locale);
  const date = new Intl.DateTimeFormat(formattingLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(item.created_at));
  const o = externalOfferCopy(locale);
  const status = offer
    ? offer.status === "offered"
      ? o.offerBadge.replace(
          "{amount}",
          offerAmount(offer.sellerAmountOre, formattingLocale(locale)),
        )
      : offer.status === "accepted"
        ? o.accepted
        : offer.status === "declined"
          ? o.declined
          : o.expired
    : item.status === "waiting"
      ? t.waiting
      : t.declined;
  const content = (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
        <ExternalItemPhoto
          owner={owner}
          photo={item.photos[0]}
          label={item.description}
        />
        <View style={{ flex: 1, gap: 4 }}>
          <Text selectable style={uiStyles.itemName}>
            {item.description}
            {item.brand ? ` · ${item.brand}` : ""}
          </Text>
          {offersLoaded || item.status === "declined" ? (
            <StatusBadge
              tone={
                offer?.status === "offered"
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
            {flow.submitted.replace("{date}", date)}
          </Text>
          {item.store_name !== "Komisio" ? (
            <Text style={uiStyles.note}>{item.store_name}</Text>
          ) : null}
        </View>
      </View>
      {item.decline_note ? (
        <Text selectable style={uiStyles.body}>
          {item.decline_note}
        </Text>
      ) : null}
    </View>
  );
  return offer ? (
    <ItemCard
      label={`${item.description}. ${status}`}
      onPress={() =>
        router.push({
          pathname: "/external-offer/[offer]",
          params: { offer: offer.id },
        })
      }
    >
      {content}
    </ItemCard>
  ) : (
    <View style={uiStyles.card}>{content}</View>
  );
}
