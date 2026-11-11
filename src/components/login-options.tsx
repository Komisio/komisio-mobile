import { router } from "expo-router";
import { useI18n } from "@/lib/i18n";
import { homeCopy } from "@/lib/home-copy";
import { Button, Message } from "./ui";

export function LoginOptions() {
  const { locale } = useI18n(),
    t = homeCopy(locale);
  return (
    <>
      <Message>{t.loginHint}</Message>
      <Button label={t.emailLogin} onPress={() => router.push("/login")} />
      <Button
        label={t.smsLogin}
        variant="secondary"
        onPress={() =>
          router.push({
            pathname: "/photo-phone",
            params: { destination: "requests" },
          })
        }
      />
    </>
  );
}
