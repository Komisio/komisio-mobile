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
- **Payouts go to a bank account.** Swish is not offered (S23).

## Version 1 screens

| ID | Screen | Earlier route | Notes from the review |
| --- | --- | --- | --- |
| S01 | Choose store | `/tenant` | Keep, including the language choice. Drop the code for test stores; use the store setting above instead. Layout may be refreshed, as for the whole app. |
| S02 | Log in | `/auth` | Keep. The technology behind it changes (Supabase Auth). Remove the technical "Token endpoint" row. |
| S05 | Forgot password | `/forgot-password` | Keep. |
| S06 | Email sent | `/mail-sent` | Keep. |
| S07 | Reset password | `/reset-password` | Keep. |
| S08 | Seller agreement | `/agreement` | Keep. Use the platform's versioned seller agreements and their language versions. |
| S10 | Store: all items | `/browse` | Keep. |
| S11 | Item detail | `/browse/[id]` | Keep. |
| S12 | Store info and directions | `/submitinfoscreen` | Keep as store information with map and the store's own texts. The links to handing in items (S13, S14) are postponed with those screens. |
| S19 + S52 | My items | `/my-items`, `/portal/items` | Keep. One screen that combines the app list with the portal's filters (active, expiring soon, sold) and return dates. Statuses follow the new platform's item statuses. |
| S20 | My item: detail | `/my-items/[id]` | Keep. |
| S22 + S51 | Overview | `/settings/sales-overview`, `/portal` | Keep. One overview with balance, sold items, items expiring soon and recent payouts. |
| S23 + S24 + S53 | Payouts | `/settings/payout`, `/settings/payout/history`, `/portal/payouts` | Keep. Request a payout and see payout history in one place. No Swish. |
| S54 | Statement | `/portal/statement` | New in the app, taken from the web portal. Statement for a period: opening balance, net sales, payouts and closing balance. |
| S25 | Payout account | `/settings/payout/account` | Keep. Same fields as the seller portal in Komisio. |
| S21 | Profile | `/settings` | Keep. A dark theme is optional and only if it fits the visual identity. Translate all labels. |

Navigation and tab layout are settled in the first layout pull request.

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
