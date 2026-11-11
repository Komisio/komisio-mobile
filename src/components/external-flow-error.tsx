import { useState } from "react";
import { router, type ErrorBoundaryProps } from "expo-router";
import { homeCopy } from "@/lib/home-copy";
import { useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { externalSubmissionCopy } from "@/lib/external-submission-copy";
import { Button, Message, Screen } from "./ui";

/** A rendering failure must not make a phone owner's startup route unusable. */
export function ExternalFlowError({ retry }: ErrorBoundaryProps) {
  const { locale, d } = useI18n();
  const t = externalSubmissionCopy(locale);
  const { signOut } = useSession();
  const [busy, setBusy] = useState(false);
  return (
    <Screen title="Komisio">
      <Message tone="error">{t.loadError}</Message>
      <Button
        label={homeCopy(locale).home}
        onPress={() => router.replace("/home")}
      />
      <Button
        label={d.retry}
        busy={busy}
        onPress={() => {
          setBusy(true);
          void retry()
            .catch(() => {})
            .finally(() => setBusy(false));
        }}
      />
      <Button
        label={t.signOut}
        variant="text"
        disabled={busy}
        onPress={() => {
          setBusy(true);
          void signOut()
            .catch(() => {})
            .finally(() => setBusy(false));
        }}
      />
    </Screen>
  );
}
