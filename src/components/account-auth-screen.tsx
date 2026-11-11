import { useEffect, useRef, useState } from "react";
import { Keyboard, Platform, Text, View } from "react-native";
import { Redirect, router, usePreventRemove } from "expo-router";
import { Button, Card, Field, Message, Screen, uiStyles } from "./ui";
import { AppleAccountButton } from "./apple-account-button";
import { GoogleAccountButton } from "./google-account-button";
import { PrivacyLink } from "./privacy-link";
import {
  accountAuth,
  connectAccountProvider,
} from "@/lib/account-auth-runtime";
import {
  accountAuthError,
  type AccountProvider,
  type EmailTicket,
} from "@/lib/account-auth";
import { accountAuthCopy, accountErrorText } from "@/lib/account-auth-copy";
import { emailLoginCopy } from "@/lib/email-login-copy";
import { hasVerifiedPhone } from "@/lib/identity-gates";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";

export function AccountAuthScreen({ link = false }: { link?: boolean }) {
  const { locale } = useI18n(),
    t = accountAuthCopy(locale);
  const { session, refreshAssurance } = useSession();
  const [providers, setProviders] = useState<{
    apple: boolean;
    google: boolean;
  } | null>(null);
  const [emailOpen, setEmailOpen] = useState(false),
    [other, setOther] = useState(false);
  const [email, setEmail] = useState(""),
    [code, setCode] = useState("");
  const [ticket, setTicket] = useState<EmailTicket | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [done, setDone] = useState(false);
  const [retryAt, setRetryAt] = useState(0),
    [now, setNow] = useState(Date.now);
  const locked = useRef(false),
    alive = useRef(true);
  const releaseNavigation = usePreventRemove(busy, () => {});
  useEffect(() => {
    alive.current = true;
    void accountAuth
      .providers()
      .then((value) => {
        if (alive.current) setProviders(value);
      })
      .catch(() => {
        if (alive.current) setProviders({ apple: false, google: false });
      });
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    if (!retryAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [retryAt]);
  async function run(work: () => Promise<boolean>) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    setDone(false);
    Keyboard.dismiss();
    try {
      if (await work()) {
        await refreshAssurance();
        if (alive.current) {
          releaseNavigation();
          setDone(link);
        }
      }
    } catch (e) {
      const safe = accountAuthError(e);
      if (alive.current && safe !== "AUTH_CANCELLED")
        setError(accountErrorText(locale, safe));
    } finally {
      locked.current = false;
      if (alive.current) setBusy(false);
    }
  }
  function social(provider: AccountProvider) {
    void run(() => connectAccountProvider(provider, link));
  }
  async function send() {
    return run(async () => {
      const next = await accountAuth.sendEmail(email, locale);
      if (alive.current) {
        setTicket(next);
        setCode("");
        setRetryAt(Date.now() + 60000);
        setNow(Date.now());
      }
      return false;
    });
  }
  if (session && !link && !busy) return <Redirect href="/home" />;
  if (!session && link) return <Redirect href="/account-auth" />;
  const connected = (provider: string) =>
    session?.user.identities?.some(
      (identity) => identity.provider === provider,
    );
  const remaining = Math.max(0, Math.ceil((retryAt - now) / 1000));
  return (
    <Screen
      title={link ? t.methods : t.title}
      intro={link ? t.methodsIntro : t.intro}
      topSafeArea={false}
      keyboardInsets
    >
      {!emailOpen ? (
        <View style={{ gap: 12 }}>
          {Platform.OS === "ios" ? (
            connected("apple") && link ? (
              <Message>Apple · {t.connected}</Message>
            ) : (
              <AppleAccountButton
                label={t.apple}
                disabled={busy || !providers?.apple}
                onPress={() => social("apple")}
              />
            )
          ) : null}
          {connected("google") && link ? (
            <Message>Google · {t.connected}</Message>
          ) : (
            <GoogleAccountButton
              label={t.google}
              disabled={busy || !providers?.google}
              onPress={() => social("google")}
            />
          )}
          {!link ? (
            <Button
              label={t.email}
              onPress={() => setEmailOpen(true)}
              disabled={busy}
            />
          ) : null}
          {link && session?.user.email_confirmed_at ? (
            <Card>
              <Text style={uiStyles.label}>{t.emailLabel}</Text>
              <Text selectable style={uiStyles.body}>
                {session.user.email}
              </Text>
            </Card>
          ) : null}
          {link && hasVerifiedPhone(session?.user) ? (
            <Button
              label={emailLoginCopy(locale).title}
              variant="secondary"
              disabled={busy}
              onPress={() => router.push("/email-login")}
            />
          ) : null}
          {providers &&
          (!providers.google || (Platform.OS === "ios" && !providers.apple)) ? (
            <Message>{t.unavailable}</Message>
          ) : null}
        </View>
      ) : (
        <Card>
          {!ticket ? (
            <>
              <Field
                label={t.emailLabel}
                value={email}
                onChangeText={setEmail}
                editable={!busy}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                maxLength={254}
                onSubmitEditing={() => void send()}
              />
              <Button
                label={t.send}
                busy={busy}
                disabled={!email.trim()}
                onPress={() => void send()}
              />
            </>
          ) : (
            <>
              <Text style={uiStyles.body}>
                {t.sent.replace("{email}", ticket.email)}
              </Text>
              <Field
                label={t.code}
                value={code}
                onChangeText={(value) => setCode(value.replace(/\D/g, ""))}
                editable={!busy}
                keyboardType="number-pad"
                inputMode="numeric"
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                maxLength={10}
                onSubmitEditing={() =>
                  void run(async () => {
                    await accountAuth.verifyEmail(ticket, code);
                    return true;
                  })
                }
              />
              <Button
                label={t.verify}
                busy={busy}
                disabled={code.length < 6}
                onPress={() =>
                  void run(async () => {
                    await accountAuth.verifyEmail(ticket, code);
                    return true;
                  })
                }
              />
              <Button
                label={
                  remaining
                    ? t.wait.replace("{seconds}", String(remaining))
                    : t.resend
                }
                variant="text"
                disabled={busy || remaining > 0}
                onPress={() => void send()}
              />
              <Button
                label={t.change}
                variant="text"
                disabled={busy}
                onPress={() => {
                  setTicket(null);
                  setCode("");
                  setError("");
                }}
              />
            </>
          )}
        </Card>
      )}
      {error ? <Message tone="error">{error}</Message> : null}
      {done ? <Message>{t.done}</Message> : null}
      {busy && !emailOpen ? <Message>{t.working}</Message> : null}
      {!link ? (
        <>
          <Button
            label={t.other}
            variant="text"
            disabled={busy}
            onPress={() => setOther((value) => !value)}
          />
          {other ? (
            <View style={{ gap: 8 }}>
              <Button
                label={t.password}
                variant="secondary"
                onPress={() => router.push("/login")}
                disabled={busy}
              />
              <Button
                label={t.sms}
                variant="text"
                disabled={busy}
                onPress={() =>
                  router.push({
                    pathname: "/photo-phone",
                    params: { destination: "requests" },
                  })
                }
              />
            </View>
          ) : null}
          <Text style={uiStyles.note}>{t.phoneLater}</Text>
        </>
      ) : null}
      <PrivacyLink />
    </Screen>
  );
}
