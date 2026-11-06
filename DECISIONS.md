# Decisions

- 2026-11-05: #66 adds SDK-compatible expo-notifications for owner-requested seller push. Reuse owner-authorized original Komisio sounds; permission is explicit, identity comes from the authenticated platform, and native/device verification precedes release.
- 2026-11-06: #70 requests 20 recent sales in Overview. Fall back to the legacy five-row RPC only while the explicit-limit overload is absent; preserve seller/currency binding, price validation, recorded-sale ordering and existing failure handling.
