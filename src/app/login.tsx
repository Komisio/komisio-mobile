import { useRef, useState } from "react";
import { Redirect, router } from "expo-router";
import { ExternalPageButton } from "@/components/external-page-button";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { Button, Card, Field, Message, Screen } from "@/components/ui";
import { PrivacyLink } from "@/components/privacy-link";
import { hasVerifiedEmail } from "@/lib/identity-gates";
import { homeCopy } from "@/lib/home-copy";
import { emailLoginCopy } from "@/lib/email-login-copy";

const web = process.env.EXPO_PUBLIC_KOMISIO_WEB_URL;

// S02: email and password. Activation and password reset finish on the web.
export default function Login() {
  const { d, locale } = useI18n();
  const t = homeCopy(locale);
  const { store, session, signOut, refreshAssurance } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);
  const complete = Boolean(email.trim() && password);

  const submit = async () => {
    // Keyboard submission bypasses the button; lock before React renders busy.
    if (!complete || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      const { error: failure } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (failure)
        setError(
          failure.code === "email_not_confirmed"
            ? d.login.notActivated
            : failure.status
              ? d.login.failed
              : d.login.offline,
        );
      else {
        await refreshAssurance();
      }
    } catch {
      setError(d.login.offline);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  if (session && hasVerifiedEmail(session.user))
    return <Redirect href={store ? "/home/shop" : "/(tabs)/items"} />;
  if (session)
    return (
      <Screen title={t.login} topSafeArea={false}>
        <Message>{t.storeAccount}</Message>
        <Button
          label={emailLoginCopy(locale).title}
          onPress={() => router.push("/email-login")}
        />
        <Button
          label={t.switchAccount}
          variant="secondary"
          busy={busy}
          onPress={() => {
            if (submitting.current) return;
            submitting.current = true;
            setBusy(true);
            void signOut()
              .catch(() => setError(d.login.offline))
              .finally(() => {
                submitting.current = false;
                setBusy(false);
              });
          }}
        />
        {error ? <Message tone="error">{error}</Message> : null}
      </Screen>
    );

  return (
    <Screen
      title={d.login.title}
      intro={store?.name}
      topSafeArea={false}
      keyboardInsets
    >
      <Card>
        <Field
          label={d.login.email}
          testID="login-email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="username"
        />
        <Field
          label={d.login.password}
          testID="login-password"
          value={password}
          onChangeText={setPassword}
          autoComplete="current-password"
          secureTextEntry
          textContentType="password"
          onSubmitEditing={submit}
        />
        {error ? <Message tone="error">{error}</Message> : null}
        <Button
          label={d.login.submit}
          busy={busy}
          disabled={!complete}
          onPress={submit}
        />
      </Card>
      {store ? <Message>{d.login.firstTime}</Message> : null}
      {web ? (
        <ExternalPageButton
          label={d.login.forgot}
          variant="secondary"
          url={new URL("/reset-password", web).href}
        />
      ) : null}
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
      {store ? (
        <Button
          label={d.login.changeStore}
          variant="secondary"
          onPress={() => {
            router.replace("/home/stores");
          }}
        />
      ) : null}
      <PrivacyLink />
    </Screen>
  );
}
