import { router, type Href } from "expo-router";
import { Image } from "expo-image";
import { Pressable, StyleSheet } from "react-native";
import { colors } from "./theme";

export function detailHeaderOptions(
  fallback: Href,
  label: string,
  canGoBack: boolean,
) {
  return {
    headerShown: true,
    // Keep the existing large, wrapping heading in the screen content.
    title: "",
    headerBackButtonDisplayMode: "minimal" as const,
    headerTintColor: colors.brand,
    headerStyle: { backgroundColor: colors.background },
    headerShadowVisible: false,
    headerUserInterfaceStyle: "light" as const,
    // With history, leave the native back button and swipe gesture untouched.
    // A direct link still needs a visible route back into the seller app.
    ...(!canGoBack
      ? {
          headerLeft: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={label}
              onPress={() =>
                router.canGoBack() ? router.back() : router.replace(fallback)
              }
              style={({ pressed }) => [
                styles.back,
                pressed && { backgroundColor: colors.accent },
              ]}
            >
              <Image
                source={require("../../assets/icons/back.svg")}
                style={{ width: 24, height: 24 }}
                accessible={false}
              />
            </Pressable>
          ),
        }
      : {}),
  };
}

const styles = StyleSheet.create({
  back: {
    minWidth: 48,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
  },
});
