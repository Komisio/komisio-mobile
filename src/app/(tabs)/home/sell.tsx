import { router } from "expo-router";
import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";
import { Card, Screen, colors, uiStyles } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { photoFlowCopy } from "@/lib/photo-flow-copy";
import { photoDraftCopy } from "@/lib/photo-draft-copy";

export default function Welcome() {
  const { locale } = useI18n();
  const t = photoFlowCopy(locale);
  return (
    <Screen topSafeArea={false} bottomSafeArea={false}>
      <Text accessibilityRole="header" style={uiStyles.title}>
        {t.welcome}
      </Text>
      <Text style={uiStyles.body}>{t.welcomeIntro}</Text>
      <View
        style={{
          backgroundColor: colors.brand,
          borderRadius: 24,
          padding: 20,
          gap: 16,
        }}
      >
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: colors.accent,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image
            source={require("../../../../assets/icons/camera.svg")}
            style={{ width: 28, height: 28 }}
            accessible={false}
          />
        </View>
        <Text style={[uiStyles.heading, { color: colors.onBrand }]}>
          {photoDraftCopy(locale).title}
        </Text>
        <Text style={[uiStyles.body, { color: colors.onBrandMuted }]}>
          {t.hero}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/photo-draft")}
          style={({ pressed }) => ({
            backgroundColor: colors.accent,
            borderRadius: 12,
            minHeight: 48,
            padding: 12,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.75 : 1,
          })}
        >
          <Text style={[uiStyles.rowTitle, { color: colors.brand }]}>
            {t.start}
          </Text>
        </Pressable>
      </View>
      <Card>
        {t.steps.map((label, i) => (
          <View
            key={label}
            style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.accent,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={uiStyles.label}>{i + 1}</Text>
            </View>
            <Text style={[uiStyles.label, { flex: 1 }]}>{label}</Text>
          </View>
        ))}
      </Card>
      <Text style={[uiStyles.note, { textAlign: "center" }]}>
        {t.accountHint}
      </Text>
    </Screen>
  );
}
