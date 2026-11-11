import { Stack } from "expo-router";
import { useI18n } from "@/lib/i18n";
import { homeCopy } from "@/lib/home-copy";
import { detailHeaderOptions } from "@/components/detail-navigation";

export const unstable_settings = { initialRouteName: "index" };

export default function HomeLayout() {
  const { locale } = useI18n();
  const t = homeCopy(locale);
  return (
    <Stack
      screenOptions={({ navigation }) =>
        detailHeaderOptions("/home", t.home, navigation.canGoBack())
      }
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="sell" />
      <Stack.Screen name="stores" />
      <Stack.Screen name="shop" />
    </Stack>
  );
}
