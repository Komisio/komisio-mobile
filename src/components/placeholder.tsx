import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { Button, Loading, Message, Screen } from "./ui";

// Screens that are not built yet still show whether the signed-in user has a
// seller account in the chosen store.
export function Placeholder({ title }: { title: string }) {
  const { d } = useI18n();
  const { account, store, chooseStore, retryAccount } = useSession();
  if (account === undefined) return <Loading />;
  return (
    <Screen title={title}>
      {account === "failed" ? (
        <>
          <Message tone="error">{d.login.offline}</Message>
          <Button label={d.retry} variant="secondary" onPress={retryAccount} />
        </>
      ) : account ? (
        <Message>{d.soon}</Message>
      ) : (
        <>
          <Message tone="error">
            {d.account.missing.replace("{store}", store?.name ?? "")}
          </Message>
          <Button
            label={d.login.changeStore}
            variant="secondary"
            onPress={() => chooseStore(null)}
          />
        </>
      )}
    </Screen>
  );
}
