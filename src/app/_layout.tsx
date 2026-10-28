import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { SessionProvider, useSession } from "@/lib/session";
import { Button, Loading, Message, Screen } from "@/components/ui";

function Routes() {
  const { d } = useI18n();
  const { ready, authFailed, retryAuth, store, session, mfaRequired } =
    useSession();
  // No route opens until session and two-step state are known.
  if (authFailed)
    return (
      <Screen title="Komisio">
        <Message tone="error">{d.authFailed}</Message>
        <Button label={d.retry} onPress={retryAuth} />
      </Screen>
    );
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
      <Stack.Protected
        guard={Boolean(store) && Boolean(session) && mfaRequired}
      >
        <Stack.Screen name="mfa" />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(store) && signedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="catalogue/[tenant]/[item]" />
        <Stack.Screen name="my-items/[tenant]/[item]" />
        <Stack.Screen name="agreement" />
        <Stack.Screen name="bank-account" />
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
