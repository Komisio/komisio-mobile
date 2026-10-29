import { useCallback, useState, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import * as Linking from "expo-linking";
import { Button, uiStyles, Loading, Message, Screen } from "@/components/ui";
import { useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import {
  addressLines,
  emailUrl,
  mapUrl,
  parseStoreInfo,
  phoneUrl,
  websiteUrl,
  weekdays,
  type StoreInfo,
} from "@/lib/store-info";

export default function StoreInformation() {
  const { store, session } = useSession();
  if (!store || !session) return null;
  return (
    <StoreRead
      key={`${session.user.id}:${store.id}:${store.slug}`}
      slug={store.slug}
      name={store.name}
    />
  );
}

function StoreRead({ slug, name }: { slug: string; name: string }) {
  const [attempt, setAttempt] = useState(0);
  return (
    <ProfileRead
      key={attempt}
      slug={slug}
      name={name}
      retry={() => setAttempt((value) => value + 1)}
    />
  );
}

function ProfileRead({
  slug,
  name,
  retry,
}: {
  slug: string;
  name: string;
  retry: () => void;
}) {
  const { d } = useI18n();
  const t = d.storeInfo;
  const [state, setState] = useState<{
    status: "loading" | "ready" | "failed";
    info: StoreInfo | null;
  }>({ status: "loading", info: null });
  // Every focus/retry creates its own cancellation boundary. Store changes remount.
  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      setState({ status: "loading", info: null });
      void (async () => {
        try {
          const { data, error } = await supabase
            .rpc("public_store_profile", { p_slug: slug })
            .abortSignal(controller.signal);
          if (error) throw error;
          const info = parseStoreInfo(data, slug);
          if (!controller.signal.aborted) setState({ status: "ready", info });
        } catch {
          if (!controller.signal.aborted)
            setState({ status: "failed", info: null });
        }
      })();
      return () => controller.abort();
    }, [slug]),
  );
  return (
    <Screen topSafeArea={false} title={t.title} intro={name}>
      {state.status === "loading" ? (
        <Loading />
      ) : state.status === "failed" ? (
        <>
          <Message tone="error">{t.failed}</Message>
          <Button label={d.retry} onPress={retry} />
        </>
      ) : state.info ? (
        <StoreContent info={state.info} />
      ) : (
        <Message>{t.missing}</Message>
      )}
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading} accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

function StoreContent({ info }: { info: StoreInfo }) {
  const { d } = useI18n();
  const t = d.storeInfo;
  const [opening, setOpening] = useState(false);
  const [failed, setFailed] = useState(false);
  const address = addressLines(info.address);
  const map = mapUrl(info.address);
  const contacts = [
    {
      value: info.contact.phone,
      url: phoneUrl(info.contact.phone),
      label: t.phone,
    },
    {
      value: info.contact.email,
      url: emailUrl(info.contact.email),
      label: t.email,
    },
    {
      value: info.contact.website,
      url: websiteUrl(info.contact.website),
      label: t.website,
    },
  ].filter((contact) => contact.value.trim());
  const open = useCallback(
    async (url: string) => {
      if (opening) return;
      setOpening(true);
      setFailed(false);
      try {
        await Linking.openURL(url);
      } catch {
        setFailed(true);
      } finally {
        setOpening(false);
      }
    },
    [opening],
  );
  return (
    <>
      {info.concept.trim() ? (
        <Section title={t.concept}>
          <Text style={styles.text}>{info.concept}</Text>
        </Section>
      ) : null}
      <Section title={t.address}>
        <Text selectable style={styles.text}>
          {address.length ? address.join("\n") : t.noAddress}
        </Text>
        {map ? (
          <>
            <Button
              label={t.map}
              disabled={opening}
              onPress={() => void open(map)}
            />
            <Text style={styles.note}>{t.externalMap}</Text>
          </>
        ) : null}
      </Section>
      <Section title={t.hours}>
        {info.openingHours.length ? (
          weekdays.map((day) => {
            const hours = info.openingHours.find((row) => row.day === day);
            return (
              <View key={day} style={styles.hours}>
                <Text style={styles.day}>{t.days[day]}</Text>
                <Text style={styles.text}>
                  {hours ? `${hours.opens}–${hours.closes}` : t.unknown}
                </Text>
              </View>
            );
          })
        ) : (
          <Text style={styles.text}>{t.unknown}</Text>
        )}
      </Section>
      <Section title={t.contact}>
        {contacts.length ? (
          contacts.map(({ value, url, label }) => (
            <View key={label} style={styles.contact}>
              <Text selectable style={styles.text}>
                {value}
              </Text>
              {url ? (
                <Button
                  label={label}
                  variant="secondary"
                  disabled={opening}
                  onPress={() => void open(url)}
                />
              ) : null}
            </View>
          ))
        ) : (
          <Text style={styles.text}>{t.noContact}</Text>
        )}
      </Section>
      {failed ? <Message tone="error">{t.linkFailed}</Message> : null}
      {info.accepts.trim() ? (
        <Section title={t.accepts}>
          <Text style={styles.text}>{info.accepts}</Text>
        </Section>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  card: uiStyles.card,
  heading: uiStyles.heading,
  text: { ...uiStyles.body, flexShrink: 1 },
  note: uiStyles.note,
  hours: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    columnGap: 16,
    rowGap: 4,
  },
  day: { ...uiStyles.body, fontWeight: "600" },
  contact: { gap: 8 },
});
