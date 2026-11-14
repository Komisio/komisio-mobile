import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AppState, Linking } from "react-native";
import { useI18n } from "@/lib/i18n";
import { sellerPush } from "@/lib/push-runtime";
import { pushCopy } from "@/lib/push-copy";
import { submissionNotificationsCopy } from "@/lib/submission-notifications-copy";
import { externalSubmissionCopy } from "@/lib/external-submission-copy";
import { Button, Card, Message, Screen } from "./ui";

/** Shown before preparing a new submission. Permission and Settings actions
 * never submit the draft; the seller must explicitly continue. */
export function SubmissionNotifications({
  user,
  onContinue,
  onCancel,
}: {
  user: string;
  onContinue(): void;
  onCancel(): void;
}) {
  const { locale } = useI18n();
  const copy = submissionNotificationsCopy[locale];
  const push = pushCopy[locale];
  const state = useSyncExternalStore(
    sellerPush.subscribe,
    sellerPush.getSnapshot,
    sellerPush.getSnapshot,
  );
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const active = useRef(false);
  const locked = useRef(false);
  const settings = useRef(false);
  useEffect(() => {
    active.current = true;
    const subscription = AppState.addEventListener("change", (next) => {
      if (next !== "active" || !settings.current) return;
      settings.current = false;
      locked.current = true;
      setBusy(true);
      // The explicit Settings action authorizes activation for this account
      // only. The controller rechecks OS permission and fences account changes.
      void sellerPush.enable(user).finally(() => {
        locked.current = false;
        if (active.current) setBusy(false);
      });
    });
    return () => {
      active.current = false;
      settings.current = false;
      subscription.remove();
    };
  }, [user]);

  async function enable() {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setFailed(false);
    try {
      if (state.status === "denied") {
        settings.current = true;
        await Linking.openSettings();
      } else await sellerPush.enable(user);
    } catch {
      settings.current = false;
      if (active.current) setFailed(true);
    } finally {
      locked.current = false;
      if (active.current) setBusy(false);
    }
  }
  const waiting = busy || state.busy || state.status === "loading";
  const enabled = state.status === "on";
  return (
    <Screen title={copy.title} intro={copy.intro} topSafeArea={false}>
      <Card>
        {failed || state.status === "error" ? (
          <Message tone="error">{push.failed}</Message>
        ) : enabled ? (
          <Message>{copy.enabled}</Message>
        ) : state.status === "denied" ? (
          <Message>{push.denied}</Message>
        ) : null}
        {!enabled && state.status !== "unavailable" ? (
          <Button
            label={state.status === "denied" ? push.settings : push.enable}
            busy={waiting}
            onPress={() => void enable()}
          />
        ) : null}
        <Button
          label={enabled ? externalSubmissionCopy(locale).send : copy.without}
          variant={enabled ? "primary" : "secondary"}
          disabled={waiting}
          onPress={onContinue}
        />
        <Button
          label={copy.back}
          variant="text"
          disabled={waiting}
          onPress={onCancel}
        />
      </Card>
    </Screen>
  );
}
