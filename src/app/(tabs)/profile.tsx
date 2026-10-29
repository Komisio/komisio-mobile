import { useI18n } from "@/lib/i18n";
import { router } from "expo-router";
import { useSession } from "@/lib/session";
import { LanguagePicker } from "@/components/language-picker";
import { Button, Message, Screen } from "@/components/ui";

// S21: account, store, language and logout, with agreement and bank account links.
export default function ProfileTab() {
  const { d } = useI18n();
  const { session, store, chooseStore, signOut } = useSession();
  return (
    <Screen title={d.tabs.profile}>
      <Message>
        {d.profile.signedInAs}: {session?.user.email}
      </Message>
      <Message>
        {d.profile.store}: {store?.name}
      </Message>
      <LanguagePicker />
      <Button
        label={d.statements.title}
        variant="secondary"
        onPress={() => router.push("/statements")}
      />
      <Button
        label={d.bank.title}
        variant="secondary"
        onPress={() => router.push("/bank-account")}
      />
      <Button
        label={d.agreement.title}
        variant="secondary"
        onPress={() => router.push("/agreement")}
      />
      <Button
        label={d.login.changeStore}
        variant="secondary"
        onPress={() => chooseStore(null)}
      />
      <Button label={d.account.logout} onPress={() => void signOut()} />
    </Screen>
  );
}
