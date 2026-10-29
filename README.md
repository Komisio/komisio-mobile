# Komisio Mobile

Mobile app for [Komisio](https://github.com/Komisio/komisio), the consignment
platform for second-hand stores. Built with Expo and React Native.

> Status: store picker, login with two-step verification, profile, and the
> store catalogue with item detail (S10/S11), own items (S19/S20), and store information (S12).
> The seller overview (S22) shows server balances, item counts and recent payouts.
> Profile links to agreements (S08) and bank details (S25). Money shows payout
> requests/history (S23/S24/S53) and issued statements (S54). New writes require
> the platform's opt-in mobile API; these slices await review and interactive
> verification (see `docs/screens.md`).

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

## Catalogue image compatibility

The photo parser also accepts exact JPEG descriptors from `seller-reception-photos`
for metadata-free inherited images (platform issue Komisio/komisio#725).
Images still use the configured authenticated Storage endpoint with the current
session token; arbitrary buckets, foreign tenant paths and derivative PNG paths
are rejected. Switching a bucket remounts image recovery even if the path is unchanged.

Distribute this compatible app before the platform starts returning derivative
descriptors: older strict clients reject that new bucket. Legacy descriptors remain
parseable during rollout, but the server remains responsible for withholding
original files. This client change grants no Storage permission or hosted release.
Independent review, actual device/browser image rendering and the coordinated
platform rollout remain required.
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

An unaccepted current agreement can be explicitly confirmed with a checkbox
and acceptance button. The exact displayed version and published translation
are captured before dispatch through the opt-in mobile API (platform PR720).
Changing the displayed language resets confirmation. Previously accepted or
historical documents offer no acceptance action. Without a configured API the
reader directs the seller to the portal.

Acceptance uses a separate durable journal bound to user, store, seller,
Supabase project and API endpoint. It stores the exact command plus the document
title, version and language; it never sends on restoration. An uncertain response
requires an explicit retry of that same acceptance, even after logout or a
language change. A changed current version requires reloading and reviewing it.
The engine may return earlier equivalent acceptance evidence with a different
ID; the app does not mistake this for a failed request. Local-storage and
reinstallation limitations are the same as S25 below.

There is no new agreement rule, signature, PDF or database migration. The old
S08 reference contains only a loading spinner; the reader follows the platform
contract and existing app theme. Unit tests cover exact text selection,
historical/accepted guards and durable recovery. A synthetic local Auth/API/RPC
smoke verified loss after commit, exact and equivalent-evidence replay,
translated evidence, replay after newer publication and stale-version conflict.
It used in-memory storage and Node transport, not a browser/native runtime.
Interactive large-text/history navigation, native storage and independent
review remain pending.

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
views share an in-process lock. Web bank journals remain unencrypted while pending, but logout (including another tab) and identity changes erase bank payloads; stale writers cannot recreate them after logout. Payout/agreement replay IDs are retained. After logout, sellers must check the current bank account before making another change. Native SecureStore recovery is unchanged. No bank payload or bearer token is logged.

An uncertain outcome, including a timeout followed by an auth failure, retains
the exact command across navigation and restart. Explicit retry reuses its ID
and contents. A new edit is blocked until exact success or a definite bank-version
conflict is confirmed and the local record is removed. Failed cleanup is retried
without sending a new command. Explicit first-attempt API refusals release the journal; a refusal on a retry cannot disprove an earlier committed write. An unresolved request can be deliberately released after a second confirmation that the seller has checked the current details/history or contacted the store. This deletes only local recovery, cancels nothing server-side and warns that a new request can duplicate an earlier one. There is no background replay.
Clearing app/browser storage or reinstalling while a command is unresolved loses
that recovery record; this is not an offline synchronization system.

Unit tests cover durable replay, failed writes/readback/removal, scope changes,
concurrent views, transport identity/headers, validation and conflict handling.
Native storage limits, cold-start recovery, web multi-tab interaction, keyboard
and large-text layout still require interactive verification before release.
The dependency API has not been deployed by this mobile change.

## Payout request and history (S23/S24/S53)

The Money tab has request/history views based on the earlier app's payout screens.
Available, reserved and paid amounts and the minimum threshold are server facts;
the app preserves negative balances and does not sum a history page. Amount input
accepts up to two decimal digits and converts them to integer minor units without
rounding. The full-balance shortcut uses the same bounded request contract.

History requires [platform PR #722](https://github.com/Komisio/komisio/pull/722):
`my_seller_payouts_page` returns 25 rows, a complete total, store currency and
balance/threshold facts under the exact seller guard. Request dates are explicitly
labelled; a requested/approved payout is not presented as already paid. Page reads
are live snapshots, not a frozen export. Refresh, navigation and account changes
discard stale reads. The bank-account shortcut opens S25; no Swish is offered.

Writes use the same opt-in API as S25, with a separate durable payout journal.
Only the command fields enter the API; its local journal also keeps display currency
so an uncertain amount remains understandable if a subsequent read fails. A lost
response retries the same request ID and amount. Confirmed success, post-replay
threshold/balance conflicts and explicit first-attempt API refusals release the
journal. A refusal after an uncertain earlier attempt retains it. Sellers can
release an unresolved request with the explicit confirmation described above;
this cancels nothing server-side and requires checking history before a new request. Creating a
request does not transfer money or reserve the balance until the store approves it.

An integration smoke test connected the actual mobile command controller and
transport to the in-process API and real local Supabase Auth/RPC. It lost a response
after commit, recreated the controller, replayed the request and verified one
request/event, unchanged balance/reservation and a real balance-conflict response.
This used synthetic local fixtures, Node transport and in-memory storage. Native
network/storage recovery, browser interactions and independent Opus review remain
required before release; JavaScript export does not verify those behaviors.

## Issued statements (S54)

Money and Profile link to the issued-statement archive. The list uses
`my_seller_statements_page` from [platform PR #722](https://github.com/Komisio/komisio/pull/722)
with 25-row pages and a complete total. Detail reads the exact selected document
through `my_seller_statement`; a scoped list read supplies the store currency.
There is no date-range report, issuance, editing or PDF export in this slice.
The earlier statement screenshot informs the totals layout only; its arbitrary
date-range controls are outside the approved v1 scope.

Header totals, signed ledger lines, correction links and frozen contact details
are displayed without recomputation or substitution from current profiles.
Business invoices retain their recorded supplier/buyer identities, document
language marker, currency and stored net/VAT/gross line facts. Invoice totals group
the recorded integer amounts by stored VAT rate as in the portal; VAT is never
recalculated from a rate or current policy. App labels follow
the platform's Swedish/English terminology; stored text remains verbatim. The
interactive view does not claim to reproduce the portal's downloadable legal PDF.

Ledger and invoice lines are separately paged at 25 rows in the client over the
immutable exact read. Documents over 5,000 rows in either section fail explicitly
and direct the seller to the portal; the app never silently truncates a statement.
The RPC still downloads the complete document before this validation. Financial
documents are not persisted in an offline cache. Blur/account changes discard
late reads, and missing, denied, oversized and connection failures remain distinct.

An actual local RPC/parser smoke verified a signed private correction and a
business invoice correction after the current seller name/language changed:
original identity/language and exact negative net/VAT/gross facts were preserved.
Synthetic engine fixtures were fully rolled back. Unit tests also cover date
boundaries across Stockholm daylight-saving changes, exact identity, correction
semantics, line order and resource bounds. Interactive large-text/line navigation,
native rendering and independent Opus review remain required before release.

## Store information (S12)

Open **Store information** from the Store tab for published descriptions,
address, contact details and opening hours. This uses the existing public
`public_store_profile(p_slug)` RPC; no new database migration is needed.
Store changes discard the previous response, and focus/retry reads can be cancelled.
Unpublished information and missing opening hours are shown explicitly; a missing
weekday does not mean closed. Store-authored text remains in its published language.

The map button opens the published address in an external map; it does not
request device location. Contact actions allow only HTTPS websites, plain email
addresses and phone numbers, and show an error if the destination cannot open.
The S12 reference is in [reference PR #4](https://github.com/Komisio/komisio-mobile/pull/4).
Hand-in actions remain postponed. Browser navigation, large text and native
map/phone/email hand-offs still need interactive verification before release.

## Visual foundation

The seller screens share the platform's forest/paper palette and Komisio mark.
`src/components/theme.ts` owns color and text/surface/layout styles; `ui.tsx`
owns headings, fields, buttons, filter chips, item rows and text-labelled status
badges. System fonts respect device text scaling; there is no downloaded font.
The five labelled tabs use one local SVG icon family.

Catalogue photos are optional. A row without a photo uses its full text width,
and a detail without photos has no gallery. Mixed catalogues keep one stable
list layout during search and paging. Existing images retain loading/error
handling and detail retry. My items has no image read contract. Search and
filters scroll with the list so enlarged text does not crowd out the results.

This first design pass covers Store, catalogue detail, My items and Overview.
It preserves all existing reads and financial meanings. Browser component checks
with synthetic read/session/image adapters do not establish native image loading,
safe-area behavior, navigation or screen-reader support; verify those on devices
before release. Visual direction remains subject to the owner's screen review.

## Licence

Not decided yet. Until a licence is added, no rights are granted beyond
viewing the code.
