import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { I18nProvider } from "@/lib/i18n";
import { SessionProvider, useSession } from "@/lib/session";
import { Loading } from "@/components/ui";

function Routes() {
  const { ready, store, session, mfaRequired } = useSession();
  if (!ready) return <Loading />;
  const signedIn = Boolean(session) && !mfaRequired;
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!store}>
        <Stack.Screen name="store" />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(store) && !session}>
        <Stack.Screen name="login" />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(store) && Boolean(session) && mfaRequired}>
        <Stack.Screen name="mfa" />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(store) && signedIn}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <SessionProvider>
          <Routes />
        </SessionProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
