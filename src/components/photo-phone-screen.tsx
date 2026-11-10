import { useCallback, useEffect, useRef, useState } from "react";
import {
  router,
  useLocalSearchParams,
  usePreventRemove,
  useFocusEffect,
} from "expo-router";
import { Button, Card, Field, Loading, Message, Screen } from "./ui";
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

export function PhotoPhoneScreen() {
  const { locale } = useI18n();
  const t = externalSubmissionCopy(locale);
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
      if (phoneVerified && !busy && !locked.current) router.replace(target);
    }, [phoneVerified, busy, target]),
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
          router.replace(
            assurance.data.nextLevel === "aal2" &&
              assurance.data.currentLevel !== "aal2"
              ? "/mfa"
              : target,
          );
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
  if (phoneVerified) return <Loading />;
  return (
    <Screen topSafeArea={false} keyboardInsets>
      <Message>{t.phoneIntro}</Message>
      {session ? <Message>{t.existingAccount}</Message> : null}
      <Card>
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
          <Field
            label={t.code}
            value={code}
            editable={!busy}
            onChangeText={(value) =>
              setCode(value.replace(/\D/g, "").slice(0, 6))
            }
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={6}
            onSubmitEditing={() => {
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
      </Card>
    </Screen>
  );
}
