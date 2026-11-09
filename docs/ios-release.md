# iOS release and TestFlight

## Production identity

Use the existing **Komisio** App Store record, not **Komisio (Dev)**:

| Setting           | Value                                  |
| ----------------- | -------------------------------------- |
| Apple app ID      | `6753813071`                           |
| Bundle identifier | `com.inority.komisio`                  |
| EAS owner / slug  | `chrillenilsson` / `komisio`           |
| EAS project ID    | `aa98c8e5-440a-4860-92e1-829f6b3bc1a1` |
| Release version   | `2.0.2`                                |

The npm package and GitHub repository remain `komisio-mobile`. The Expo slug
identifies the existing publishing project, not the source repository.

Apple approved version `2.0.0` and closed that release train. Build `56` was
uploaded successfully but subsequently rejected with ITMS-90186 and ITMS-90062.
Version `2.0.2` is the next TestFlight candidate, including native photo drafts.
Use the standard `production` profile; no development flag or separate native
implementation is needed. TestFlight distribution is separate from choosing a
build for App Review/public release. The same codebase builds Android, and
preparing this iOS candidate does not update Google's pending release.
EAS owns the build counter and
increments it; do not reset it or assume the next number without checking the
current remote counter. `autoIncrement` increments the build number, not the
marketing version: update `expo.version` before submitting to a new release train.
Tablet support and the old
`komisioapp` URL scheme are retained alongside `komisio`; upgrade behavior and
iPad layout still need device verification. Auth email links continue on the web.

## Build environment

`eas.json` pins the production portal and Supabase project. The EAS **production**
environment must additionally contain `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
for that project, with plaintext or sensitive visibility. It is a public client
key bundled into the app, never a service-role or secret key. Never put signing
credentials in the repository.

`EXPO_NO_DOTENV=1` prevents Expo from loading local dotenv files. `.easignore`
also excludes them from the uploaded archive. The pre-install hook rejects
missing keys, unexpected endpoints/profiles, service-role JWTs and JWT keys from
other projects. Opaque publishable keys cannot be associated with a project
offline: validate the key using a read-only authenticated public API request
before starting a build. Passing this guard is not an authorization check or
evidence that the backend is healthy.

The `screenshots` profile additionally builds an unsigned iOS simulator app
using the same production endpoints and public client key. It cannot be installed
on a physical device, does not increment the store build counter and has no
submission job. Android uses the separate [Google Play internal test profile](android-release.md); Expo Go development still works
on both platforms. No OTA update channel or legacy update delivery is enabled
by this change.

## Before the first cloud build

1. Integrate reviewed feature PRs into the intended release revision. Build from
   a clean, committed worktree; this configuration requires a commit. Obtain the
   agreed independent review of new changes.
2. Verify the Komisio icon and splash on the signed build. The exported assets
   use the existing `assets/brand/mark.svg` geometry, forest green and lime;
   the app icon is an opaque 1024px square, with separate adaptive foreground
   and monochrome assets for Android. Export sources are in `assets/brand/`.
   The UI currently supports light appearance only, with dark status-bar text.
3. Resolve SDK compatibility warnings using `npx expo install --check`; run
   lint, typecheck, tests and the iOS export on the resulting revision.
4. Check EAS project identity, production environment and remote iOS build
   counter. Inspect existing distribution certificate and provisioning profile
   validity. Do not delete or regenerate signing credentials as a shortcut.
5. Verify production Supabase Auth, app-visible stores and the mobile API using
   read-only requests. The deployed portal requires both
   `KOMISIO_MOBILE_API_ENABLED=true` and `KOMISIO_INTAKE_ENABLED=true`.
   Environment changes require a deployment through the platform release process;
   setting a variable alone does not update an existing deployment. Check the
   production database includes the follow-up migrations for `my_item_detail`,
   `my_seller_payouts_page`, catalogue photo derivatives, `my_recent_sales`
   (`20261030090000_my_recent_sales`) and the public facts in `store_catalogue`
   (platform #731). Check that every app-visible store has a supported country
   in its published store profile; the local bank form deliberately does not
   guess a country when it is missing. Financial acceptance
   tests use synthetic fixtures. Native requests have no Origin; do not widen
   the browser origin allowlist to make native requests work.
6. Verify export compliance before TestFlight, not only before App Review.
   `ios.config.usesNonExemptEncryption=false` declares the current app uses no
   non-exempt encryption: transport uses HTTPS, SecureStore uses iOS Keychain,
   and Expo Crypto is used for UUID generation (its native implementation uses
   Apple's system libraries). Reassess this declaration if cryptographic
   dependencies or uses change. Confirm the generated native Info.plist contains
   `ITSAppUsesNonExemptEncryption=false` and inspect processing in App Store Connect.

After these checks and approval for the build/upload:

```sh
npx eas-cli@latest project:info
npx eas-cli@latest build:version:get --platform ios --profile production
npx eas-cli@latest build --platform ios --profile production
# Inspect the exact completed build, then submit its ID (not an ambiguous latest).
npx eas-cli@latest submit --platform ios --profile production --id <verified-build-id>
```

EAS submission uploads to App Store Connect/TestFlight; it does not constitute
successful Apple processing or App Review approval. EAS `FINISHED` can precede
an Apple rejection email. Verify the exact version/build's processing state in
App Store Connect (or its API); an upload receipt alone is not acceptance.
Report uploaded, processing, invalid and ready-for-testing as distinct states.
Install the actual signed build on
an iPhone. Test small/large screens, larger text, iPad, safe areas, keyboard,
back navigation, login/TOTP, photos, offline/retry and durable command recovery.
Test upgrading an existing installation: legacy tokens must not be treated as
Supabase sessions. Verify no previous account/store data is shown after switching.

## Before App Review and public availability

The owner chose local-account entry using the store country; IBAN changes go
through the store. The three-field form rejects complete IBAN-shaped input
without claiming local account verification. Existing accounts and pending
payloads retain their original country and kind. Test bank/payout flows with
synthetic accounts without actual bank payments. Existing staff destination
review remains required; the app adds no country-specific bank validation.

Verify Postgres timestamps (including fractional seconds) in the signed Hermes
build when checking recent sales and payout history on an iPhone.

Update screenshots, privacy/support URLs and App Privacy answers to match the
new seller app. Resolve the account-deletion requirements for the actual account
lifecycle and review the encryption declaration and age-rating questions.
Replace old staff-oriented review notes with a working synthetic seller account,
an app-visible test store, populated item/payout history, and agreement access.
Keep credentials in App Store Connect's private review fields, not these docs.

## Native screenshot capture without a local Mac

Two manually triggered EAS workflows separate building from capture, so retries
reuse an exact simulator build ID. Check the account's remaining build and
workflow allowance before starting; neither workflow upgrades the subscription.

```sh
npx eas-cli@latest workflow:run .eas/workflows/build-screenshot-simulator.yml
# Record the exact successful simulator build ID and its source commit.
npx eas-cli@latest workflow:run .eas/workflows/capture-appstore.yml \
  -F build_id=<simulator-build-id> -F mode=probe
