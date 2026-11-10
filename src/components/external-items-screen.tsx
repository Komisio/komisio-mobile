import { useCallback, useRef, useState } from "react";
import { Text } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  Button,
  Card,
  Loading,
  Message,
  Screen,
  StatusBadge,
  uiStyles,
} from "./ui";
import { useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { externalSubmissionCopy } from "@/lib/external-submission-copy";
import {
  externalRequestApi,
  externalSubmission,
} from "@/lib/external-submission-runtime";
import type { ExternalRequestPage } from "@/lib/external-submission";
import { hasVerifiedEmail, hasVerifiedPhone } from "@/lib/identity-gates";
import { useItemDraft } from "@/lib/use-item-draft";

export function ExternalItemsScreen() {
  const { locale, d } = useI18n(),
    t = externalSubmissionCopy(locale);
  const { session, store, signOut, refreshAssurance } = useSession();
  const { sent } = useLocalSearchParams<{ sent?: string }>();
  const owner = session?.user.id,
    verified = hasVerifiedPhone(session?.user);
  const { snapshot } = useItemDraft();
  const [offset, setOffset] = useState(0),
    [retry, setRetry] = useState(0);
  const [page, setPage] = useState<{
    owner: string;
    data: ExternalRequestPage;
  } | null>(null);
  const [pending, setPending] = useState(false),
    [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const leaving = useRef(false);
  useFocusEffect(
    useCallback(() => {
      void retry;
      let current = true;
      setPage(null);
      setError("");
      setPending(false);
      if (owner && verified) {
        void Promise.all([
          externalRequestApi(owner).list(offset),
          externalSubmission(owner).then((c) => c.load()),
        ])
          .then(([data, attempt]) => {
            if (current) {
              setPage({ owner, data });
              setPending(
                attempt?.state === "pending" || attempt?.state === "confirmed",
              );
            }
          })
          .catch((e) => {
            if (current) {
              setError(t.loadError);
              if (
                e instanceof Error &&
                ["AUTH_REQUIRED", "MFA_REQUIRED"].includes(e.message)
              )
                void refreshAssurance();
            }
          });
      }
      return () => {
        current = false;
      };
    }, [owner, verified, offset, retry, t.loadError, refreshAssurance]),
  );
  const data = page && page.owner === owner ? page.data : null;
  if (!verified)
    return (
      <Screen topSafeArea={false}>
        <Message>{t.phoneIntro}</Message>
        <Button
          label={t.verifyPhone}
          onPress={() =>
            router.push({
              pathname: "/photo-phone",
              params: { destination: "requests" },
            })
          }
        />
      </Screen>
    );
  return (
    <Screen
      topSafeArea={false}
      refresh={{
        refreshing: !data && !error,
        onRefresh: () => setRetry((n) => n + 1),
        label: d.retry,
      }}
    >
      {data?.requests.some((r) => r.id === sent) ? (
        <StatusBadge>{t.success}</StatusBadge>
      ) : null}
      {error ? (
        <>
          <Message tone="error">{error}</Message>
          <Button label={d.retry} onPress={() => setRetry((n) => n + 1)} />
        </>
      ) : null}
      {!data && !error ? <Loading /> : null}
      {data ? (
        <>
          <Text style={uiStyles.heading}>
            {t.activeCount.replace("{count}", String(data.activeCount))}
          </Text>
          {pending ? (
            <Card>
              <Message>{t.pending}</Message>
              <Button
                label={t.resume}
                onPress={() => router.push("/photo-review")}
              />
            </Card>
          ) : null}
          {snapshot?.photos.length ? (
            <Button
              label={t.continueDraft}
              variant="secondary"
              onPress={() => router.push("/photo-draft")}
            />
          ) : !pending ? (
            <Button
              label={t.newItem}
              disabled={data.activeCount >= 10}
              onPress={() => router.push("/photo-draft")}
            />
          ) : null}
          {data.activeCount >= 10 ? <Message>{t.limit}</Message> : null}
          {!data.requests.length ? <Message>{t.noRequests}</Message> : null}
          {data.requests.map((r) => (
            <Card key={r.id}>
              <StatusBadge
                tone={r.status === "waiting" ? "neutral" : "warning"}
              >
                {r.status === "waiting" ? t.waiting : t.declined}
              </StatusBadge>
              <Text selectable style={uiStyles.rowTitle}>
                {r.description}
              </Text>
              <Text style={uiStyles.body}>{r.store_name}</Text>
              {r.decline_note ? (
                <Text selectable style={uiStyles.body}>
                  {r.decline_note}
                </Text>
              ) : null}
            </Card>
          ))}
          {offset > 0 ? (
            <Button
              label={t.previous}
              variant="secondary"
              onPress={() => setOffset((n) => Math.max(0, n - 25))}
            />
          ) : null}
          {data.hasMore ? (
            <Button
              label={t.more}
              variant="secondary"
              onPress={() => setOffset((n) => n + 25)}
            />
          ) : null}
        </>
      ) : null}
      {store && hasVerifiedEmail(session?.user) ? (
        <Button
          label={t.toStore}
          variant="text"
          onPress={() => router.dismissTo("/(tabs)/items")}
        />
      ) : null}
      <Button
        label={t.signOut}
        variant="text"
        busy={busy}
        onPress={() => {
          if (leaving.current) return;
          leaving.current = true;
          setBusy(true);
          void signOut()
            .catch(() => {
              setError(t.sessionChanged);
            })
            .finally(() => {
              leaving.current = false;
              setBusy(false);
            });
        }}
      />
    </Screen>
  );
}
