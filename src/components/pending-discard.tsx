import { useState } from "react";
import { Button, Message } from "./ui";
import { useI18n } from "@/lib/i18n";

/** Mounted only for an idle, unresolved command, keyed by its request ID. */
export function PendingDiscard({ onDiscard }: { onDiscard: () => void }) {
  const { d } = useI18n();
  const [confirm, setConfirm] = useState(false);
  return confirm ? (
    <>
      <Message tone="error">{d.bank.discardWarning}</Message>
      <Button
        label={d.bank.confirmDiscard}
        variant="secondary"
        onPress={onDiscard}
      />
      <Button
        label={d.bank.keepPending}
        variant="secondary"
        onPress={() => setConfirm(false)}
      />
    </>
  ) : (
    <Button
      label={d.bank.discard}
      variant="secondary"
      onPress={() => setConfirm(true)}
    />
  );
}
