import { ScrollView, Text, View } from "react-native";
import { useI18n } from "@/lib/i18n";
import { photoFlowCopy } from "@/lib/photo-flow-copy";
import { photoDraftCopy } from "@/lib/photo-draft-copy";
import { externalSubmissionCopy } from "@/lib/external-submission-copy";
import type { DraftPhoto } from "@/lib/photo-draft";
import { PhotoDraftImage } from "./photo-draft-image";
import { Card, colors, uiStyles } from "./ui";

export function PhotoStep({ step }: { step: 1 | 2 | 3 }) {
  const { locale } = useI18n();
  const t = photoFlowCopy(locale);
  return (
    <View
      accessible
      accessibilityLabel={t.step.replace("{step}", String(step))}
      style={{ gap: 8 }}
    >
      <Text style={[uiStyles.note, { textAlign: "right" }]}>
        {t.step.replace("{step}", String(step))}
      </Text>
      <View style={{ flexDirection: "row", gap: 6 }}>
        {[1, 2, 3].map((n) => (
          <View
            key={n}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              backgroundColor: n <= step ? colors.brand : colors.line,
            }}
          />
        ))}
      </View>
    </View>
  );
}

export function PhotoStrip({ photos }: { photos: DraftPhoto[] }) {
  const { locale, d } = useI18n();
  const t = photoDraftCopy(locale);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8 }}
    >
      {photos.map((photo, i) => (
        <View key={photo.id} style={{ width: 56 }}>
          <PhotoDraftImage
            uri={photo.uri}
            label={t.photo.replace("{count}", String(i + 1))}
            errorText={t.previewError}
            retryLabel={d.retry}
          />
        </View>
      ))}
    </ScrollView>
  );
}

export function PhotoCapacity({ count }: { count: number }) {
  const { locale } = useI18n();
  const t = photoFlowCopy(locale);
  const label = externalSubmissionCopy(locale).activeCount.replace(
    "{count}",
    String(count),
  );
  return (
    <Card>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: 4,
        }}
      >
        <Text style={uiStyles.label}>{label}</Text>
        <Text style={uiStyles.note}>
          {t.remaining.replace("{count}", String(Math.max(0, 10 - count)))}
        </Text>
      </View>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={label}
        accessibilityValue={{ min: 0, max: 10, now: count }}
        style={{
          height: 6,
          borderRadius: 3,
          backgroundColor: colors.line,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: 6,
            width: `${Math.min(100, count * 10)}%`,
            backgroundColor: colors.brand,
          }}
        />
      </View>
    </Card>
  );
}
