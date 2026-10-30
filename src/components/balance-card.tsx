import { useState } from "react";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { useI18n } from "@/lib/i18n";
import { formatPrice } from "@/lib/catalogue";
import { colors, IconButton, uiStyles } from "./ui";
import { InfoIcon } from "./brand";
import { DetailSheet } from "./detail-sheet";

export function BalanceCard({
  balance,
  currency,
}: {
  balance: { availableOre: number; reservedOre: number; paidOre: number };
  currency: string;
}) {
  const { d, locale } = useI18n();
  const [showInfo, setShowInfo] = useState(false);
  const money = (ore: number) => formatPrice(ore, currency, locale);
  return (
    <>
      <View style={styles.card}>
        <Image
          source={require("../../assets/brand/tag-silhouette.svg")}
          style={styles.tag}
          accessible={false}
          pointerEvents="none"
        />
        <View style={styles.top}>
          <Text style={styles.label}>{d.overview.available}</Text>
          <IconButton
            label={d.overview.balanceDetails}
            onPress={() => setShowInfo(true)}
          >
            <InfoIcon />
          </IconButton>
        </View>
        <Text style={styles.amount}>{money(balance.availableOre)}</Text>
        <View style={styles.details}>
          <View style={styles.part}>
            <Text style={styles.detailLabel}>{d.overview.reservedShort}</Text>
            <Text style={styles.value}>{money(balance.reservedOre)}</Text>
          </View>
          <View style={styles.part}>
            <Text style={styles.detailLabel}>{d.overview.paid}</Text>
            <Text style={styles.value}>{money(balance.paidOre)}</Text>
          </View>
        </View>
      </View>
      <DetailSheet
        title={d.overview.balanceDetails}
        open={showInfo}
        onClose={() => setShowInfo(false)}
      >
        <Text style={uiStyles.body}>{d.overview.balanceNote}</Text>
        <Text style={uiStyles.body}>{d.payouts.notice}</Text>
      </DetailSheet>
    </>
  );
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.brand,
    borderRadius: 24,
    borderCurve: "continuous",
    padding: 16,
    overflow: "hidden",
    boxShadow: "0px 4px 12px rgba(20, 62, 52, 0.10)",
  },
  tag: {
    position: "absolute",
    width: 240,
    height: 240,
    right: -95,
    top: -60,
    transform: [{ rotate: "-25deg" }],
  },
  top: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { ...uiStyles.label, color: colors.accent, flex: 1 },
  amount: {
    ...uiStyles.amount,
    color: colors.onBrand,
    fontSize: 36,
    lineHeight: 44,
    fontWeight: "700",
    marginBottom: 16,
  },
  details: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.brandDecoration,
    paddingTop: 12,
  },
  part: { flex: 1, flexBasis: 110, gap: 4 },
  detailLabel: { ...uiStyles.note, color: colors.onBrandMuted },
  value: {
    ...uiStyles.amount,
    color: colors.onBrand,
    fontSize: 18,
    lineHeight: 24,
  },
});
