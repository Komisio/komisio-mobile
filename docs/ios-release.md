# iOS release and TestFlight

## Production identity

Use the existing **Komisio** App Store record, not **Komisio (Dev)**:

| Setting | Value |
| --- | --- |
| Apple app ID | `6753813071` |
| Bundle identifier | `com.inority.komisio` |
| EAS owner / slug | `chrillenilsson` / `komisio` |
| EAS project ID | `aa98c8e5-440a-4860-92e1-829f6b3bc1a1` |
| Restart version | `2.0.0` |

The npm package and GitHub repository remain `komisio-mobile`. The Expo slug
identifies the existing publishing project, not the source repository.

The last inspected approved Apple listing was `1.06`, with binary `1.0.6`,
build `53`. Version `2.0.0` is higher than both representations. EAS owns the
build counter and increments it; do not reset it or assume the next number is
54 without checking the current remote counter. Tablet support and the old
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

Only the iOS production store profile is configured. Android release identity
and signing require a separate verified setup; Expo Go development still works
on both platforms. No OTA update channel or legacy update delivery is enabled
by this change.

## Before the first cloud build

1. Integrate reviewed feature PRs into the intended release revision. Build from
   a clean, committed worktree; this configuration requires a commit. Obtain the
   agreed independent review of new changes.
2. Replace the scaffold Expo icon and splash with approved Komisio assets.
3. Resolve SDK compatibility warnings using `npx expo install --check`; run
   lint, typecheck, tests and the iOS export on the resulting revision.
4. Check EAS project identity, production environment and remote iOS build
   counter. Inspect existing distribution certificate and provisioning profile
   validity. Do not delete or regenerate signing credentials as a shortcut.
5. Verify production Supabase Auth, app-visible stores and the mobile API using
   read-only requests. Financial acceptance tests use synthetic fixtures.

After these checks and approval for the build/upload:

```sh
npx eas-cli@latest project:info
npx eas-cli@latest build:version:get --platform ios --profile production
npx eas-cli@latest build --platform ios --profile production
# Inspect the exact completed build, then submit its ID (not an ambiguous latest).
npx eas-cli@latest submit --platform ios --profile production --id <verified-build-id>
```

EAS submission uploads to App Store Connect/TestFlight; it does not constitute
App Review approval. Verify processing and install the actual signed build on
an iPhone. Test small/large screens, larger text, iPad, safe areas, keyboard,
back navigation, login/TOTP, photos, offline/retry and durable command recovery.
Test upgrading an existing installation: legacy tokens must not be treated as
Supabase sessions. Verify no previous account/store data is shown after switching.

## Before App Review and public availability

Update screenshots, privacy/support URLs and App Privacy answers to match the
new seller app. Resolve the account-deletion requirements for the actual account
lifecycle and review the encryption declaration and age-rating questions.
Replace old staff-oriented review notes with a working synthetic seller account,
an app-visible test store, populated item/payout history, and agreement access.
Keep credentials in App Store Connect's private review fields, not these docs.

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
