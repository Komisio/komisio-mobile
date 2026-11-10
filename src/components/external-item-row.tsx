import { Text, View } from "react-native";
import { useI18n } from "@/lib/i18n";
import { formattingLocale } from "@/lib/locale";
import { photoFlowCopy } from "@/lib/photo-flow-copy";
import { externalSubmissionCopy } from "@/lib/external-submission-copy";
import type { ExternalRequest } from "@/lib/external-submission";
import { ExternalItemPhoto } from "./external-item-photo";
import { StatusBadge, uiStyles } from "./ui";

export function ExternalItemRow({
  item,
  owner,
}: {
  item: ExternalRequest;
  owner: string;
}) {
  const { locale } = useI18n();
  const t = externalSubmissionCopy(locale),
    flow = photoFlowCopy(locale);
  const date = new Intl.DateTimeFormat(formattingLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(item.created_at));
  return (
    <View style={[uiStyles.card, { gap: 8 }]}>
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
          <StatusBadge tone={item.status === "waiting" ? "neutral" : "warning"}>
            {item.status === "waiting" ? t.waiting : t.declined}
          </StatusBadge>
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
}
