import { useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
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

function useControlFocus() {
  const [focused, setFocused] = useState(false);
  const focusProps: Pick<
    PressableProps,
    "onFocus" | "onBlur" | "onKeyDown" | "onPointerDown"
  > = {
    onFocus: (event) => {
      // RN Web forwards the DOM element. Native keeps its existing focus ring.
      const target = event.currentTarget as unknown as {
        matches?: (selector: string) => boolean;
      };
      setFocused(
        Platform.OS !== "web" || (target.matches?.(":focus-visible") ?? true),
      );
    },
    onBlur: () => setFocused(false),
    ...(Platform.OS === "web"
      ? {
          // Also handle modality changes while the same control retains focus.
          onPointerDown: () => setFocused(false),
          onKeyDown: () => setFocused(true),
        }
      : {}),
  };
  return { focused, focusProps };
}

export function PageHeading({
  title,
  intro,
}: {
  title: string;
  intro?: string;
}) {
  return (
    <View style={{ gap: 8 }}>
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
  tone = "positive",
  live = false,
}: {
  children: ReactNode;
  attention?: boolean;
  tone?: "neutral" | "positive" | "warning";
  live?: boolean;
}) {
  return (
    <View
      accessibilityLiveRegion={live ? "polite" : undefined}
      style={[
        styles.badge,
        tone === "neutral" && styles.neutralBadge,
        (attention || tone === "warning") && styles.attention,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          tone === "neutral" && { color: colors.muted },
          (attention || tone === "warning") && { color: colors.warning },
        ]}
      >
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
  compact = false,
  dense = false,
  trailing,
}: {
  children: ReactNode;
  media?: ReactNode;
  label: string;
  onPress: () => void;
  compact?: boolean;
  dense?: boolean;
  trailing?: ReactNode;
}) {
  const { focused, focusProps } = useControlFocus();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      {...focusProps}
      style={({ pressed }) => [
        styles.itemCard,
        compact && styles.compactItem,
        dense && styles.denseItem,
        focused && styles.focused,
        pressed && styles.pressed,
      ]}
    >
      {media ? (
        <View
          style={[
            styles.media,
            compact && styles.compactMedia,
            dense && styles.denseMedia,
          ]}
        >
          {media}
        </View>
      ) : null}
      <View style={styles.itemBody}>{children}</View>
      {trailing}
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

export function IconButton({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: ReactNode;
}) {
  const { focused, focusProps } = useControlFocus();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      {...focusProps}
      style={({ pressed }) => [
        styles.iconButton,
        focused && styles.focused,
        pressed && styles.pressed,
      ]}
    >
      {children}
    </Pressable>
  );
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
  const { focused, focusProps } = useControlFocus();
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
      {...focusProps}
      {...(Platform.OS === "web" && role !== "button"
        ? {
            // RN Web handles Space for buttons, but not radio/checkbox roles.
            onKeyDown: (
              event: Parameters<NonNullable<PressableProps["onKeyDown"]>>[0],
            ) => {
              focusProps.onKeyDown?.(event);
              if (event.nativeEvent.key === " ") {
                event.preventDefault();
                if (!disabled && !event.nativeEvent.repeat) onPress();
              }
            },
          }
        : {})}
      disabled={disabled}
      onPress={onPress}
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
        <View
          aria-hidden
          importantForAccessibility="no-hide-descendants"
          style={styles.navigationArrow}
        >
          <Text style={[uiStyles.heading, { color: colors.brand }]}>›</Text>
        </View>
      </View>
    </ItemCard>
  );
}

export function Screen({
  title,
  intro,
  children,
  brand = false,
  bottomSafeArea = true,
  topSafeArea = true,
  refresh,
}: {
  title?: string;
  intro?: string;
  children?: ReactNode;
  brand?: boolean;
  bottomSafeArea?: boolean;
  topSafeArea?: boolean;
  refresh?: { refreshing: boolean; onRefresh: () => void; label: string };
}) {
  return (
    <SafeAreaView
      style={styles.safe}
      edges={{
        top: topSafeArea ? "additive" : "off",
        bottom: bottomSafeArea ? "additive" : "off",
        left: "additive",
        right: "additive",
      }}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        refreshControl={
          refresh ? (
            <RefreshControl
              refreshing={refresh.refreshing}
              onRefresh={refresh.onRefresh}
              accessibilityLabel={refresh.label}
              tintColor={colors.brand}
              colors={[colors.brand]}
            />
          ) : undefined
        }
      >
        {brand ? <Brand /> : null}
        {title ? <PageHeading title={title} intro={intro} /> : null}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Field({
  label,
  labelHidden = false,
  ...input
}: TextInputProps & { label: string; labelHidden?: boolean }) {
  return (
    <View style={styles.field}>
      {!labelHidden ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        accessibilityLabel={label}
        placeholder={labelHidden ? label : undefined}
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
  variant?: "primary" | "secondary" | "text";
  accessibilityLabel?: string;
  expanded?: boolean;
}) {
  const off = disabled || busy;
  const { focused, focusProps } = useControlFocus();
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
      {...focusProps}
      style={({ pressed }) => [
        styles.button,
        variant === "secondary" && styles.secondary,
        variant === "text" && styles.textButton,
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
            variant !== "primary" && styles.secondaryText,
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
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
  },
  navigationArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
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
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  button: {
    minHeight: 52,
    borderRadius: 14,
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
  textButton: {
    backgroundColor: "transparent",
    minHeight: 48,
    paddingHorizontal: 8,
    paddingVertical: 10,
    alignSelf: "flex-start",
  },
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
  itemBody: { flex: 1, minWidth: 0, gap: 4 },
  media: { width: 88, borderRadius: 10, overflow: "hidden" },
  compactItem: { padding: 12, gap: 12, minHeight: 76 },
  compactMedia: { width: 72 },
  denseItem: { padding: 10, gap: 10, minHeight: 84, alignItems: "center" },
  denseMedia: { width: 64, borderRadius: 12 },
  badge: {
    maxWidth: "100%",
    alignSelf: "flex-start",
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    color: colors.brand,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  attention: { backgroundColor: colors.warningSurface },
  neutralBadge: { backgroundColor: colors.neutralSurface },
  chip: {
    maxWidth: "100%",
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.control,
    backgroundColor: colors.surface,
    justifyContent: "center",
  },
  chipSelected: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { fontSize: 15, lineHeight: 23, color: colors.text },
  chipSelectedText: { color: colors.surface, fontWeight: "600" },
});
