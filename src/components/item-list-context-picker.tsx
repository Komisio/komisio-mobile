import { Text, View } from "react-native";
import { router } from "expo-router";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { storeSellerCopy } from "@/lib/store-seller-copy";
import { InfoIcon } from "./brand";
import { StoreInformation } from "./store-information";
import { Button, Choice, ItemCard, uiStyles } from "./ui";

export function ItemListContextPicker({
  showAddress = false,
}: { showAddress?: boolean } = {}) {
  const { d, locale } = useI18n();
  const { store, lastStore, chooseStore } = useSession();
  const previous = store ?? lastStore;
  const select = (next: typeof store) => {
    chooseStore(next);
    router.setParams({
      source: undefined,
      sent: undefined,
      request: undefined,
      filter: undefined,
    });
  };
  return (
    <View style={{ gap: 4 }}>
      <View style={uiStyles.choices}>
        <Choice
          label="Komisio"
          selected={!store}
          onPress={() => select(null)}
        />
        {previous ? (
          <Choice
            label={previous.name}
            selected={store?.id === previous.id}
            onPress={() => select(previous)}
          />
        ) : null}
      </View>
      {store ? (
        <ItemCard
          compact
          label={`${storeSellerCopy[locale].handInInfo} · ${store.name}`}
          onPress={() => router.push("/store-info")}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <InfoIcon />
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={uiStyles.rowTitle}>
                {storeSellerCopy[locale].handInInfo}
              </Text>
              {showAddress ? (
                <StoreInformation store={store} addressOnly />
              ) : null}
            </View>
          </View>
        </ItemCard>
      ) : null}
      <Button
        label={store ? storeSellerCopy[locale].chooseAnother : d.store.title}
        variant="text"
        onPress={() => router.push("/home/stores")}
      />
    </View>
  );
}
