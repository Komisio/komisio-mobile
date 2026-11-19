import { Text } from "react-native";
import { router } from "expo-router";
import { useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { hasVerifiedEmail } from "@/lib/identity-gates";
import { homeCopy } from "@/lib/home-copy";
import { storeSellerCopy } from "@/lib/store-seller-copy";
import { StoreInformation } from "./store-information";
import { ItemListContextPicker } from "./item-list-context-picker";
import { Button, Card, uiStyles } from "./ui";

export function StoreIntroduction() {
  const { store, session } = useSession();
  const { d, locale } = useI18n();
  const t = storeSellerCopy[locale];
  if (!store) return null;
  const signedIn = hasVerifiedEmail(session?.user);
  return (
    <StoreInformation
      store={store}
      title={d.tabs.items}
      topSafeArea
      bottomSafeArea={false}
    >
      <ItemListContextPicker />
      {!signedIn ? (
        <Card>
          <Text accessibilityRole="header" style={uiStyles.heading}>
            {t.existingSeller}
          </Text>
          <Text style={uiStyles.body}>{t.signInHint}</Text>
          <Button
            label={homeCopy(locale).login}
            onPress={() =>
              router.push({
                pathname: session ? "/login" : "/account-auth",
                params: { returnTo: "items" },
              })
            }
          />
        </Card>
      ) : null}
      <Card>
        <Text accessibilityRole="header" style={uiStyles.heading}>
          {t.newSeller}
        </Text>
        <Text style={uiStyles.body}>{t.contactStore}</Text>
      </Card>
    </StoreInformation>
  );
}
