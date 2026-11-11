import { externalOfferCopy } from "@/lib/external-offer-copy";
import { externalOfferApi } from "@/lib/external-offer-runtime";
import type { ExternalOffer } from "@/lib/external-offer";
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
import { PhotoCapacity } from "./photo-flow-ui";
import { ExternalItemRow } from "./external-item-row";
import { photoFlowCopy } from "@/lib/photo-flow-copy";
import { sellerPush } from "@/lib/push-runtime";
import { pushCopy } from "@/lib/push-copy";

export function ExternalItemsScreen() {
  const { locale, d } = useI18n(),
    t = externalSubmissionCopy(locale);
  const { session, store, signOut, refreshAssurance } = useSession();
  const { sent, request } = useLocalSearchParams<{
    sent?: string;
    request?: string;
  }>();
  const owner = session?.user.id,
    verified = hasVerifiedPhone(session?.user);
  const { snapshot } = useItemDraft();
  const [offset, setOffset] = useState(0);
  const [page, setPage] = useState<{
    owner: string;
    data: ExternalRequestPage;
    offers: ExternalOffer[] | null;
  } | null>(null);
  const [pending, setPending] = useState(false),
    [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [offerError, setOfferError] = useState(false);
  const leaving = useRef(false);
  const load = useCallback(() => {
    let current = true;
    setPage(null);
    setError("");
    setOfferError(false);
    setPending(false);
    if (owner && verified) {
      void Promise.all([
        externalRequestApi(owner).list(offset),
        externalSubmission(owner).then((c) => c.load()),
      ])
        .then(async ([data, attempt]) => {
          if (request) {
            const selected = await externalRequestApi(owner).lookup(request);
            if (selected)
              data.requests = [
                selected,
                ...data.requests.filter((r) => r.id !== selected.id),
              ].slice(0, 25);
          }
          if (current) {
            setPage({ owner, data, offers: null });
            setPending(
              attempt?.state === "pending" || attempt?.state === "confirmed",
            );
            if (data.requests.length)
              void sellerPush.requestInitialPermission(owner);
          }
          try {
            const offers = await externalOfferApi(owner).list(
              data.requests.map((r) => r.id),
            );
            if (current) setPage({ owner, data, offers });
          } catch (e) {
            if (current) {
              setOfferError(true);
              if (
                e instanceof Error &&
                [
                  "AUTH_REQUIRED",
                  "MFA_REQUIRED",
                  "PASSWORD_UPDATE_REQUIRED",
                ].includes(e.message)
              )
                void refreshAssurance();
            }
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
  }, [owner, verified, offset, request, t.loadError, refreshAssurance]);
  const stop = useRef<(() => void) | null>(null);
  const refresh = useCallback(() => {
    stop.current?.();
    stop.current = load();
  }, [load]);
  useFocusEffect(
    useCallback(() => {
      refresh();
      return () => stop.current?.();
    }, [refresh]),
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
        onRefresh: refresh,
        label: d.retry,
      }}
    >
      {data?.requests.some((r) => r.id === sent) ? (
        <StatusBadge>{t.success}</StatusBadge>
      ) : null}
      {error ? (
        <>
          <Message tone="error">{error}</Message>
          <Button label={d.retry} onPress={refresh} />
        </>
      ) : null}
      {!data && !error ? <Loading /> : null}
      {data ? (
        <>
          <PhotoCapacity count={data.activeCount} />
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
          {offerError ? (
            <>
              <Message tone="error">
                {externalOfferCopy(locale).listError}
              </Message>
              <Button label={d.retry} variant="secondary" onPress={refresh} />
            </>
          ) : null}
          {data.requests.map((r) => (
            <ExternalItemRow
              key={r.id}
              item={r}
              owner={owner!}
              offer={page?.offers?.find((o) => o.requestId === r.id)}
              offersLoaded={page?.offers !== null}
            />
          ))}
          {data.requests.some((r) => r.status === "declined") ? (
            <Text style={uiStyles.note}>
              {photoFlowCopy(locale).capacityHint}
            </Text>
          ) : null}
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
      {data?.requests.length ? (
        <Button
          label={pushCopy[locale].title}
          variant="text"
          onPress={() => router.push("/notifications")}
        />
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
