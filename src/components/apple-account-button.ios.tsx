import * as AppleAuthentication from "expo-apple-authentication";
import { View, StyleSheet } from "react-native";
export function AppleAccountButton({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <View
      pointerEvents={disabled ? "none" : "auto"}
      style={disabled && styles.disabled}
    >
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        cornerRadius={12}
        style={styles.button}
        onPress={() => {
          if (!disabled) onPress();
        }}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  button: { width: "100%", height: 50 },
  disabled: { opacity: 0.5 },
});
