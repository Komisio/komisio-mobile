import { router } from "expo-router";
import { useI18n } from "@/lib/i18n";
import { accountAuthCopy } from "@/lib/account-auth-copy";
import { Button } from "./ui";

export function LoginOptions() {
  const { locale } = useI18n(),
    t = accountAuthCopy(locale);
  return (
    <>
      <Button label={t.title} onPress={() => router.push("/account-auth")} />
    </>
  );
}
