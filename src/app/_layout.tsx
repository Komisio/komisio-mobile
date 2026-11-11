import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { SessionProvider, useSession } from "@/lib/session";
import { Button, Loading, Message, Screen } from "@/components/ui";
import {
  detailHeaderOptions,
  photoCloseOptions,
} from "@/components/detail-navigation";
import { PushBridge } from "@/components/push-bridge";
import { photoDraftCopy } from "@/lib/photo-draft-copy";
import { itemDraftCopy } from "@/lib/item-draft-copy";
import { externalSubmissionCopy } from "@/lib/external-submission-copy";
import { hasVerifiedEmail } from "@/lib/identity-gates";
import { externalOfferCopy } from "@/lib/external-offer-copy";
import { externalOnboardingCopy } from "@/lib/external-onboarding-copy";
import { photoFlowCopy } from "@/lib/photo-flow-copy";

function Routes() {
  const { d, locale } = useI18n();
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
  const sellerRoutes =
    Boolean(store) && signedIn && hasVerifiedEmail(session?.user);
  const homeRoute = session && mfaRequired ? "/mfa" : "/home";
  const photoHome = "/home/sell";
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth-callback" />
      <Stack.Protected guard={!mfaRequired} redirectTo={homeRoute}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="store" />
        <Stack.Screen
          name="account-auth"
          options={({ navigation }) =>
            detailHeaderOptions("/home", d.close, navigation.canGoBack())
          }
        />
        <Stack.Screen
          name="login"
          options={({ navigation }) =>
            detailHeaderOptions("/home", d.close, navigation.canGoBack())
          }
        />
        <Stack.Screen
          name="language"
          options={({ navigation }) =>
            detailHeaderOptions(
              "/(tabs)/profile",
              d.profile.back,
              navigation.canGoBack(),
            )
          }
        />
      </Stack.Protected>
      <Stack.Protected guard={sellerRoutes} redirectTo={homeRoute}>
        <Stack.Screen
          name="catalogue/[tenant]/[item]"
          options={({ navigation }) =>
            detailHeaderOptions(
              "/(tabs)",
              d.catalogue.back,
              navigation.canGoBack(),
            )
          }
        />
        <Stack.Screen
          name="store-info"
          options={({ navigation }) =>
            detailHeaderOptions(
              "/(tabs)",
              d.storeInfo.back,
              navigation.canGoBack(),
            )
          }
        />
        <Stack.Screen
          name="my-items/[tenant]/[item]"
          options={({ navigation }) =>
            detailHeaderOptions(
              "/(tabs)/items",
              d.items.back,
              navigation.canGoBack(),
            )
          }
        />
        <Stack.Screen
          name="agreement"
          options={({ navigation }) =>
            detailHeaderOptions(
              "/(tabs)/profile",
              d.agreement.back,
              navigation.canGoBack(),
            )
          }
        />
        <Stack.Screen
          name="bank-account"
          options={({ navigation }) =>
            detailHeaderOptions(
              "/(tabs)/profile",
              d.bank.back,
              navigation.canGoBack(),
            )
          }
        />
      </Stack.Protected>

      <Stack.Protected guard={signedIn} redirectTo={homeRoute}>
        <Stack.Screen
          name="account-methods"
          options={({ navigation }) =>
            detailHeaderOptions(
              "/(tabs)/profile",
              d.close,
              navigation.canGoBack(),
            )
          }
        />
        <Stack.Screen
          name="email-login"
          options={({ navigation }) =>
            detailHeaderOptions(
              "/(tabs)/profile",
              d.close,
              navigation.canGoBack(),
            )
          }
        />
        <Stack.Screen
          name="notifications"
          options={({ navigation }) =>
            detailHeaderOptions(
              sellerRoutes ? "/(tabs)/profile" : "/external-items",
              d.close,
              navigation.canGoBack(),
            )
          }
        />
        <Stack.Screen
          name="external-onboarding/[offer]"
          options={({ navigation }) => ({
            ...detailHeaderOptions(
              "/external-items",
              d.close,
              navigation.canGoBack(),
            ),
            title: externalOnboardingCopy(locale).title,
          })}
        />
        <Stack.Screen
          name="external-offer/[offer]"
          options={({ navigation }) => ({
            ...detailHeaderOptions(
              "/external-items",
              d.close,
              navigation.canGoBack(),
            ),
            title: externalOfferCopy(locale).title,
          })}
        />
        <Stack.Screen
          name="external-items"
          options={({ navigation }) => ({
            ...detailHeaderOptions(
              "/(tabs)/items",
              d.close,
              navigation.canGoBack(),
            ),
            title: photoFlowCopy(locale).myItems,
          })}
        />
        <Stack.Screen
          name="photo-sent"
          options={({ navigation }) => ({
            ...detailHeaderOptions(
              "/external-items",
              d.close,
              navigation.canGoBack(),
            ),
            title: externalSubmissionCopy(locale).success,
          })}
        />
      </Stack.Protected>
      <Stack.Protected guard={!session || signedIn} redirectTo={homeRoute}>
        <Stack.Screen
          name="photo-draft"
          options={({ navigation }) => ({
            ...detailHeaderOptions(photoHome, d.close, navigation.canGoBack()),
            title: photoDraftCopy(locale).title,
            ...photoCloseOptions(photoHome, d.close, true),
          })}
        />
        <Stack.Screen
          name="photo-store"
          options={({ navigation }) => ({
            ...detailHeaderOptions(
              "/photo-draft",
              d.close,
              navigation.canGoBack(),
            ),
            title: itemDraftCopy(locale).storeTitle,
            ...photoCloseOptions(photoHome, d.close),
          })}
        />
        <Stack.Screen
          name="photo-details"
          options={({ navigation }) => ({
            ...detailHeaderOptions(
              "/photo-store",
              d.close,
              navigation.canGoBack(),
            ),
            title: itemDraftCopy(locale).detailsTitle,
            ...photoCloseOptions(photoHome, d.close),
          })}
        />
        <Stack.Screen
          name="photo-review"
          options={({ navigation }) => ({
            ...detailHeaderOptions(
              "/photo-details",
              d.close,
              navigation.canGoBack(),
            ),
            title: externalSubmissionCopy(locale).send,
            ...photoCloseOptions(photoHome, d.close),
          })}
        />
        <Stack.Screen
          name="photo-phone"
          options={({ navigation }) => ({
            ...detailHeaderOptions(
              "/photo-review",
              d.close,
              navigation.canGoBack(),
            ),
            title: externalSubmissionCopy(locale).phoneTitle,
            ...photoCloseOptions(photoHome, d.close),
          })}
        />
      </Stack.Protected>
      <Stack.Protected
        guard={Boolean(session) && mfaRequired}
        redirectTo={homeRoute}
      >
        <Stack.Screen name="mfa" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <I18nProvider>
        <SessionProvider>
          <PushBridge />
          <Routes />
        </SessionProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
