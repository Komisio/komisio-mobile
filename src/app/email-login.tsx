import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import type { User } from "@supabase/supabase-js";
import { useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { emailLogin } from "@/lib/email-login-runtime";
import { emailLoginCopy, emailLoginError } from "@/lib/email-login-copy";
import { hasVerifiedEmail, hasVerifiedPhone } from "@/lib/identity-gates";
import { Button, Card, Field, Loading, Message, Screen } from "@/components/ui";

export default function EmailLogin() {
  const { session } = useSession();
  if (!session || !hasVerifiedPhone(session.user))
    return <Redirect href="/(tabs)/profile" />;
  return <EmailSetup key={session.user.id} owner={session.user.id} />;
}

function EmailSetup({ owner }: { owner: string }) {
  const { locale, d } = useI18n(),
    t = emailLoginCopy(locale);
  const { refreshAssurance } = useSession();
  const params = useLocalSearchParams<{ email?: string }>();
  const api = useMemo(() => emailLogin(owner), [owner]);
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState(
    typeof params.email === "string" ? params.email : "",
  );
  const [password, setPassword] = useState("");
  const [nonce, setNonce] = useState("");
  const [reauth, setReauth] = useState(false);
  const [sent, setSent] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [until, setUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const active = useRef(true),
    locked = useRef(false);
  const read = useCallback(async () => {
    try {
      const current = await api.read();
      if (active.current) {
        setUser(current);
        if (current.email || current.new_email)
          setEmail(current.email || current.new_email || "");
      }
    } catch {
      if (active.current) setError(t.failed);
    }
  }, [api, t.failed]);
  useEffect(() => {
    active.current = true;
    void api
      .read()
      .then((current) => {
        if (active.current) {
          setUser(current);
          if (current.email || current.new_email)
            setEmail(current.email || current.new_email || "");
        }
      })
      .catch(() => {
        if (active.current) setError(t.failed);
      });
    return () => {
      active.current = false;
    };
  }, [api, t.failed]);
  useEffect(() => {
    if (!until) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [until]);

  async function run(action: "send" | "check" | "save" | "code") {
    if (
      locked.current ||
      ((action === "send" || action === "code") && Date.now() < until)
    )
      return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      if (action === "send") {
        const current = await api.begin(email);
        if (active.current) {
          setUser(current);
          setSent(true);
          setUntil(Date.now() + 60_000);
        }
      } else if (action === "check") {
        const current = await api.confirm();
        if (active.current) setUser(current);
      } else if (action === "code") {
        await api.reauthenticate();
        if (active.current) {
          setSent(true);
          setUntil(Date.now() + 60_000);
        }
      } else {
        await api.password(password, nonce || undefined);
        if (active.current) {
          setDone(true);
          setPassword("");
          setNonce("");
        }
      }
      await refreshAssurance();
    } catch (e) {
      if (active.current) {
        const code = e instanceof Error ? e.message : "";
        if (code === "reauthentication_needed") {
          setReauth(true);
          setSent(false);
        }
        setError(emailLoginError(locale, code));
        if (["MFA_REQUIRED", "SESSION_CHANGED"].includes(code))
          void refreshAssurance();
        if (code === "EMAIL_ALREADY_SET") void read();
      }
    } finally {
      locked.current = false;
      if (active.current) setBusy(false);
    }
  }

  return (
    <Screen title={t.title} topSafeArea={false} keyboardInsets>
      {done ? (
        <>
          <Message>{t.done}</Message>
          <Button
            label={d.tabs.profile}
            onPress={() => router.dismissTo("/(tabs)/profile")}
          />
        </>
      ) : (
        <>
          <Message>{t.intro}</Message>
          {!user && !error ? <Loading /> : null}
          {!user && error ? (
            <Button label={d.retry} onPress={() => void read()} />
          ) : null}
          {user && !hasVerifiedEmail(user) ? (
            <Card>
              <Field
                label={d.login.email}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                editable={!busy}
              />
              <Button
                label={t.send}
                busy={busy}
                disabled={!email.trim() || now < until}
                onPress={() => void run("send")}
              />
              {sent || user.new_email ? (
                <>
                  <Message>{t.sent}</Message>
                  <Button
                    label={t.check}
                    variant="secondary"
                    busy={busy}
                    onPress={() => void run("check")}
                  />
                </>
              ) : null}
            </Card>
          ) : user ? (
            <Card>
              <Message>{user.email}</Message>
              <Field
                label={t.password}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
                editable={!busy}
              />
              <Message>{t.passwordHint}</Message>
              {reauth ? (
                <>
                  <Message>{t.reauth}</Message>
                  <Button
                    label={t.sendCode}
                    variant="secondary"
                    busy={busy}
                    disabled={now < until}
                    onPress={() => void run("code")}
                  />
                  <Field
                    label={t.code}
                    value={nonce}
                    onChangeText={setNonce}
                    keyboardType="number-pad"
                    autoComplete="one-time-code"
                    textContentType="oneTimeCode"
                    maxLength={10}
                    editable={!busy}
                  />
                </>
              ) : null}
              <Button
                label={t.save}
                busy={busy}
                disabled={password.length < 12 || (reauth && nonce.length < 6)}
                onPress={() => void run("save")}
              />
            </Card>
          ) : null}
          {error ? <Message tone="error">{error}</Message> : null}
        </>
      )}
    </Screen>
  );
}
