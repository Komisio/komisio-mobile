import { router } from "expo-router";
import { Text } from "react-native";
import { useI18n } from "@/lib/i18n";
import type { ExternalOffer } from "@/lib/external-offer";
import type { ExternalRequest } from "@/lib/external-submission";
import { externalItemPresentation } from "@/lib/external-item-presentation";
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
  const { status, tone, date } = externalItemPresentation(item, offer, locale);
  return (
    <ItemCard
      compact
      label={`${item.description}. ${status}`}
      media={
        <ExternalItemPhoto
          owner={owner}
          photo={item.photos[0]}
          label={item.description}
        />
      }
      onPress={() =>
        router.push({
          pathname: "/external-item/[request]",
          params: { request: item.id },
        })
      }
    >
      <Text style={uiStyles.itemName}>
        {item.description}
        {item.brand ? ` · ${item.brand}` : ""}
      </Text>
      {offersLoaded || item.lifecycleStatus || item.status === "declined" ? (
        <StatusBadge tone={tone}>{status}</StatusBadge>
      ) : null}
      <Text style={uiStyles.note}>{date}</Text>
      {item.store_name !== "Komisio" ? (
        <Text style={uiStyles.note}>{item.store_name}</Text>
      ) : null}
    </ItemCard>
  );
}
