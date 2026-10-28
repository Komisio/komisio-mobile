# Komisio Mobile

Mobile app for [Komisio](https://github.com/Komisio/komisio), the consignment
platform for second-hand stores. Built with Expo and React Native.

> Status: store picker, login with two-step verification, profile, and the
> store catalogue with item detail (S10/S11), and own items (S19/S20).
> The seller overview (S22) shows server balances, item counts and recent payouts.
> Profile links to the agreement reader (S08). Money is still a placeholder
> (see `docs/screens.md`).

## Direction

- **Thin client.** The platform (`Komisio/komisio`) is the source of truth.
  The app validates forms and keeps drafts; the server checks permissions,
  agreements, amounts and state changes.
- **Sign-in** with Supabase Auth. **Writes and server flows** go through a
  small mobile API in the platform that reuses the same server functions as the
  web. Direct Supabase reads only for named, reviewed read functions.
- **Screen by screen.** Screens from the earlier app are the design reference;
  the owner decides per screen and function what to keep, change, remove or
  postpone before it is built here. The decisions for version 1 are in
  [`docs/screens.md`](docs/screens.md).
- **Older app versions keep working** for a defined support period, and retried
  commands never create duplicate operations.

## Getting started

Requires Node.js 22.13+, 24.3+ or 26+, as declared in `engines` in
`package.json`. `.nvmrc` selects Node 24 (`nvm use`).

Copy `.env.example` to `.env.local` and point it at a Komisio platform
(local Supabase or staging). Only public client values belong there.

```bash
npm install
npm start          # Expo dev server
npm run typecheck  # TypeScript
npm run lint       # ESLint
npm test           # unit tests (node:test)
```

Routes live in `src/app/`; keep components, hooks and utilities outside it.
See `AGENTS.md` for Expo conventions.

## Store catalogue (S10/S11)

The Store tab uses the reviewed `store_catalogue` and `store_catalogue_item`
RPCs from [platform PR #715](https://github.com/Komisio/komisio/pull/715).
The connected platform needs that migration and the store must opt into app
visibility. The signed-in account must match exactly one seller in that store;
the server derives that identity from the session. These reads take the tenant
ID, not a client-supplied seller ID.

Search matches titles and categories. The two-column list loads 30 rows at a
time; the detail shows the current price, descriptive facts and photos. Changes
to store/account discard the previous view. Returning to the catalogue refreshes
all loaded pages in place, keeping the list mounted and its scroll position.
Network failures retain the rows for retry; denied access clears them. A new
search resets the list. Favourites and category filter chips are outside this slice.

Photos use authenticated Storage URLs with the current session token. No public
or signed URL is stored, and Expo Image's persistent cache is disabled. Failed
detail images can be retried. The original S10/S11 screenshots are available in
[reference PR #4](https://github.com/Komisio/komisio-mobile/pull/4).

Unit tests cover stale requests, pagination, revoked access and the read
contract. Native-device behavior, real Storage downloads and staging must also
be verified before release; successful JavaScript export alone does not verify
those paths.

## My items (S19/S20)

The My items tab uses `my_items_page` with the chosen store's seller ID from
`my_seller_accounts`. Active, expiring, sold, ended and all groups are filtered
on the server before 25-row paging. Search matches titles, categories and item
references. Detail uses the exact own-item `my_item_detail` RPC, including
sold and ended items; it never substitutes a store-catalogue item read.

The connected platform needs [platform PR #718](https://github.com/Komisio/komisio/pull/718)
for detail and the expiring filter. Missing contracts produce an explicit
failure with retry, rather than a partial or unrelated fallback. This dependency
is not deployed by the mobile app.

The screen shows the engine's recorded prices, lifecycle status and dates.
It does not compute a seller payout or promise that an item is ready to collect.
Planned markdowns are labelled as plans; calendar dates use the platform's
Stockholm timezone. Own-item photos are outside this read contract. Search and
filter changes reset the list; returning from detail revalidates the loaded
range in place. Account/store changes discard the prior view.

Unit tests cover contract validation, amount/date presentation, 25-row paging,
stale scopes and denied/offline refresh. Browser and native-device verification
remain required before release; typecheck, lint and export are not UI tests.

## Seller overview (S22)

The Overview tab combines `my_seller_economy` with the first `expiring` page of
`my_items_page`. It requires the expiring-filter migration in
[platform PR #718](https://github.com/Komisio/komisio/pull/718) and own-item detail
from [mobile PR #8](https://github.com/Komisio/komisio-mobile/pull/8).

Available, reserved and paid amounts are server facts; negative available
balances remain visible. Complete item counts are independent of the page size.
Up to five expiring items link to their own-item detail, and up to five recent
payout requests show recorded status and the **request date**, not a payment date.
There is no client-side balance calculation or financial write. An incomplete
read fails explicitly; it never turns missing financial data into a zero balance.
Focus/retry refreshes clear the previous snapshot, and blur/account changes cancel
late results. Native and browser navigation checks remain required before release.

## Agreement reader (S08)

Profile opens the current agreement and accepted-version history through
`my_seller_agreement_text`, with 20-row history pagination. Published translations
are selectable; legal text is shown verbatim, not translated by the app.
The recorded acceptance date, source and language remain separate from the
language currently being viewed. Historical versions cannot be accepted here.

This slice is read-only: accepting a new agreement remains in the seller portal
until the mobile command flow is implemented. There is no new agreement rule,
signature, PDF or database migration. The old S08 reference contains only a
loading spinner; the reader follows the platform contract and existing app theme.
Interactive large-text/history navigation and native checks remain pending.

## Payout account (S25)

Profile opens the selected seller's bank details through `seller_bank_details`.
Holder, searchable ISO country, IBAN/local account and routing follow the seller
portal contract, including IBAN country/checksum validation. There is no Swish.
Saving uses the expected bank version; a concurrent edit requires reloading and
reviewing the latest details, never silently overwriting them.

Writes depend on [platform PR #720](https://github.com/Komisio/komisio/pull/720),
its opt-in mobile API flag and the exact browser-origin allowlist. The app uses
`EXPO_PUBLIC_KOMISIO_WEB_URL` as the portal origin (HTTPS, or HTTP loopback for
development), and `POST /api/mobile/v1/seller` with the current user's bearer token.
Explicit SDK 58 `expo/fetch` rejects redirects and omits cookies. The API still
enforces the live seller identity, MFA, recovery restrictions and engine rules.

SDK-matched `expo-crypto` generates request UUIDs. Before sending, the app saves
and reads back an immutable command bound to the user, tenant, seller, Supabase
project and portal destination. Native storage is one SecureStore value: storage
failures prevent dispatch, and incomplete auth-store chunks are never interpreted
as an absent command. Web is a development target and uses localStorage plus an
exclusive Web Lock; browsers without Web Locks fail closed for writes. Native
views share an in-process lock. No bank payload or bearer token is logged.

An uncertain outcome, including a timeout followed by an auth failure, retains
the exact command across navigation and restart. Explicit retry reuses its ID
and contents. A new edit is blocked until exact success or a definite bank-version
conflict is confirmed and the local record is removed. Failed cleanup is retried
without sending a new command. There is no background replay or discard button.
Clearing app/browser storage or reinstalling while a command is unresolved loses
that recovery record; this is not an offline synchronization system.

Unit tests cover durable replay, failed writes/readback/removal, scope changes,
concurrent views, transport identity/headers, validation and conflict handling.
Native storage limits, cold-start recovery, web multi-tab interaction, keyboard
and large-text layout still require interactive verification before release.
The dependency API has not been deployed by this mobile change.

## Licence

Not decided yet. Until a licence is added, no rights are granted beyond
viewing the code.
