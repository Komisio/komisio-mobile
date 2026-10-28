import { Tabs } from "expo-router/tabs";
import { useI18n } from "@/lib/i18n";
import { colors } from "@/components/ui";

// Version 1 seller tabs (docs/screens.md): the store (S10–S12), my items
// (S19, S20), overview (S22 + S51), money (payouts and statements) and
// profile (S21, S25).
export default function TabsLayout() {
  const { d } = useI18n();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen name="index" options={{ title: d.tabs.store }} />
      <Tabs.Screen name="items" options={{ title: d.tabs.items }} />
      <Tabs.Screen name="overview" options={{ title: d.tabs.overview }} />
      <Tabs.Screen name="money" options={{ title: d.tabs.money }} />
      <Tabs.Screen name="profile" options={{ title: d.tabs.profile }} />
    </Tabs>
  );
}
