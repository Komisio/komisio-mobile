import { useState, useSyncExternalStore } from "react";
import { Linking } from "react-native";
import { useI18n } from "@/lib/i18n";
import { pushCopy } from "@/lib/push-copy";
import { sellerPush } from "@/lib/push-runtime";
import { Button, Card, Loading, Message, Screen } from "@/components/ui";

export default function NotificationsScreen() {
  const { d, locale } = useI18n();
  const copy = pushCopy[locale];
  const state = useSyncExternalStore(
    sellerPush.subscribe,
    sellerPush.getSnapshot,
    sellerPush.getSnapshot,
  );
  const [settingsFailed, setSettingsFailed] = useState(false);
  return (
    <Screen title={copy.title} intro={copy.intro} topSafeArea={false}>
      <Card>
        {state.status === "loading" ? (
          <Loading />
        ) : state.status === "unavailable" ? (
          <Message>{copy.unavailable}</Message>
        ) : (
          <>
            {state.status === "error" || settingsFailed ? (
              <Message tone="error">{copy.failed}</Message>
            ) : (
              <Message>
                {state.status === "on"
                  ? copy.on
                  : state.status === "denied"
                    ? copy.denied
                    : copy.off}
              </Message>
            )}
            {state.status === "denied" ? (
              <Button
                label={copy.settings}
                onPress={() => {
                  setSettingsFailed(false);
                  void Linking.openSettings().catch(() =>
                    setSettingsFailed(true),
                  );
                }}
              />
            ) : null}
            {state.status === "on" ? (
              <Button
                label={copy.disable}
                variant="secondary"
                busy={state.busy}
                onPress={() => void sellerPush.disable()}
              />
            ) : state.status === "error" ? (
              <>
                <Button
                  label={d.retry}
                  busy={state.busy}
                  onPress={() => void sellerPush.refresh()}
                />
                <Button
                  label={copy.disable}
                  variant="secondary"
                  disabled={state.busy}
                  onPress={() => void sellerPush.disable()}
                />
              </>
            ) : state.status !== "denied" ? (
              <Button
                label={copy.enable}
                busy={state.busy}
                onPress={() => void sellerPush.enable()}
              />
            ) : null}
          </>
        )}
      </Card>
    </Screen>
  );
}
