import { StyleSheet } from "react-native";

// Shared with the portal's forest/paper identity; system type follows device settings.
export const colors = {
  brand: "#234e40",
  onBrand: "#ffffff",
  onBrandMuted: "#dbe8dc",
  brandDecoration: "#365e4f",
  highlight: "#bed4aa",
  accent: "#eaf1e7",
  text: "#203d35",
  muted: "#5b6d62",
  line: "#e3e9e2",
  control: "#788e7d",
  surface: "#ffffff",
  background: "#f7f8f5",
  danger: "#8f2828",
  dangerSurface: "#fff0ed",
  warning: "#745018",
  warningSurface: "#fbf1dc",
};

export const uiStyles = StyleSheet.create({
  content: {
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
    padding: 20,
    gap: 20,
  },
  title: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "700",
    color: colors.text,
  },
  heading: {
    fontSize: 21,
    lineHeight: 28,
    fontWeight: "600",
    color: colors.text,
  },
  body: { fontSize: 16, lineHeight: 24, color: colors.text },
  note: { fontSize: 14, lineHeight: 21, color: colors.muted },
  label: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
    color: colors.text,
  },
  rowTitle: {
    fontSize: 17,
    lineHeight: 25,
    fontWeight: "600",
    color: colors.text,
  },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  amount: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    color: colors.brand,
  },
  surface: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 16,
  },
});
