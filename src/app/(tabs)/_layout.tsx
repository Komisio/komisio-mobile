import { Tabs } from "expo-router/tabs";
import { useState } from "react";
import { Text, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useI18n } from "@/lib/i18n";
import { colors } from "@/components/ui";
import { TabIcon } from "@/components/brand";

// Version 1 seller tabs (docs/screens.md): the store (S10–S12), my items
// (S19, S20), overview (S22 + S51), money (payouts) and
// profile (S21, S25).
export default function TabsLayout() {
  const { d, locale } = useI18n();
  const { bottom } = useSafeAreaInsets();
  const { fontScale, width } = useWindowDimensions();
  const layoutKey = `${width}:${fontScale}:${locale}`;
  const [labelLayout, setLabelLayout] = useState({ key: "", height: 0 });
  const labelHeight = Math.max(
    14 * Math.max(1, fontScale),
    labelLayout.key === layoutKey ? labelLayout.height : 0,
  );
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelPosition: "below-icon",
        // Start with one line; grow only when the measured labels wrap.
        // The navigator applies the bottom inset as padding within this height.
        tabBarStyle: {
          backgroundColor: colors.accent,
          borderTopColor: colors.line,
          // 28pt icon slot + 5pt item padding on each side + a hairline.
          height: 39 + labelHeight + bottom,
          paddingBottom: bottom,
          borderTopWidth: 1,
        },
        tabBarLabel: ({ children, color }) => (
          <Text
            key={`${layoutKey}:${children}`}
            onLayout={({ nativeEvent }) => {
              const height = Math.ceil(nativeEvent.layout.height);
              setLabelLayout((previous) =>
                previous.key === layoutKey && previous.height >= height
                  ? previous
                  : { key: layoutKey, height },
              );
            }}
            style={{
              color,
              fontSize: 11,
              lineHeight: 14,
              fontWeight: "600",
              textAlign: "center",
              alignSelf: "stretch",
              // Recover some of the item's horizontal padding for full labels.
              marginHorizontal: -3,
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
