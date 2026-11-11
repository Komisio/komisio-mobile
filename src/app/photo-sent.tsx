import { useCallback, useState } from "react";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import {
  Button,
  Loading,
  Message,
  Screen,
  colors,
  uiStyles,
} from "@/components/ui";
import { PhotoCapacity } from "@/components/photo-flow-ui";
import { ExternalItemRow } from "@/components/external-item-row";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { photoFlowCopy } from "@/lib/photo-flow-copy";
import { externalSubmissionCopy } from "@/lib/external-submission-copy";
import { externalRequestApi } from "@/lib/external-submission-runtime";
import type { ExternalRequest } from "@/lib/external-submission";

export default function PhotoSent() {
  const { locale, d } = useI18n(),
    { session } = useSession();
  const flow = photoFlowCopy(locale),
    t = externalSubmissionCopy(locale);
  const { request } = useLocalSearchParams<{ request?: string }>();
  const owner = session?.user.id;
  const [result, setResult] = useState<{
    owner: string;
    request: string;
    item: ExternalRequest;
    count: number;
  } | null>(null);
  const [failed, setFailed] = useState(false),
    [retry, setRetry] = useState(0);
  useFocusEffect(
    useCallback(() => {
      void retry;
      let current = true;
      setResult(null);
      setFailed(false);
      if (!owner || !request || !/^[a-f0-9-]{36}$/.test(request)) {
        setFailed(true);
        return;
      }
      const api = externalRequestApi(owner);
      void Promise.all([api.lookup(request), api.list()])
        .then(([item, page]) => {
          if (!current) return;
          if (!item) {
            setFailed(true);
            return;
          }
          if (item.status !== "waiting") {
            router.replace("/external-items");
            return;
          }
          setResult({ owner, request, item, count: page.activeCount });
        })
        .catch(() => {
          if (current) setFailed(true);
        });
      return () => {
        current = false;
      };
    }, [owner, request, retry]),
  );
  const data =
    result?.owner === owner && result?.request === request ? result : null;
  return (
    <Screen topSafeArea={false}>
      {failed ? (
        <>
          <Message tone="error">{t.loadError}</Message>
          <Button label={d.retry} onPress={() => setRetry((n) => n + 1)} />
        </>
      ) : !data ? (
        <Loading />
      ) : (
        <>
          <View style={{ alignItems: "center", paddingVertical: 20, gap: 20 }}>
            <View
              accessible={false}
              style={{
                width: 88,
                height: 88,
                borderRadius: 44,
                backgroundColor: colors.accent,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 46, color: colors.brand }}>✓</Text>
            </View>
            <Text
              accessibilityRole="header"
              style={[uiStyles.title, { textAlign: "center" }]}
            >
              {flow.sent}
            </Text>
            <Text style={[uiStyles.body, { textAlign: "center" }]}>
              {flow.sentHint}
            </Text>
          </View>
          <ExternalItemRow owner={data.owner} item={data.item} />
          <PhotoCapacity count={data.count} />
          <Button
            label={t.newItem}
            disabled={data.count >= 10}
            onPress={() => router.replace("/photo-draft")}
          />
        </>
      )}
      <Button
        label={flow.toItems}
        variant="secondary"
        onPress={() => router.replace("/external-items")}
      />
    </Screen>
  );
}
