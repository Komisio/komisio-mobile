import { Redirect, useLocalSearchParams } from "expo-router";
export default function ExternalItems() {
  const { sent, request } = useLocalSearchParams<{
    sent?: string;
    request?: string;
  }>();
  return (
    <Redirect
      href={{
        pathname: "/(tabs)/items",
        params: {
          source: "komisio",
          ...(sent ? { sent } : {}),
          ...(request ? { request } : {}),
        },
      }}
    />
  );
}
