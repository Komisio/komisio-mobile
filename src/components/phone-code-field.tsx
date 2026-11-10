import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { colors, uiStyles } from "./ui";

// One native input preserves SMS autofill, paste, deletion and screen-reader order.
// The six cells are presentation only, not six separate focus targets.
export function PhoneCodeField({
  label,
  value,
  onChange,
  disabled,
  onSubmit,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  onSubmit: () => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={uiStyles.label}>{label}</Text>
      <View style={{ minHeight: 56, justifyContent: "center" }}>
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          aria-hidden
          style={{ flexDirection: "row", gap: 6 }}
        >
          {Array.from({ length: 6 }, (_, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                minHeight: 56,
                borderRadius: 10,
                borderWidth: focused && i === Math.min(value.length, 5) ? 2 : 1,
                borderColor:
                  focused && i === Math.min(value.length, 5)
                    ? colors.brand
                    : colors.control,
                backgroundColor: colors.surface,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={[uiStyles.amount, { paddingVertical: 8 }]}>
                {value[i] ?? " "}
              </Text>
            </View>
          ))}
        </View>
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={(text) => onChange(text.replace(/\D/g, "").slice(0, 6))}
          editable={!disabled}
          keyboardType="number-pad"
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          maxLength={6}
          caretHidden
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={onSubmit}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            opacity: 0.02,
            fontSize: 22,
            color: "transparent",
          }}
        />
      </View>
    </View>
  );
}
