import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { Button, Field, Message, Screen } from "@/components/ui";

// S02 code step: accounts with a verified TOTP factor reach aal2 here, as on
// the web (/mfa).
export default function Mfa() {
  const { d } = useI18n();
  const { refreshAssurance, signOut } = useSession();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const { data } = await supabase.auth.mfa.listFactors();
      const factor = data?.totp.find((f) => f.status === "verified");
      const result = factor
        ? await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code })
        : null;
      if (!result || result.error) setError(d.mfa.failed);
      else await refreshAssurance();
    } catch {
      setError(d.login.offline);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title={d.mfa.title} intro={d.mfa.intro}>
      <Field
        label={d.mfa.code}
        value={code}
        onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        onSubmitEditing={submit}
      />
      {error ? <Message tone="error">{error}</Message> : null}
      <Button label={d.mfa.submit} busy={busy} disabled={code.length !== 6} onPress={submit} />
      <Button label={d.mfa.cancel} variant="secondary" onPress={() => void signOut()} />
    </Screen>
  );
}
