import { useRef, useState } from "react";
import { useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { accountAuth } from "@/lib/account-auth-runtime";
import { accountAuthError } from "@/lib/account-auth";
import { accountAuthCopy, accountErrorText } from "@/lib/account-auth-copy";
import { centralPayoutCopy } from "@/lib/central-payout-copy";
import { Button, Field, Message, Screen } from "./ui";

export function CentralPayoutEmail({ owner }: { owner: string }) {
  const { session, refreshAssurance } = useSession(),
    { locale, d } = useI18n();
  const t = centralPayoutCopy[locale];
  const [email, setEmail] = useState(session?.user.new_email || "");
  const [sent, setSent] = useState(Boolean(session?.user.new_email)),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const lock = useRef(false);
  async function perform(check: boolean) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      if (check) {
        if (await accountAuth.refreshPayoutEmail(owner))
          await refreshAssurance();
        else setError(t.checkInbox);
      } else {
        await accountAuth.confirmPayoutEmail(owner, email, locale);
        setSent(true);
      }
    } catch (e) {
      const errorCode = accountAuthError(e);
      setError(
        errorCode === "AUTH_IDENTITY_USED"
          ? t.emailInUse
          : accountErrorText(locale, errorCode),
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Screen title={`${d.tabs.money} · Komisio`} keyboardInsets>
      <Message>{t.verifyEmail}</Message>
      <Field
        label={accountAuthCopy(locale).emailLabel}
        value={email}
        editable={!busy && !sent}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        maxLength={254}
      />
      {sent ? (
        <>
          <Message>{t.checkInbox}</Message>
          <Button
            label={t.confirmed}
            busy={busy}
            onPress={() => void perform(true)}
          />
          <Button
            label={accountAuthCopy(locale).change}
            variant="text"
            disabled={busy}
            onPress={() => {
              setSent(false);
              setError("");
            }}
          />
        </>
      ) : (
        <Button
          label={t.sendEmail}
          busy={busy}
          disabled={!email.trim()}
          onPress={() => void perform(false)}
        />
      )}
      {error ? <Message tone="error">{error}</Message> : null}
    </Screen>
  );
}
