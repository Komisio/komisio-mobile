# Decisions

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
