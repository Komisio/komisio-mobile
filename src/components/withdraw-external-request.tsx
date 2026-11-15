import { useRef, useState } from "react";
import { View } from "react-native";
import { externalRequestApi } from "@/lib/external-submission-runtime";
import { externalLifecycleCopy } from "@/lib/external-lifecycle-copy";
import { useI18n } from "@/lib/i18n";
import { Button, Message } from "./ui";

export function WithdrawExternalRequest({
  owner,
  request,
  onChanged,
}: {
  owner: string;
  request: string;
  onChanged: () => void;
}) {
  const { locale } = useI18n();
  const t = externalLifecycleCopy(locale);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const sending = useRef(false);
  async function withdraw() {
    if (sending.current) return;
    sending.current = true;
    setBusy(true);
    setError("");
    try {
      await externalRequestApi(owner).withdraw(request);
      setConfirm(false);
      onChanged();
    } catch (e) {
      const changed =
        e instanceof Error &&
        ["REQUEST_CHANGED", "REQUEST_NOT_FOUND"].includes(e.message);
      setError(changed ? t.changed : t.failed);
      if (changed) onChanged();
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }
  return (
    <View style={{ gap: 8 }}>
      {confirm ? <Message>{t.confirm}</Message> : null}
      {error ? <Message tone="error">{error}</Message> : null}
      <Button
        label={t.withdraw}
        variant="text"
        busy={busy}
        onPress={() => (confirm ? void withdraw() : setConfirm(true))}
      />
      {confirm ? (
        <Button
          label={t.keep}
          variant="text"
          disabled={busy}
          onPress={() => {
            setConfirm(false);
            setError("");
          }}
        />
      ) : null}
    </View>
  );
}
