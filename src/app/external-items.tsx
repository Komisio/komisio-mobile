import { Redirect, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { useSession } from "@/lib/session";
import { Loading } from "@/components/ui";
export default function ExternalItems() {
  const { store, chooseStore } = useSession();
  const { sent, request } = useLocalSearchParams<{
    sent?: string;
    request?: string;
  }>();
  useEffect(() => {
    if (store) chooseStore(null);
  }, [store, chooseStore]);
  if (store) return <Loading />;
  return (
    <Redirect
      href={{
        pathname: "/(tabs)/items",
        params: {
          ...(sent ? { sent } : {}),
          ...(request ? { request } : {}),
        },
      }}
    />
  );
}
