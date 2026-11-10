import { useCallback, useEffect, useRef, useState } from "react";
import {
  router,
  useLocalSearchParams,
  usePreventRemove,
  useFocusEffect,
} from "expo-router";
import { Text, View } from "react-native";
import { Button, Field, Loading, Message, Screen, uiStyles } from "./ui";
import { PhotoStep } from "./photo-flow-ui";
import { PhoneCodeField } from "./phone-code-field";
import { photoFlowCopy } from "@/lib/photo-flow-copy";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import {
  externalSubmissionCopy,
  externalSubmissionError,
} from "@/lib/external-submission-copy";
import {
  beginPhoneVerification,
  finishPhoneVerification,
  type PhoneTicket,
} from "@/lib/phone-verification";
import { verifyPhoneCode } from "@/lib/phone-verification-runtime";
import { hasVerifiedPhone } from "@/lib/identity-gates";

export function PhotoPhoneScreen({ embedded = false }: { embedded?: boolean }) {
  const { locale } = useI18n();
  const t = externalSubmissionCopy(locale);
  const flow = photoFlowCopy(locale);
  const { session, refreshAssurance } = useSession();
  const { destination } = useLocalSearchParams<{ destination?: string }>();
  const target =
    destination === "requests" ? "/external-items" : "/photo-review";
  const [phone, setPhone] = useState(
    session?.user.phone ? `+${session.user.phone}` : "",
  );
  const [code, setCode] = useState("");
  const [ticket, setTicket] = useState<PhoneTicket | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [until, setUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const locked = useRef(false),
    alive = useRef(true);
  const disablePrevention = usePreventRemove(busy, () => {});
  const phoneVerified = hasVerifiedPhone(session?.user);
  useFocusEffect(
    useCallback(() => {
      if (phoneVerified && !busy && !locked.current && !embedded)
        router.replace(target);
    }, [phoneVerified, busy, target, embedded]),
  );
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    if (!until) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [until]);
  const remaining = Math.max(0, Math.ceil((until - now) / 1000));
  async function run(verify: boolean) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      if (verify) {
        if (!ticket) return;
        await finishPhoneVerification(
          supabase.auth,
          verifyPhoneCode,
          ticket,
          code,
        );
        await refreshAssurance();
        const assurance =
          await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (assurance.error) throw new Error("PHONE_UNAVAILABLE");
        if (alive.current) {
          disablePrevention();
          if (
            assurance.data.nextLevel === "aal2" &&
            assurance.data.currentLevel !== "aal2"
          )
            router.replace("/mfa");
          else if (!embedded) router.replace(target);
        }
      } else {
        const next = await beginPhoneVerification(supabase.auth, phone);
        if (alive.current) {
          setTicket(next);
          setCode("");
          setUntil(Date.now() + 60000);
          setNow(Date.now());
        }
      }
    } catch (e) {
      if (alive.current) {
        const code = e instanceof Error ? e.message : "";
        setError(
          (code.startsWith("PHONE_") && code !== "PHONE_UNAVAILABLE") ||
            code === "SESSION_CHANGED"
            ? externalSubmissionError(locale, code)
            : t.phoneUnavailable,
        );
      }
    } finally {
      locked.current = false;
      if (alive.current) setBusy(false);
    }
  }
  if (phoneVerified) return embedded ? null : <Loading />;
  const content = (
    <>
      {!embedded && destination !== "requests" ? <PhotoStep step={3} /> : null}
      <Text accessibilityRole="header" style={uiStyles.title}>
        {flow.phoneHeading}
      </Text>
      <Text style={uiStyles.body}>{flow.phoneHint}</Text>
      {session ? <Message>{t.existingAccount}</Message> : null}
      <View style={{ gap: 16 }}>
        <Field
          label={t.phone}
          value={phone}
          editable={!busy}
          onChangeText={(value) => {
            setPhone(value);
            setTicket(null);
            setCode("");
            setError("");
          }}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          autoCorrect={false}
          maxLength={30}
        />
        {ticket ? (
          <PhoneCodeField
            label={t.code}
            value={code}
            disabled={busy}
            onChange={setCode}
            onSubmit={() => {
              if (code.length === 6) void run(true);
            }}
          />
        ) : null}
        {error ? <Message tone="error">{error}</Message> : null}
        {ticket ? (
          <Button
            label={t.verify}
            busy={busy}
            disabled={code.length !== 6}
            onPress={() => void run(true)}
          />
        ) : null}
        <Button
          label={
            remaining
              ? t.resendWait.replace("{seconds}", String(remaining))
              : ticket
                ? t.resend
                : t.sendCode
          }
          variant={ticket ? "text" : "primary"}
          disabled={busy || remaining > 0 || !phone.trim()}
          busy={!ticket && busy}
          onPress={() => void run(false)}
        />
        <Text style={uiStyles.note}>{flow.whyPhone}</Text>
      </View>
    </>
  );
  return embedded ? (
    <View style={{ gap: 16 }}>{content}</View>
  ) : (
    <Screen topSafeArea={false} keyboardInsets>
      {content}
    </Screen>
  );
}
