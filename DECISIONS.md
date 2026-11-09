# Decisions

- 2026-11-09: External photo intake starts as an explicit development-only preview with local 1–8-photo drafts. Production navigation and existing seller access stay unchanged; there is no upload, AI, SMS, offer or financial command in this slice.
- 2026-11-09: Use SDK-compatible expo-image-picker and expo-file-system for user-initiated photos and private local drafts. Load native modules only inside the preview; request no microphone access and preserve saved drafts on cancellation or write failure.

- 2026-11-05: #66 adds SDK-compatible expo-notifications for owner-requested seller push. Reuse owner-authorized original Komisio sounds; permission is explicit, identity comes from the authenticated platform, and native/device verification precedes release.
- 2026-11-06: #70 requests 20 recent sales in Overview. Fall back to the legacy five-row RPC only while the explicit-limit overload is absent; preserve seller/currency binding, price validation, recorded-sale ordering and existing failure handling.
- 2026-11-06: #72 requests native push permission once after authenticated seller lookup when OS permission is undetermined. Persist the attempt before prompting; preserve existing choices and account isolation. Profile notification controls remain available.
