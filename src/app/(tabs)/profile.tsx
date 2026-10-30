import { Text, View } from "react-native";
import { useI18n } from "@/lib/i18n";
import { router } from "expo-router";
import { useSession } from "@/lib/session";
import { LanguagePicker } from "@/components/language-picker";
import { Button, Card, NavigationRow, Screen, uiStyles } from "@/components/ui";
// S21: account, store, language and logout, with agreement and bank account links.
export default function ProfileTab() {
  const { d } = useI18n();
  const { session, store, chooseStore, signOut } = useSession();
  return (
    <Screen title={d.tabs.profile} bottomSafeArea={false}>
      <Card>
        <View style={{ gap: 4 }}>
          <Text style={uiStyles.label}>{d.profile.signedInAs}</Text>
          <Text selectable style={uiStyles.body}>
            {session?.user.email}
          </Text>
        </View>
        <View style={{ gap: 4 }}>
          <Text style={uiStyles.label}>{d.profile.store}</Text>
          <Text style={uiStyles.rowTitle}>{store?.name}</Text>
        </View>
      </Card>
      <View style={{ gap: 12 }}>
        <Text style={uiStyles.label}>{d.language}</Text>
        <LanguagePicker />
      </View>
      <View style={{ gap: 8 }}>
        <NavigationRow
          label={d.bank.title}
          onPress={() => router.push("/bank-account")}
        />
        <NavigationRow
          label={d.agreement.title}
          onPress={() => router.push("/agreement")}
        />
      </View>
      <Button
        label={d.login.changeStore}
        variant="secondary"
        onPress={() => chooseStore(null)}
      />
      <Button
        label={d.account.logout}
        variant="secondary"
        onPress={() => void signOut()}
      />
    </Screen>
  );
}
