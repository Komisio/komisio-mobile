import { Image } from "expo-image";
import { router } from "expo-router";
import { StyleSheet, Text } from "react-native";
import { useI18n } from "@/lib/i18n";
import { homeCopy } from "@/lib/home-copy";
import { accountAuthCopy } from "@/lib/account-auth-copy";
import { useSession } from "@/lib/session";
import { Button, ItemCard, Screen, uiStyles } from "./ui";

export function HomeScreen() {
  const { locale } = useI18n();
  const { chooseStore, session } = useSession();
  const t = homeCopy(locale);
  return (
    <Screen brand bottomSafeArea={false}>
      <Image
        source={require("../../assets/photos/home-dress.png")}
        accessibilityLabel={t.photoAlt}
        style={styles.hero}
        contentFit="cover"
        contentPosition={{ top: "30%", left: "50%" }}
      />
      <Text accessibilityRole="header" style={uiStyles.title}>
        {t.title}
      </Text>
      <ItemCard
        label={t.komisio}
        onPress={() => {
          chooseStore(null);
          router.push("/photo-draft");
        }}
      >
        <Text style={uiStyles.heading}>{t.komisio}</Text>
        <Text style={uiStyles.note}>{t.komisioHint}</Text>
      </ItemCard>
      <ItemCard label={t.store} onPress={() => router.push("/home/stores")}>
        <Text style={uiStyles.heading}>{t.store}</Text>
        <Text style={uiStyles.note}>{t.storeHint}</Text>
      </ItemCard>
      {!session ? (
        <Button
          label={accountAuthCopy(locale).link}
          variant="text"
          onPress={() => router.push("/account-auth")}
        />
      ) : null}
    </Screen>
  );
}
const styles = StyleSheet.create({
  hero: { width: "100%", aspectRatio: 1.65, borderRadius: 20 },
});
