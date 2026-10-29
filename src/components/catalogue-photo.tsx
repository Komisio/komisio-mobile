import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { type Photo, photoSource } from "@/lib/catalogue";
import { useSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { Button, colors } from "./ui";

export function CataloguePhoto({
  photo,
  tenant,
  label,
  retryable = false,
}: {
  photo: Photo | null;
  tenant: string;
  label: string;
  retryable?: boolean;
}) {
  const { session } = useSession();
  const { d } = useI18n();
  const [attempt, setAttempt] = useState(0);
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!photo || !session || !url || !key)
    return (
      <View style={styles.placeholder}>
        <Text style={styles.caption}>{d.catalogue.noPhoto}</Text>
      </View>
    );
  return (
    <RemotePhoto
      key={`${photo.bucket}:${photo.path}:${attempt}`}
      source={photoSource(photo, tenant, url, key, session.access_token)}
      label={label}
      retryable={retryable}
      retry={() => setAttempt((n) => n + 1)}
    />
  );
}

function RemotePhoto({
  source,
  label,
  retryable,
  retry,
}: {
  source: ReturnType<typeof photoSource>;
  label: string;
  retryable: boolean;
  retry: () => void;
}) {
  const { d } = useI18n();
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  return (
    <View style={styles.placeholder}>
      {failed ? (
        <>
          <Text style={styles.caption}>{d.catalogue.photoFailed}</Text>
          {retryable && (
            <Button label={d.retry} variant="secondary" onPress={retry} />
          )}
        </>
      ) : (
        <>
          {!loaded && <ActivityIndicator color={colors.brand} />}
          <Image
            source={source}
            accessibilityLabel={label}
            style={StyleSheet.absoluteFill}
            contentFit="contain"
            cachePolicy="none"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#e5ebe7",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 12,
  },
  caption: { color: colors.muted, textAlign: "center", fontSize: 14 },
});
