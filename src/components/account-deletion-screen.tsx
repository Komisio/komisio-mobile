import { useEffect, useRef, useState } from "react";
import { Linking, Text } from "react-native";
import * as Crypto from "expo-crypto";
import { useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { formattingLocale } from "@/lib/locale";
import { accountDeletion } from "@/lib/account-deletion-runtime";
import { accountDeletionCopy } from "@/lib/account-deletion-copy";
import type { DeletionState } from "@/lib/account-deletion";
import { Button, Card, Choice, Loading, Message, Screen, uiStyles } from "./ui";

export function AccountDeletionScreen() {
  const { session } = useSession();
  if (!session) return null;
  return (
    <DeletionForm
      key={session.user.id}
      user={session.user.id}
      apple={
        session.user.identities?.some((i) => i.provider === "apple") ?? false
      }
    />
  );
}
function DeletionForm({ user, apple }: { user: string; apple: boolean }) {
  const { locale, d } = useI18n();
  const c = accountDeletionCopy(locale);
  const [state, setState] = useState<DeletionState | null | undefined>(
    undefined,
  );
  const [loadFailed, setLoadFailed] = useState(false);
  const [failed, setFailed] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const [linkFailed, setLinkFailed] = useState(false);
  const locked = useRef(false);
  const readGeneration = useRef(0);
  const requestId = useRef<string | null>(null);
  useEffect(() => {
    let current = true;
    const generation = ++readGeneration.current;
    void accountDeletion.read(user).then(
      (result) => {
        if (current && generation === readGeneration.current) {
          setState(result);
          setFailed(false);
          setLoadFailed(false);
        }
      },
      () => {
        if (current && generation === readGeneration.current)
          setLoadFailed(true);
      },
    );
    return () => {
      current = false;
    };
  }, [user, reload]);
  async function submit() {
    if (locked.current || !confirmed || state !== null) return;
    locked.current = true;
    setBusy(true);
    setFailed(false);
    ++readGeneration.current;
    try {
      requestId.current ??= Crypto.randomUUID();
      setState(await accountDeletion.submit(user, requestId.current, locale));
    } catch {
      setFailed(true);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return (
    <Screen title={c.title}>
      {state === undefined ? (
        loadFailed ? (
          <>
            <Message tone="error">{c.loadFailed}</Message>
            <Button label={d.retry} onPress={() => setReload((n) => n + 1)} />
          </>
        ) : (
          <Loading />
        )
      ) : state ? (
        <>
          <Card>
            <Text accessibilityRole="header" style={uiStyles.rowTitle}>
              {state.status === "requested"
                ? c.received
                : state.status === "processing"
                  ? c.processing
                  : c.completed}
            </Text>
            {state.status !== "completed" ? (
              <>
                <Text style={uiStyles.body}>{c.pending}</Text>
                <Text style={uiStyles.body}>
                  {c.deadline}{" "}
                  {new Intl.DateTimeFormat(formattingLocale(locale), {
                    dateStyle: "long",
                  }).format(new Date(state.respondBy))}
                  .
                </Text>
              </>
            ) : null}
          </Card>
          {loadFailed ? <Message tone="error">{c.loadFailed}</Message> : null}
          <Button
            label={c.refresh}
            variant="secondary"
            onPress={() => setReload((n) => n + 1)}
          />
        </>
      ) : (
        <>
          <Text style={uiStyles.body}>{c.intro}</Text>
          <Card>
            <Text style={uiStyles.body}>{c.retained}</Text>
            <Text style={uiStyles.body}>{c.timing}</Text>
          </Card>
          <Choice
            label={c.confirm}
            role="checkbox"
            listRow
            selected={confirmed}
            disabled={busy}
            onPress={() => setConfirmed((v) => !v)}
          />
          {failed ? <Message tone="error">{c.failed}</Message> : null}
          <Button
            label={c.submit}
            busy={busy}
            disabled={!confirmed || busy}
            onPress={() => void submit()}
          />
          {failed ? (
            <Button
              label={c.refresh}
              variant="secondary"
              disabled={busy}
              onPress={() => setReload((n) => n + 1)}
            />
          ) : null}
        </>
      )}
      {apple ? (
        <Card>
          <Text style={uiStyles.body}>{c.apple}</Text>
          <Button
            label={c.appleLink}
            variant="text"
            onPress={() => {
              setLinkFailed(false);
              void Linking.openURL("https://support.apple.com/102571").catch(
                () => setLinkFailed(true),
              );
            }}
          />
          {linkFailed ? (
            <Message tone="error">{d.externalPage.failed}</Message>
          ) : null}
        </Card>
      ) : null}
    </Screen>
  );
}
