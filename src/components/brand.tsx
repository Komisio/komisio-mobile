import { Image } from "expo-image";
import { StyleSheet, Text, View, type ColorValue } from "react-native";
import { colors } from "./theme";

export function Brand() {
  return (
    <View accessible accessibilityLabel="Komisio" style={styles.brand}>
      <Image
        source={require("../../assets/brand/mark.svg")}
        style={{ width: 32, height: 32 }}
        accessible={false}
      />
      <Text style={styles.wordmark}>komisio</Text>
    </View>
  );
}

const icons = {
  store: require("../../assets/icons/store.svg"),
  items: require("../../assets/icons/items.svg"),
  overview: require("../../assets/icons/overview.svg"),
  money: require("../../assets/icons/money.svg"),
  profile: require("../../assets/icons/profile.svg"),
};

export function TabIcon({
  name,
  color,
  size,
  focused = false,
}: {
  name: keyof typeof icons;
  color: ColorValue;
  size: number;
  focused?: boolean;
}) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconSelected]}>
      <Image
        source={icons[name]}
        tintColor={typeof color === "string" ? color : colors.brand}
        style={{ width: size, height: size }}
        accessible={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    width: 44,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  tabIconSelected: { backgroundColor: colors.accent },
  brand: { flexDirection: "row", alignItems: "center", gap: 4 },
  wordmark: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "700",
    letterSpacing: -0.5,
    color: colors.brand,
  },
});