```

`probe` captures only the store picker, without login. It checks the worker,
native app and required iPad resolution; it is not a marketing screenshot.

For the five seller views in both languages, create project variables
`MAESTRO_SCREENSHOT_EMAIL` and `MAESTRO_SCREENSHOT_PASSWORD` with **secret**
visibility in the EAS **preview** environment. Use only an owner-approved
synthetic seller account that can access the two configured demo stores. Never
use an owner/admin login. Do not put passwords in commands, workflow inputs,
source files or `EXPO_PUBLIC_*` variables. The production build environment does
not need these credentials. A seller with TOTP requires a separate workflow;
do not disable MFA or bypass authentication for screenshots.

```sh
npx eas-cli@latest workflow:run .eas/workflows/capture-appstore.yml \
  -F build_id=<simulator-build-id> -F mode=capture
```

The capture runs the ordinary app in a disposable 13-inch iPad Pro simulator
on an EAS macOS worker. It selects the language/store through the UI, signs in,
and visits Overview, My Items, Money, Store and Profile. It performs no financial
writes. Maestro runs locally on that worker; no Maestro Cloud subscription or
Expo Simulators partner access is needed. Its diagnostic reports and command
output can contain expanded credentials, so they are never uploaded or printed.
The marketing artifact contains only the ten explicitly named PNGs and a
build/device/dimensions manifest, after every flow succeeds. A fresh output
directory is required. A failed run may publish a separate `capture-diagnostic`
image only after the credential fields have gone and no literal password is
present in the native hierarchy. Its manifest says `marketingReady: false`;
never upload that image to App Store Connect. Raw reports remain on the worker.

To replace an iPhone capture from the same app build, add `-F device=iphone`
to the capture command. This selects an iPhone 16 Pro and checks medium
Dynamic Island screenshot dimensions. The default `device=ipad` uses a
13-inch iPad Pro. The runner matches the device to a compatible installed
runtime instead of assuming the newest runtime supports every device.

Download the `native-appstore-screenshots` artifact and visually inspect every
image: correct language, store/currency, loaded images and amounts, no errors,
truncation or title/price overlap. The dimension check accepts only native
portrait 2064×2752 or 2048×2732 iPad captures, or 1206×2622 / 1179×2556
iPhone captures when explicitly selected. It does not prove the visual content is
correct. Upload reviewed captures to their matching App Store locales manually;
this workflow never submits or releases the app. Remove the capture credentials
from EAS when no longer needed through the account's normal secret management.

Validate the intended version/build before requesting App Review. Choose the
release timing explicitly. Do not restore availability of the legacy binary
while preparing the restart. Publication is a separate owner-authorized action.

## Proposed seller-only store copy

Drafts for owner review; not uploaded. Add further localized metadata only after
the app's corresponding translations are reviewed on a device.

**Swedish subtitle:** Dina varor och försäljningar

**Swedish description:**

Följ dina varor hos butiker som använder Komisio. Se vad du har till försäljning,
vad som har sålts och vilka varor som snart avslutas.

- Se dina varor, deras status och senaste försäljningar.
- Följ ditt saldo, begär utbetalning och se utbetalningshistorik.
- Hantera ditt utbetalningskonto och läs ditt avtal med butiken.
- Utforska butikens varor och hitta butikens kontaktuppgifter.

Du behöver ett säljarkonto hos en ansluten butik. Kontakta butiken för att komma
igång. Utbetalningar hanteras enligt butikens villkor.

**English subtitle:** Your items and sales

**English description:**

Keep track of your items at stores using Komisio. See what is for sale, what has
sold, and which items are nearing the end of their selling period.

- View your items, their status and recent sales.
- Follow your balance, request a payout and view payout history.
- Manage your payout account and read your agreement with the store.
- Browse the store's items and find its contact details.

You need a seller account with a participating store. Contact the store to get
started. Payouts are handled according to the store's terms.

## References

- [Expo app versions](https://docs.expo.dev/build-reference/app-versions/)
- [EAS environments](https://docs.expo.dev/eas/environment-variables/usage/)
- [EAS upload exclusions](https://docs.expo.dev/build-reference/easignore/)
- [Submitting to Apple](https://docs.expo.dev/submit/ios/)
- [SecureStore export compliance](https://docs.expo.dev/versions/v58.0.0/sdk/securestore/#exempting-encryption-prompt)
