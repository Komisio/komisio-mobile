import { useState } from "react";
import { Image, type ImageSource } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import {
  Button,
  Card,
  ItemCard,
  Message,
  NavigationRow,
  Screen,
  colors,
  uiStyles,
} from "./ui";

export function ProfileScreen() {
  const { d } = useI18n();
  const { session, store, chooseStore, signOut } = useSession();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const logout = async () => {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    try {
      await signOut();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen title={d.tabs.profile} bottomSafeArea={false}>
      <Card>
        <View style={styles.account}>
          <View style={styles.identity}>
            <SettingIcon source={require("../../assets/icons/profile.svg")} />
            <View style={styles.identityText}>
              <Text style={styles.caption}>{d.profile.signedInAs}</Text>
              <Text selectable style={styles.email}>
                {session?.user.email}
              </Text>
            </View>
          </View>
          <View style={styles.logout}>
            <Button
              label={d.account.logout}
              variant="text"
              busy={busy}
              onPress={() => void logout()}
            />
          </View>
        </View>
        {failed ? (
          <Message tone="error">{d.profile.logoutFailed}</Message>
        ) : null}
      </Card>
      <View style={styles.group}>
        <SettingRow
          label={d.profile.store}
          value={store?.name ?? d.store.title}
          icon={require("../../assets/icons/store.svg")}
          onPress={() => chooseStore(null)}
        />
        <SettingRow
          label={d.language}
          value={d.languageName}
          icon={require("../../assets/icons/language.svg")}
          onPress={() => router.push("/language")}
        />
      </View>
      <View style={styles.group}>
        <NavigationRow
          label={d.bank.title}
          onPress={() => router.push("/bank-account")}
        />
        <NavigationRow
          label={d.agreement.title}
          onPress={() => router.push("/agreement")}
        />
      </View>
    </Screen>
  );
}

function SettingIcon({ source }: { source: ImageSource }) {
  return (
    <View
      style={styles.iconCircle}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Image
        source={source}
        style={styles.icon}
        accessible={false}
        tintColor={colors.brand}
      />
    </View>
  );
}

function SettingRow({
  label,
  value,
  icon,
  onPress,
}: {
  label: string;
  value: string;
  icon: ImageSource;
  onPress: () => void;
}) {
  return (
    <ItemCard compact label={`${label}: ${value}`} onPress={onPress}>
      <View style={styles.row}>
        <SettingIcon source={icon} />
        <View style={styles.value}>
          <Text style={styles.caption}>{label}</Text>
          <Text style={uiStyles.rowTitle}>{value}</Text>
        </View>
        <View
          style={styles.arrowCircle}
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
      </View>
    </ItemCard>
  );
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  account: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexGrow: 1,
    flexBasis: 220,
  },
  identityText: { flex: 1, minWidth: 0, gap: 2 },
  logout: { marginLeft: "auto", maxWidth: "100%" },
  email: { fontSize: 15, lineHeight: 22, color: colors.text },
  caption: { fontSize: 13, lineHeight: 18, color: colors.muted },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  value: { flex: 1, minWidth: 0, gap: 2 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.softAccent,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { width: 22, height: 22 },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.softAccent,
    alignItems: "center",
    justifyContent: "center",
  },
  arrow: { width: 16, height: 16 },
});
