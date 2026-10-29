import { Tabs } from "expo-router/tabs";
import { Text, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useI18n } from "@/lib/i18n";
import { colors } from "@/components/ui";
import { TabIcon } from "@/components/brand";

// Version 1 seller tabs (docs/screens.md): the store (S10–S12), my items
// (S19, S20), overview (S22 + S51), money (payouts and statements) and
// profile (S21, S25).
export default function TabsLayout() {
  const { d } = useI18n();
  const { bottom } = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.muted,
        tabBarActiveBackgroundColor: colors.accent,
        tabBarLabelPosition: "below-icon",
        // Two full label lines, including at increased system text size.
        // The navigator applies the bottom inset as padding within this height.
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          height: 44 + 32 * Math.max(1, fontScale) + bottom,
        },
        tabBarLabel: ({ children, color }) => (
          <Text
            style={{
              color,
              fontSize: 12,
              lineHeight: 16,
              fontWeight: "600",
              textAlign: "center",
              alignSelf: "stretch",
            }}
          >
            {children}
          </Text>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: d.tabs.store,
          tabBarIcon: (props) => <TabIcon name="store" {...props} />,
        }}
      />
      <Tabs.Screen
        name="items"
        options={{
          title: d.tabs.items,
          tabBarIcon: (props) => <TabIcon name="items" {...props} />,
        }}
      />
      <Tabs.Screen
        name="overview"
        options={{
          title: d.tabs.overview,
          tabBarIcon: (props) => <TabIcon name="overview" {...props} />,
        }}
      />
      <Tabs.Screen
        name="money"
        options={{
          title: d.tabs.money,
          tabBarIcon: (props) => <TabIcon name="money" {...props} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: d.tabs.profile,
          tabBarIcon: (props) => <TabIcon name="profile" {...props} />,
        }}
      />
    </Tabs>
  );
}
