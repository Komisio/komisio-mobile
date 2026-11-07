# Android: Google Play internal testing

Update the existing Play listing for `com.inority.komisio`. The previous bundle
was 1.0.0 (4). Keep the existing Expo project, remote version counter and upload
keystore. Play App Signing signs installs for testers. The upload certificate's
SHA-256 is `9AC6784EFD50A5F870191814C7787439C2AD4A39C30CA80AECC5B53992493C3A`.

The `android-play-internal` build profile creates a signed Android App Bundle
against the production portal. Set the project-scoped production file variable
`GOOGLE_SERVICES_JSON` in Expo to the Android **client** configuration from
Firebase project `komisio-push`. The private FCM v1 service account belongs only
in Expo's push credentials for this Android package. Keep both files out of Git.

1. Run the usual tests, lint and typecheck. Check the highest Play version code
   and `eas build:version:get -p android --profile android-play-internal`.
2. From the intended clean revision, run `eas build -p android --profile android-play-internal`.
   Confirm the resulting version code exceeds every previous Play upload.
3. Submit that specific build with `eas submit -p android --profile android-play-internal --id BUILD_ID`
   or upload the bundle on the **internal testing** track in Play Console.
   If Play requires draft releases during setup, finish the internal release in
   Play Console. Never promote it to production as part of this test.
4. Install via the Play opt-in link on a tester's Android phone. Sign in and
   grant notification permission. Verify registered-item and sold-item pushes,
   both sounds and opening the correct item with the app open, in the background
   and after a cold start. Check sign-out and notification opt-out.
5. Before a public rollout, review test results, complete Play's store, privacy,
   data safety and account requirements, and confirm the release audience.
