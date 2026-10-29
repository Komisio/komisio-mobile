import { useState } from "react";
import { openBrowserAsync } from "expo-web-browser";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { Button, Card, Field, Message, Screen } from "@/components/ui";

const web = process.env.EXPO_PUBLIC_KOMISIO_WEB_URL;

// S02: email and password. Activation and password reset finish on the web.
export default function Login() {
  const { d } = useI18n();
  const { store, chooseStore } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
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
    } catch {
      setError(d.login.offline);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen brand title={d.login.title} intro={store?.name}>
      <Card>
        <Field
          label={d.login.email}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="username"
        />
        <Field
          label={d.login.password}
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
          disabled={!email.trim() || !password}
          onPress={submit}
        />
      </Card>
      <Message>{d.login.firstTime}</Message>
      {web ? (
        <Button
          label={d.login.forgot}
          variant="secondary"
          onPress={() =>
            void openBrowserAsync(new URL("/reset-password", web).href)
          }
        />
      ) : null}
      <Button
        label={d.login.changeStore}
        variant="secondary"
        onPress={() => chooseStore(null)}
      />
    </Screen>
  );
}
