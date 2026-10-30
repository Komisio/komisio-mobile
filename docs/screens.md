# Screen list for version 1

The owner reviewed the earlier Komisio app screen by screen on 2026-10-28 and
decided per screen what to keep, change, remove or postpone. This file is the
result and the basis for building version 1. Screen IDs (S01, S02, …) are the
ones used in that review, so each screen here can be traced back to the
earlier app. Reference screenshots of the earlier app, taken with test data
only, are kept with the project files and are not stored in this repository.

Version 1 is an app for **sellers**. Staff screens, handing in items from the
app and self-service sign-up come later.

## Prerequisites outside this app

- **Store setting "Visa butik i mobilappen".** A new store setting in
  `Komisio/komisio` decides which stores appear in the store picker (S01). It
  replaces the earlier app's hidden code for test stores. The store picker
  cannot be built until it exists.
- **Seller accounts are created by the store.** There is no sign-up in the app
  in version 1 (S03 and S04 are postponed). A seller gets an account from the
  store and logs in with it.
- **Activation and email links finish on the web.** A store-created account
  is activated by the platform's existing journey: the seller opens the
  activation link from the email in a browser, the platform confirms the
  address and the seller chooses a password (`/auth/activate`,
  `/seller/activate`). The same applies to the password reset link (S07). The
  app does not handle these links in version 1; after the web step the seller
  returns to the app and logs in (S02). Opening email links directly in the
  app is a later change.
- **Store catalogue read model.** S10 and S11 need a store-wide read of items
  for sale. The platform's existing seller reads (`my_items`,
  `my_items_page`) only return the signed-in seller's own items, and the
  roadmap places the per-store catalogue later (section 3.11). A new read
  contract in `Komisio/komisio` is required before S10 and S11 can be built.
  Proposed contract, to be settled in that platform change: signed-in sellers
  of the store may read it; it returns only items currently for sale in that
  store; it exposes title, current price with currency, photos and the item's
  descriptive facts (such as category, size, brand and colour); it never
  exposes the seller's identity, commission, payout or cost data. The
  "Visa butik i mobilappen" setting does not provide this.
- **Payouts go to a bank account.** Swish is not offered (S23).

## Version 1 screens

| ID | Screen | Earlier route | Notes from the review |
| --- | --- | --- | --- |
| S01 | Choose store | `/tenant` | Keep, including the language choice. Drop the code for test stores; use the store setting above instead. Layout may be refreshed, as for the whole app. |
| S02 | Log in | `/auth` | Keep. Email and password with Supabase Auth. Remove the technical "Token endpoint" row. If the account has two-factor authentication (TOTP) enrolled, login continues to a code step before the app opens, as on the web (`/mfa`). An account that is not yet activated is sent to the web activation above. |
| S05 | Forgot password | `/forgot-password` | Keep. |
| S06 | Email sent | `/mail-sent` | Keep. |
| S07 | Reset password | `/reset-password` | Keep, completed on the web in version 1 (see prerequisites). |
| S08 | Seller agreement | `/agreement` | Keep. Use the platform's versioned seller agreements and their language versions. |
| S10 | Store: all items | `/browse` | Keep. Compact rows with photo or branded placeholder, up to three public facts and a full-row detail action (owner decision 2026-10-30). |
| S11 | Item detail | `/browse/[id]` | Keep. Requires the store catalogue read model above. |
| S12 | Store info and directions | `/submitinfoscreen` | Keep as store information with map and the store's own texts. The links to handing in items (S13, S14) are postponed with those screens. |
| S19 + S52 | My items | `/my-items`, `/portal/items` | Keep. One screen that combines the app list with the portal's filters (active, expiring soon, sold) and return dates. Statuses follow the new platform's item statuses. |
| S20 | My item: detail | `/my-items/[id]` | Keep. |
| S22 + S51 | Overview | `/settings/sales-overview`, `/portal` | Keep. Owner update 2026-10-30: items ending soon, compact active/sold totals and five latest non-returned sales by sale date. Label sale prices explicitly. Balance and payout history live under Money. |
| S23 + S24 + S53 | Payouts | `/settings/payout`, `/settings/payout/history`, `/portal/payouts` | Keep. Request a payout and see payout history in one place. No Swish. |
| S25 | Payout account | `/settings/payout/account` | Keep. Same fields as the seller portal in Komisio. |
| S21 | Profile | `/settings` | Keep. A dark theme is optional and only if it fits the visual identity. Translate all labels. |

Navigation and tab layout are settled in the first layout pull request.

Owner decision, 2026-10-30: remove S54 (Statements/Avräkningar) from the mobile
app, including its list, detail and navigation entries. Payout requests and
history under Money remain the mobile financial view. Platform documents and
their storage are unaffected.

Visual direction (owner request, 2026-10-29): start from the platform identity
and earlier-app screenshots, working in the actual screens. Product photos are
optional: omit the image area entirely when a catalogue item has no photo, both
in the list and detail. An existing photo that fails to load remains an error
state, not a missing-photo state. My items currently has no photo read contract.

Owner design direction, 2026-10-30: compact native layouts, forest #143E34,
lime #DCF0A4, paper #F7F8F5 and the existing Komisio mark. Prioritize balances,
item status and necessary actions; use sheets for filters and supporting detail.
Keep economic rules and published agreement text unchanged.

## Later

| ID | Screen | Earlier route |
| --- | --- | --- |
| S03 | Create seller account | `/create-account` |
| S04 | Register private person | `/create-user` |
| S13 | Sell item: simple upload | `/upload` |
| S14 | AI hand-in: take photos | `/smart-intake/capture` |
| S15 | AI hand-in: review suggestion | `/smart-intake/review` |
| S16 | AI hand-in: submit | `/smart-intake/submit` |
| S17 | Hand in a bag or box | `/uploadboxscreen` |
| S18 | How to register an item | `/settings/upload-info` |
| S30 | Choose seller (staff) | `/seller` |
| S31 | Seller's items (staff) | `/register-items` |
| S32 | Manage item (staff) | `/register-items/[id]` |
| S33 | Review items (staff) | `/review-items` |
| S34 | Review item (staff) | `/review-items/[id]` |
| S35 | Profile (staff) | `/settings` |
| S36 | Transaction overview (staff) | `/settings/transactions` |
| S37 | Scanner (staff) | `/scanner` |
| S38 | Choose category | `/select-category` |
| S39 | Choose product | `/select-product` |
| S50 | Portal: log in | `/portal/login` |

S50 is not needed in the app, because S02 already covers logging in.
