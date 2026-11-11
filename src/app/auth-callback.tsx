import { useEffect, useRef, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { accountAuth, accountAuthRedirect } from "@/lib/account-auth-runtime";
import { accountAuthError } from "@/lib/account-auth";
import { accountAuthCopy, accountErrorText } from "@/lib/account-auth-copy";
import { useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { Button, Loading, Message, Screen } from "@/components/ui";

export default function AuthCallback() {
  const params = useLocalSearchParams<{
    flow?: string;
    code?: string;
    error?: string;
  }>();
  const { refreshAssurance } = useSession(),
    { locale } = useI18n();
  const [error, setError] = useState("");
  const started = useRef(false);
  const { flow, code, error: providerError } = params;
  const malformed = [flow, code, providerError].some(
    (value) => value !== undefined && typeof value !== "string",
  );
  useEffect(() => {
    if (started.current || malformed) return;
    started.current = true;
    const callback = new URL(accountAuthRedirect);
    for (const [key, value] of Object.entries({
      flow,
      code,
      error: providerError,
    })) {
      if (value !== undefined) callback.searchParams.set(key, value);
    }
    void accountAuth
      .finishOAuth(callback.href)
      .then(async (linked) => {
        await refreshAssurance();
        router.replace(linked ? "/account-methods" : "/home");
      })
      .catch((e) => setError(accountAuthError(e)));
  }, [flow, code, providerError, malformed, refreshAssurance]);
  return (
    <Screen topSafeArea={false}>
      {error || malformed ? (
        <>
          <Message tone="error">
            {accountErrorText(locale, malformed ? "AUTH_EXPIRED" : error)}
          </Message>
          <Button
            label={accountAuthCopy(locale).back}
            onPress={() => router.replace("/home")}
          />
        </>
      ) : (
        <Loading />
      )}
    </Screen>
  );
}
