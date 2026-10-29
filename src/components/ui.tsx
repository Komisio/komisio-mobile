import { useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, uiStyles } from "./theme";
import { Brand } from "./brand";
export { colors, uiStyles } from "./theme";

export function PageHeading({
  title,
  intro,
}: {
  title: string;
  intro?: string;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text accessibilityRole="header" style={uiStyles.title}>
        {title}
      </Text>
      {intro ? <Text style={uiStyles.body}>{intro}</Text> : null}
    </View>
  );
}

export function StatusBadge({
  children,
  attention = false,
}: {
  children: ReactNode;
  attention?: boolean;
}) {
  return (
    <View style={[styles.badge, attention && styles.attention]}>
      <Text style={[styles.badgeText, attention && { color: colors.warning }]}>
        {children}
      </Text>
    </View>
  );
}

export function ItemCard({
  children,
  media,
  label,
  onPress,
}: {
  children: ReactNode;
  media?: ReactNode;
  label: string;
  onPress: () => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => [
        styles.itemCard,
        focused && styles.focused,
        pressed && styles.pressed,
      ]}
    >
      {media ? <View style={styles.media}>{media}</View> : null}
      <View style={styles.itemBody}>{children}</View>
    </Pressable>
  );
}

export function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return <Choice label={label} selected={selected} onPress={onPress} />;
}

export function Choice({
  label,
  selected,
  onPress,
  disabled = false,
  role = "button",
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  role?: "button" | "radio" | "checkbox";
}) {
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityLabel={label}
      accessibilityState={
        role === "button"
          ? { selected, disabled }
          : { checked: selected, disabled }
      }
      aria-checked={role === "button" ? undefined : selected}
      aria-pressed={role === "button" ? selected : undefined}
      aria-disabled={disabled}
      {...(Platform.OS === "web" && role !== "button"
        ? {
            // RN Web handles Space for buttons, but not radio/checkbox roles.
            onKeyDown: (
              event: Parameters<NonNullable<PressableProps["onKeyDown"]>>[0],
            ) => {
              if (event.nativeEvent.key === " ") {
                event.preventDefault();
                if (!disabled && !event.nativeEvent.repeat) onPress();
              }
            },
          }
        : {})}
      disabled={disabled}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        focused && styles.focused,
        pressed && styles.dimmed,
        disabled && styles.dimmed,
      ]}
    >
      <Text style={[styles.chipText, selected && styles.chipSelectedText]}>
        {role === "checkbox" ? `${selected ? "☑" : "☐"} ` : ""}
        {label}
      </Text>
    </Pressable>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return <View style={uiStyles.card}>{children}</View>;
}

export function NavigationRow({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <ItemCard label={label} onPress={onPress}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Text style={[uiStyles.rowTitle, { flex: 1 }]}>{label}</Text>
        <Text aria-hidden style={uiStyles.heading}>
          ›
        </Text>
      </View>
    </ItemCard>
  );
}

export function Screen({
  title,
  intro,
  children,
  brand = false,
}: {
  title: string;
  intro?: string;
  children?: ReactNode;
  brand?: boolean;
}) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {brand ? <Brand /> : null}
        <PageHeading title={title} intro={intro} />
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Field({ label, ...input }: TextInputProps & { label: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        style={styles.input}
        {...input}
      />
    </View>
  );
}

export function Button({
  label,
  onPress,
  busy,
  disabled,
  variant = "primary",
  accessibilityLabel,
  expanded,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  accessibilityLabel?: string;
  expanded?: boolean;
}) {
  const off = disabled || busy;
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: off, busy, expanded }}
      aria-disabled={off}
      aria-busy={busy}
      aria-expanded={expanded}
      disabled={off}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => [
        styles.button,
        variant === "secondary" && styles.secondary,
        focused && styles.focused,
        (pressed || off) && styles.dimmed,
      ]}
    >
      {busy ? (
        <ActivityIndicator
          color={variant === "primary" ? "#fff" : colors.brand}
        />
      ) : (
        <Text
          style={[
            styles.buttonText,
            variant === "secondary" && styles.secondaryText,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function Message({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "info" | "error";
}) {
  return (
    <Text
      accessibilityRole={tone === "error" ? "alert" : "text"}
      style={[styles.message, tone === "error" && styles.error]}
    >
      {children}
    </Text>
  );
}

export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.brand} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { ...uiStyles.content, paddingBottom: 32 },
  field: { gap: 6 },
  label: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
    color: colors.text,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.control,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  button: {
    minHeight: 52,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.brand,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.control,
  },
  dimmed: { opacity: 0.6 },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
    textAlign: "center",
  },
  secondaryText: { color: colors.brand },
  message: { ...uiStyles.body },
  error: { color: colors.danger },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  focused: {
    outlineColor: colors.brand,
    outlineWidth: 3,
    outlineOffset: 3,
    outlineStyle: "solid",
  },
  pressed: { backgroundColor: colors.accent },
  itemCard: {
    ...uiStyles.surface,
    padding: 16,
    minHeight: 72,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  itemBody: { flex: 1, minWidth: 0, gap: 6 },
  media: { width: 88, borderRadius: 10, overflow: "hidden" },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: colors.brand,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "500",
  },
  attention: { backgroundColor: colors.warningSurface },
  chip: {
    maxWidth: "100%",
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.control,
    backgroundColor: colors.surface,
    justifyContent: "center",
  },
  chipSelected: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { fontSize: 15, lineHeight: 23, color: colors.text },
  chipSelectedText: { color: colors.surface, fontWeight: "600" },
});
