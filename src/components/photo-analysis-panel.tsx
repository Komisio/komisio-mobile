import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { useI18n } from "@/lib/i18n";
import { photoAnalysisCopy } from "@/lib/photo-analysis-copy";
import { guestPhotoAnalysis } from "@/lib/guest-photo-analysis-runtime";
import type {
  PhotoSuggestion,
  PhotoAnalysisResult,
} from "@/lib/photo-analysis";
import type { ItemDraftSnapshot } from "@/lib/photo-draft";
import { Button, Message, colors, uiStyles } from "./ui";

export function PhotoAnalysisPanel({
  snapshot,
  onSuggestion,
  disabled,
}: {
  snapshot: ItemDraftSnapshot;
  onSuggestion(output: PhotoSuggestion): void;
  disabled: boolean;
}) {
  const { locale } = useI18n(),
    t = photoAnalysisCopy(locale);
  const language = locale === "da" ? "dk" : locale;
  // Suggestions belong to this local draft. Signing in must not restart AI.
  return (
    <Worker
      key={JSON.stringify([
        snapshot.draft.draftId,
        snapshot.draft.store?.id,
        snapshot.photos.map((p) => p.id),
        language,
      ])}
      {...{ snapshot, onSuggestion, disabled, language, t }}
    />
  );
}
function Worker({
  snapshot,
  onSuggestion,
  disabled,
  language,
  t,
}: Parameters<typeof PhotoAnalysisPanel>[0] & {
  language: string;
  t: ReturnType<typeof photoAnalysisCopy>;
}) {
  const [phase, setPhase] = useState<
    "uploading" | "analyzing" | "settled" | "error"
  >("uploading");
  const [progress, setProgress] = useState(0),
    [error, setError] = useState("");
  const [result, setResult] = useState<PhotoAnalysisResult | null>(null);
  const [retry, setRetry] = useState(0);
  // The keyed worker owns one image set; saving details must not restart it.
  const [input] = useState(snapshot);
  const apply = useRef(onSuggestion);
  useEffect(() => {
    apply.current = onSuggestion;
  }, [onSuggestion]);
  useFocusEffect(
    useCallback(() => {
      void retry; // Explicit retry starts the same journal-bound operation again.
      let current = true;
      setPhase("uploading");
      setError("");
      setResult(null);
      async function prepare() {
        try {
          const controller = await guestPhotoAnalysis();
          if (!current) return;
          await controller.prepare(input, language, (done) => {
            if (current) setProgress(done);
          });
          if (!current) return;
          setPhase("analyzing");
          // The existing journal reads/replays the same analysis on retry or return.
          const result = await controller.analyze(input, language);
          if (!current) return;
          setResult(result);
          setPhase("settled");
          if (result.status === "ready" && result.output)
            apply.current(result.output);
        } catch (e) {
          if (current) {
            setPhase("error");
            setError(e instanceof Error ? e.message : "");
          }
        }
      }
      void prepare();
      return () => {
        current = false;
      };
    }, [input, language, retry]),
  );
  const unavailable = [
    "ASSISTANCE_DISABLED",
    "AI_CREDITS_EXHAUSTED",
    "AI_CAP_REACHED",
    "USAGE_QUOTA_EXCEEDED",
    "NOT_FOUND",
    "ASSISTANCE_LIMIT",
    "GUEST_ANALYSIS_EXPIRED",
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
      {phase === "uploading" || phase === "analyzing" ? (
        <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
          <ActivityIndicator color={colors.brand} />
          <Text
            accessibilityLiveRegion="polite"
            style={[uiStyles.note, { flex: 1 }]}
          >
            {phase === "analyzing"
              ? t.analyzing
              : t.uploading
                  .replace(
                    "{done}",
                    String(Math.min(progress + 1, input.photos.length)),
                  )
                  .replace("{total}", String(input.photos.length))}
          </Text>
        </View>
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
        <Message tone="error">{unavailable ? t.unavailable : t.error}</Message>
      ) : null}
      {phase === "error" && !unavailable ? (
        <Button
          label={t.retry}
          disabled={disabled}
          onPress={() => {
            setRetry((n) => n + 1);
          }}
        />
      ) : result?.status === "pending" ? (
        <Button
          label={t.check}
          disabled={disabled}
          onPress={() => setRetry((n) => n + 1)}
        />
      ) : null}
    </View>
  );
}
