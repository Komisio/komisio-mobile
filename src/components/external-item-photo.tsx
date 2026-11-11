import { useCallback, useState } from "react";
import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";
import { View } from "react-native";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/session";
import { colors } from "./theme";

export function ExternalItemPhoto({
  owner,
  photo,
  label,
}: {
  owner: string;
  photo: string;
  label: string;
}) {
  const { session } = useSession();
  const [source, setSource] = useState<{
    owner: string;
    photo: string;
    url: string;
  } | null>(null);
  useFocusEffect(
    useCallback(() => {
      let current = true;
      setSource(null);
      if (session?.user.id === owner) {
        // The private bucket enforces ownership and phone/MFA checks. URLs live
        // only in component memory and the native image cache is disabled.
        void supabase.storage
          .from("external-item-photos")
          .createSignedUrl(`${owner}/${photo}.jpg`, 60)
          .then(({ data, error }) => {
            if (current && !error && data)
              setSource({ owner, photo, url: data.signedUrl });
          })
          .catch(() => {
            /* Keep the item usable when its thumbnail is unavailable. */
          });
      }
      return () => {
        current = false;
      };
    }, [owner, photo, session?.user.id]),
  );
  const url =
    source?.owner === session?.user.id &&
    source?.owner === owner &&
    source?.photo === photo
      ? source.url
      : null;
  return (
    <View
      style={{
        width: 64,
        height: 72,
        backgroundColor: colors.softAccent,
        borderRadius: 12,
        overflow: "hidden",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Image
        source={url ? { uri: url } : require("../../assets/icons/items.svg")}
        accessibilityLabel={label}
        cachePolicy="none"
        contentFit="contain"
        onError={() => setSource(null)}
        style={
          url ? { width: "100%", height: "100%" } : { width: 28, height: 28 }
        }
      />
    </View>
  );
}
