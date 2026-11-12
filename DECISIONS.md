# Decisions

- 2026-11-12: Owner replaces the central welcome page with direct photo capture. Step 2 automatically uploads and analyzes for phone-verified users; reuse the bound journal on return/retry, preserve manual details, and retain explicit verification and manual entry when AI is unavailable.

- 2026-11-12: Upload central AI photos after phone verification; run analysis only on explicit request after all uploads finish. Keep analysis retries user/project-bound and preserve manual details and compensation wishes. Submission retains its independent image journal and command identity.

- 2026-11-12: Use SDK-compatible expo-camera for consecutive still photos on iOS and Android. Save each shot to the existing private draft before the next capture; retain the eight-photo limit and library picker. Request no microphone access. AI remains a separate explicit action.

- 2026-11-11: Offer store-independent account creation with Apple, Google and email codes; retain password/SMS login and one-time phone verification before submission. Provider linking must retain the authenticated user and MFA; never merge seller records by contact email.
- 2026-11-11: Add SDK-compatible expo-apple-authentication for native Apple sign-in. Google uses the existing system authentication browser with PKCE on iOS/Android. Keep provider results isolated until identity checks pass; keys and provider secrets remain server-side.

- 2026-11-11: Show an editable calling code separately from the phone number, defaulted from device region with Sweden fallback. Use libphonenumber-js/min for national-prefix and pasted international-number handling; it adds no native module. Region is a suggestion, not residence or identity evidence.

- 2026-11-10: Show real fixed-SEK offers with server-timed 48-hour expiry and frozen store terms. Responses use the existing owner/project-bound command journal. Read confirmations before updating status; acceptance alone creates no seller, handover or credit.

- 2026-11-10: Owner sets central offers to expire after 48 hours and selects the recipient store's ordinary versioned seller agreement. Later versions require seller consent for subsequent uploads; earlier items retain their agreed version. Offer and agreement execution remain a separate backend slice.

- 2026-11-10: Follow the owner's mobile sketches for central photo intake: guest welcome, three visible steps, SMS cells, confirmed success and private item thumbnails. Preserve native capture, saved-photo recovery, owner-bound retries and existing store access; no simulated AI, offers or payments.

- 2026-11-10: Owner selects Komisio as the central photo recipient for Swedish residents and SEK only. Resolve the recipient from the server, preserve old drafts and pending requests, and record an explicit residence declaration before new submissions. Existing store login remains unchanged.

- 2026-11-10: Prepare Supabase phone verification for external requests without activating an SMS provider. Add a phone to an existing identity rather than signing it into another account; verify phone changes with a separate nonpersisting client and preserve the original MFA session.
- 2026-11-10: Use SDK-compatible expo-image-manipulator to decode and resize upload copies within 1536 pixels before JPEG encoding. Keep camera originals and saved drafts intact. The native dependency belongs in both iOS and Android builds, without preview flags.
- 2026-11-10: Freeze a user-bound external submission before sending images or item details. Preserve its request UUID and upload bytes across retries, reconcile unknown outcomes first, and clear only the matching draft revision after confirmed success. Existing financial-command journals stay separate.

- 2026-11-10: Consume native pending photo results on each draft read, serialized with explicit reset. Android activity recreation can keep the JS runtime alive; an earlier empty result must not hide later photos, and delayed recovery must not resurrect a cleared draft.

- 2026-11-09: Local draft saves serialize navigation: Back cannot open an unsaved-changes sheet during a save, and successful navigation waits until any sheet is removed. Failed saves keep the current form editable.

- 2026-11-09: Continue the owner-tested photo flow with one opted-in recipient and local item details. Upgrade photo manifests without losing images; serialize edits and reject stale forms. Store selection is separate from seller login. Requested prices are optional hints in the store currency.

- 2026-11-09: Owner directs one native iOS/Android codebase, tested in TestFlight before public release. Version 2.0.2 includes photo drafts and native camera permissions without preview flags. This supersedes the earlier development-only and autolinking-exclusion decisions.
- 2026-11-09: Photo preview runs in Expo Go or web only. Exclude image-picker and image-loader from native autolinking; retain the existing file-system module. A custom native preview requires a separate reviewed build configuration before release.
- 2026-11-09: External photo intake starts as an explicit development-only preview with local 1–8-photo drafts. Production navigation and existing seller access stay unchanged; there is no upload, AI, SMS, offer or financial command in this slice.
- 2026-11-09: Use SDK-compatible expo-image-picker and expo-file-system for user-initiated photos and private local drafts. Load native modules only inside the preview; request no microphone access and preserve saved drafts on cancellation or write failure.

- 2026-11-05: #66 adds SDK-compatible expo-notifications for owner-requested seller push. Reuse owner-authorized original Komisio sounds; permission is explicit, identity comes from the authenticated platform, and native/device verification precedes release.
- 2026-11-06: #70 requests 20 recent sales in Overview. Fall back to the legacy five-row RPC only while the explicit-limit overload is absent; preserve seller/currency binding, price validation, recorded-sale ordering and existing failure handling.
- 2026-11-06: #72 requests native push permission once after authenticated seller lookup when OS permission is undetermined. Persist the attempt before prompting; preserve existing choices and account isolation. Profile notification controls remain available.

- 2026-11-10: Central onboarding explicitly binds the SMS identity to its own seller record. Email is contact-only. Final consent atomically saves account, Swedish bank and frozen agreement evidence with a real grouped H-handover; retries retain the exact command. Ordinary email accounts stay unchanged.
- 2026-11-10: My items uses actual linked handover state to distinguish Ready for drop-off from Received and opens accepted requests directly at account/handover. Receipt is not labelled on-sale or credited; older offer reads without progress remain compatible.

- 2026-11-10: After physical receipt, the handover shows the selected item's fixed amount and server-frozen guarantee deadline in Stockholm time. Missing legacy evidence never invents a deadline; recording a guarantee is not balance credit.
