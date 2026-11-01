import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import {
  catalogueSummary,
  formatPrice,
  type CatalogueItem,
} from "@/lib/catalogue";
import { useI18n } from "@/lib/i18n";
import { ItemCard, colors, uiStyles } from "./ui";
import { CataloguePhoto } from "./catalogue-photo";

export function CatalogueRow({
  item,
  tenant,
  currency,
  onPress,
}: {
  item: CatalogueItem;
  tenant: string;
  currency: string;
  onPress: () => void;
}) {
  const { d, locale } = useI18n();
  const t = d.catalogue;
  const facts = catalogueSummary(item);
  const title = item.title?.trim() || t.untitled;
  const price = formatPrice(item.priceOre, currency, locale);
  return (
    <ItemCard
      dense
      label={[
        title,
        ...facts.map((f) => `${t.factLabels[f.slug]}: ${f.value}`),
        price,
        t.openItem,
      ].join(", ")}
      onPress={onPress}
      media={
        item.photo ? (
          <CataloguePhoto photo={item.photo} tenant={tenant} label={title} />
        ) : (
          <View
            style={styles.placeholder}
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <Image
              source={require("../../assets/brand/mark.svg")}
              style={styles.mark}
              accessible={false}
            />
          </View>
        )
      }
      trailing={
        <View
          style={styles.disclosure}
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Image
            source={require("../../assets/icons/arrow-right.svg")}
            style={styles.arrow}
            accessible={false}
          />
        </View>
      }
    >
      <Text style={styles.name}>{title}</Text>
      {facts.length > 0 ? (
        <Text style={styles.facts}>
          {facts.map((f) => f.value).join(" · ")}
        </Text>
      ) : null}
      <Text style={styles.price}>{price}</Text>
    </ItemCard>
  );
}

const styles = StyleSheet.create({
  name: { ...uiStyles.itemName, fontSize: 16, lineHeight: 21 },
  facts: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  price: { ...uiStyles.itemPrice, lineHeight: 23 },
  placeholder: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: colors.softAccent,
    alignItems: "center",
    justifyContent: "center",
  },
  mark: { width: 36, height: 36, opacity: 0.45 },
  disclosure: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.softAccent,
    alignItems: "center",
    justifyContent: "center",
  },
  arrow: { width: 16, height: 16 },
});
