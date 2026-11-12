import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { useSession } from "@/lib/session";
import { hasVerifiedPhone } from "@/lib/identity-gates";
import { useI18n } from "@/lib/i18n";
import { photoAnalysisCopy } from "@/lib/photo-analysis-copy";
import { photoAnalysis } from "@/lib/photo-analysis-runtime";
import type {
  PhotoSuggestion,
  PhotoAnalysisResult,
} from "@/lib/photo-analysis";
import type { ItemDraftSnapshot } from "@/lib/photo-draft";
import { Button, Message, colors, uiStyles } from "./ui";

export function PhotoAnalysisPanel({
  snapshot,
  onVerify,
  onSuggestion,
  disabled,
}: {
  snapshot: ItemDraftSnapshot;
  onVerify(): void;
  onSuggestion(output: PhotoSuggestion): void;
  disabled: boolean;
}) {
  const { session, mfaRequired } = useSession();
  const { locale } = useI18n(),
    t = photoAnalysisCopy(locale);
  const user =
    hasVerifiedPhone(session?.user) && !mfaRequired ? session!.user.id : null;
  const language = locale === "da" ? "dk" : locale;
  // Remount the worker on image, recipient, language or identity changes.
  return (
    <Worker
      key={JSON.stringify([
        user,
        snapshot.draft.draftId,
        snapshot.draft.store?.id,
        snapshot.photos.map((p) => p.id),
        language,
      ])}
      {...{ snapshot, onVerify, onSuggestion, disabled, user, language, t }}
    />
  );
}
function Worker({
  snapshot,
  onVerify,
  onSuggestion,
  disabled,
  user,
  language,
  t,
}: Parameters<typeof PhotoAnalysisPanel>[0] & {
  user: string | null;
  language: string;
  t: ReturnType<typeof photoAnalysisCopy>;
}) {
  const [phase, setPhase] = useState<
    "uploading" | "uploaded" | "analyzing" | "error"
  >("uploading");
  const [progress, setProgress] = useState(0),
    [error, setError] = useState("");
  const [result, setResult] = useState<PhotoAnalysisResult | null>(null);
  const [retry, setRetry] = useState(0);
  const locked = useRef(false),
    alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    if (!user) return;
    let current = true;
    void photoAnalysis(user)
      .then((c) =>
        c.upload(snapshot, language, (done) => {
          if (current) setProgress(done);
        }),
      )
      .then(() => {
        if (current) {
          setPhase("uploaded");
          setError("");
        }
      })
      .catch((e) => {
        if (current) {
          setPhase("error");
          setError(e instanceof Error ? e.message : "");
        }
      });
    return () => {
      current = false;
    };
  }, [user, snapshot, language, retry]);
  async function analyze() {
    if (!user || locked.current || phase !== "uploaded") return;
    locked.current = true;
    setPhase("analyzing");
    setError("");
    try {
      const result = await (
        await photoAnalysis(user)
      ).analyze(snapshot, language);
      if (!alive.current) return;
      setResult(result);
      if (result.status === "ready" && result.output)
        onSuggestion(result.output);
    } catch (e) {
      if (alive.current) setError(e instanceof Error ? e.message : "");
    } finally {
      locked.current = false;
      if (alive.current) setPhase("uploaded");
    }
  }
  const unavailable = [
    "ASSISTANCE_DISABLED",
    "AI_CREDITS_EXHAUSTED",
    "AI_CAP_REACHED",
    "USAGE_QUOTA_EXCEEDED",
    "NOT_FOUND",
  ].includes(error);
  return (
    <View
      style={{
        padding: 16,
        gap: 10,
        borderRadius: 16,
        backgroundColor: colors.softAccent,
      }}
    >
      <Text style={uiStyles.rowTitle}>{t.title}</Text>
      {!user ? (
        <Button label={t.verify} disabled={disabled} onPress={onVerify} />
      ) : (
        <>
          {phase === "uploading" ? (
            <Text accessibilityLiveRegion="polite" style={uiStyles.note}>
              {t.uploading
                .replace(
                  "{done}",
                  String(Math.min(progress + 1, snapshot.photos.length)),
                )
                .replace("{total}", String(snapshot.photos.length))}
            </Text>
          ) : null}
          {phase === "uploaded" && !result && !error ? (
            <Text style={uiStyles.note}>{t.uploaded}</Text>
          ) : null}
          {result ? (
            <Message>
              {result.status === "ready"
                ? t.ready
                : result.status === "pending"
                  ? t.pending
                  : t.failed}
            </Message>
          ) : null}
          {error || phase === "error" ? (
            <Message tone="error">
              {unavailable ? t.unavailable : t.error}
            </Message>
          ) : null}
          {phase === "error" ? (
            <Button
              label={t.retry}
              disabled={disabled}
              onPress={() => {
                setPhase("uploading");
                setError("");
                setRetry((n) => n + 1);
              }}
            />
          ) : result?.status !== "ready" && result?.status !== "failed" ? (
            <Button
              label={
                phase === "analyzing"
                  ? t.analyzing
                  : result?.status === "pending"
                    ? t.check
                    : t.analyze
              }
              busy={phase === "analyzing"}
              disabled={disabled || phase !== "uploaded" || unavailable}
              onPress={() => void analyze()}
            />
          ) : null}
        </>
      )}
    </View>
  );
}
