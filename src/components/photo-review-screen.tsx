import { centralIntakeCopy } from "@/lib/central-intake-copy";
import { useCallback, useRef, useState } from "react";
import { Text, View } from "react-native";
import { router, useFocusEffect, usePreventRemove } from "expo-router";
import { Button, Card, Choice, Loading, Message, Screen, uiStyles } from "./ui";
import { PhotoDraftImage } from "./photo-draft-image";
import { useItemDraft } from "@/lib/use-item-draft";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { itemDraftCopy } from "@/lib/item-draft-copy";
import { photoDraftCopy } from "@/lib/photo-draft-copy";
import { itemDetailsErrors } from "@/lib/item-draft-details";
import {
  externalSubmissionCopy,
  externalSubmissionError,
} from "@/lib/external-submission-copy";
import { externalSubmission } from "@/lib/external-submission-runtime";
import type { ExternalAttempt } from "@/lib/external-submission";
import { hasVerifiedPhone } from "@/lib/identity-gates";

export function PhotoReviewScreen() {
  const { locale, d } = useI18n();
  const t = itemDraftCopy(locale);
  const photo = photoDraftCopy(locale);
  const { snapshot, failed, reload } = useItemDraft();
  const { session, refreshAssurance } = useSession();
  const s = externalSubmissionCopy(locale);
  const central = centralIntakeCopy(locale);
  const [countryConfirmed, setCountryConfirmed] = useState(false);
  const owner = session?.user.id;
  const [outbox, setOutbox] = useState<{
    owner: string;
    attempt: ExternalAttempt | null;
  } | null>(null);
  const [outboxFailed, setOutboxFailed] = useState(false);
  const [readVersion, setReadVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [recipientChanged, setRecipientChanged] = useState(false);
  const [progress, setProgress] = useState("");
  const locked = useRef(false),
    active = useRef(false),
    currentOwner = useRef(owner);
  const disablePrevention = usePreventRemove(busy, () => {});
  useFocusEffect(
    useCallback(() => {
      void readVersion;
      currentOwner.current = owner;
      active.current = true;
      let current = true;
      setOutbox(null);
      setOutboxFailed(false);
      setError("");
      if (owner)
        void externalSubmission(owner)
          .then((c) => c.load())
          .then((attempt) => {
            if (current) setOutbox({ owner, attempt });
          })
          .catch(() => {
            if (current) setOutboxFailed(true);
          });
      return () => {
        current = false;
        active.current = false;
      };
    }, [owner, readVersion]),
  );
  const attempt = outbox?.owner === owner ? outbox?.attempt : null;
  const pending =
    attempt?.state === "pending" || attempt?.state === "confirmed";
  async function send(resume = false) {
    if (locked.current) return;
    if (!owner || !hasVerifiedPhone(session?.user)) {
      router.push("/photo-phone");
      return;
    }
    if (!resume && !snapshot) return;
    if (!resume && !countryConfirmed) {
      setError(central.countryRequired);
      return;
    }
    locked.current = true;
    setBusy(true);
    setError("");
    setRecipientChanged(false);
    setProgress("");
    const current = () => active.current && currentOwner.current === owner;
    try {
      const controller = await externalSubmission(owner);
      if (!resume) await controller.prepare(snapshot!, "SE");
      const result = await controller.resume((done, total) => {
        if (current())
          setProgress(
            done < total
              ? s.progress
                  .replace("{done}", String(done + 1))
                  .replace("{total}", String(total))
              : s.send,
          );
      });
      if (current()) {
        setOutbox({ owner, attempt: result });
        if (result.state === "complete") {
          disablePrevention();
          router.replace({
            pathname: "/external-items",
            params: { sent: result.command.requestId },
          });
        } else
          setError(externalSubmissionError(locale, result.rejection ?? ""));
      }
    } catch (e) {
      if (current()) {
        setRecipientChanged(
          e instanceof Error &&
            ["STORE_CHANGED", "STORE_UNAVAILABLE"].includes(e.message),
        );
        setError(
          externalSubmissionError(locale, e instanceof Error ? e.message : ""),
        );
        try {
          const saved = await (await externalSubmission(owner)).load();
          if (current()) setOutbox({ owner, attempt: saved });
        } catch {
          if (current()) setOutboxFailed(true);
        }
        if (
          e instanceof Error &&
          ["MFA_REQUIRED", "AUTH_REQUIRED"].includes(e.message)
        )
          await refreshAssurance();
      }
    } finally {
      locked.current = false;
      if (active.current) {
        setBusy(false);
        setProgress("");
      }
    }
  }
  if (outboxFailed)
    return (
      <Screen topSafeArea={false}>
        <Message tone="error">{s.sendError}</Message>
        <Button label={d.retry} onPress={() => setReadVersion((n) => n + 1)} />
      </Screen>
    );
  if (owner && !outbox) return <Loading />;
  if (pending)
    return (
      <Screen topSafeArea={false} title={s.pending}>
        <Card>
          <Text style={uiStyles.heading}>{attempt.command.description}</Text>
          <Text style={uiStyles.body}>{attempt.storeName}</Text>
        </Card>
        <Message>
          {attempt.state === "confirmed" ? s.success : s.sendError}
        </Message>
        {error ? <Message tone="error">{error}</Message> : null}
        {progress ? <Message>{progress}</Message> : null}
        <Button label={s.resume} busy={busy} onPress={() => void send(true)} />
      </Screen>
    );
  if (failed)
    return (
      <Screen topSafeArea={false}>
        <Message tone="error">{photo.error}</Message>
        <Button label={d.retry} onPress={reload} />
      </Screen>
    );
  if (!snapshot)
    return (
      <Screen topSafeArea={false}>
        <Loading />
      </Screen>
    );
  const { draft, photos } = snapshot;
  const { details } = draft;
  if (!photos.length)
    return (
      <Screen topSafeArea={false}>
        <Message>{t.noPhotos}</Message>
        <Button
          label={photo.title}
          onPress={() => router.navigate("/photo-draft")}
        />
      </Screen>
    );
  if (!draft.store || itemDetailsErrors(details).length)
    return (
      <Screen topSafeArea={false}>
        <Button
          label={t.editDetails}
          onPress={() => router.navigate("/photo-details")}
        />
      </Screen>
    );
  return (
    <Screen topSafeArea={false}>
      <Message>{s.reviewIntro}</Message>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {photos.map((p, i) => (
          <View key={p.id} style={{ width: "47%" }}>
            <PhotoDraftImage
              uri={p.uri}
              label={photo.photo.replace("{count}", String(i + 1))}
              errorText={photo.previewError}
              retryLabel={d.retry}
            />
          </View>
        ))}
      </View>
      <Button
        label={t.editPhotos}
        variant="text"
        disabled={busy}
        onPress={() => router.navigate("/photo-draft")}
      />
      <Card>
        <Text selectable style={uiStyles.heading}>
          {details.description}
        </Text>
        {details.brand ? (
          <Text selectable style={uiStyles.body}>
            {details.brand}
          </Text>
        ) : null}
        <Text style={uiStyles.body}>{t.conditions[details.condition!]}</Text>
        {details.notes ? (
          <Text selectable style={uiStyles.body}>
            {details.notes}
          </Text>
        ) : null}
        {details.desiredPrice.trim() ? (
          <>
            <Text style={uiStyles.body}>
              {t.desiredPrice.replace("{currency}", draft.store.currency)}
            </Text>
            <Text selectable style={uiStyles.rowTitle}>
              {details.desiredPrice} {draft.store.currency}
            </Text>
          </>
        ) : null}
        <Button
          label={t.editDetails}
          variant="text"
          disabled={busy}
          onPress={() => router.navigate("/photo-details")}
        />
      </Card>
      <Card>
        <Text style={uiStyles.rowTitle}>{draft.store.name}</Text>
        {draft.store.city ? (
          <Text style={uiStyles.body}>{draft.store.city}</Text>
        ) : null}
      </Card>
      <Message>{central.intro}</Message>
      <Choice
        role="checkbox"
        label={central.confirmCountry}
        selected={countryConfirmed}
        disabled={busy}
        onPress={() => setCountryConfirmed((v) => !v)}
      />
      {error ? <Message tone="error">{error}</Message> : null}
      {attempt?.state === "rejected" || recipientChanged ? (
        <>
          <Message>{s.editAfterRefusal}</Message>
          <Button
            label={central.title}
            variant="text"
            onPress={() => router.navigate("/photo-store")}
          />
        </>
      ) : null}
      {progress ? <Message>{progress}</Message> : null}
      <Button
        label={hasVerifiedPhone(session?.user) ? s.send : s.verifyPhone}
        busy={busy}
        disabled={!countryConfirmed}
        onPress={() => void send()}
      />
    </Screen>
  );
}
