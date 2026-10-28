# Earlier app: reference screenshots

Screenshots of the earlier Komisio app (`Komisio.App`), taken on 2026-10-28
for the screen-by-screen review behind [`../screens.md`](../screens.md). The
app ran against a local mock API, so every name, address, store, item, amount
and image is synthetic test data. The store names are invented and the street
address is a placeholder; neither describes a real store.

File prefixes: `x_` start and sign-in, `s_` seller app, `a_` staff app, `p_`
web seller portal.

## Version 1 screens

| ID | Screenshot | Earlier route |
| --- | --- | --- |
| S01 | [x_tenant.jpg](x_tenant.jpg) | `/tenant` |
| S02 | [x_login.jpg](x_login.jpg) | `/auth` |
| S05 | [x_forgot.jpg](x_forgot.jpg) | `/forgot-password` |
| S06 | [x_mail_sent.jpg](x_mail_sent.jpg) | `/mail-sent` |
| S08 | [s_agreement.jpg](s_agreement.jpg) | `/agreement` |
| S10 | [s_browse.jpg](s_browse.jpg) | `/browse` |
| S11 | [s_browse_item.jpg](s_browse_item.jpg) | `/browse/[id]` |
| S12 | [s_sell_info.jpg](s_sell_info.jpg) | `/submitinfoscreen` |
| S19 | [s_my_items.jpg](s_my_items.jpg) | `/my-items` |
| S20 | [s_my_item.jpg](s_my_item.jpg) | `/my-items/[id]` |
| S21 | [s_profile.jpg](s_profile.jpg) | `/settings` |
| S22 | [s_sales_overview.jpg](s_sales_overview.jpg) | `/settings/sales-overview` |
| S23 | [s_payout.jpg](s_payout.jpg) | `/settings/payout` |
| S24 | [s_payout_history.jpg](s_payout_history.jpg) | `/settings/payout/history` |
| S25 | [s_payout_account.jpg](s_payout_account.jpg) | `/settings/payout/account` |
| S51 | [p_overview.jpg](p_overview.jpg) | `/portal` |
| S52 | [p_items.jpg](p_items.jpg) | `/portal/items` |
| S53 | [p_payouts.jpg](p_payouts.jpg) | `/portal/payouts` |
| S54 | [p_statement.jpg](p_statement.jpg) | `/portal/statement` |

S07 (reset password) has no screenshot: it opens from an email link.

## Later

| ID | Screenshot | Earlier route |
| --- | --- | --- |
| S03 | [x_create_account.jpg](x_create_account.jpg) | `/create-account` |
| S04 | [x_create_user.jpg](x_create_user.jpg) | `/create-user` |
| S13 | [s_upload.jpg](s_upload.jpg) | `/upload` |
| S14 | [s_smart_capture.jpg](s_smart_capture.jpg) | `/smart-intake/capture` |
| S15 | [s_smart_review.jpg](s_smart_review.jpg) | `/smart-intake/review` |
| S16 | [s_smart_submit.jpg](s_smart_submit.jpg) | `/smart-intake/submit` |
| S17 | [s_upload_box.jpg](s_upload_box.jpg) | `/uploadboxscreen` |
| S18 | [s_upload_info.jpg](s_upload_info.jpg) | `/settings/upload-info` |
| S30 | [a_seller_picker.jpg](a_seller_picker.jpg) | `/seller` |
| S31 | [a_register_list.jpg](a_register_list.jpg) | `/register-items` |
| S32 | [a_register_item.jpg](a_register_item.jpg) | `/register-items/[id]` |
| S33 | [a_review.jpg](a_review.jpg) | `/review-items` |
| S34 | [a_review_item.jpg](a_review_item.jpg) | `/review-items/[id]` |
| S35 | [a_profile.jpg](a_profile.jpg) | `/settings` |
| S36 | [a_transactions.jpg](a_transactions.jpg) | `/settings/transactions` |
| S37 | [a_scanner.jpg](a_scanner.jpg) | `/scanner` |
| S38 | [a_select_category.jpg](a_select_category.jpg) | `/select-category` |
| S39 | [a_select_product.jpg](a_select_product.jpg) | `/select-product` |
| S50 | [p_login.jpg](p_login.jpg) | `/portal/login` |

## Other captures

- [a_browse.jpg](a_browse.jpg): the store view (`/browse`) as staff.
- [a_register.jpg](a_register.jpg): `/register-items` opened without a chosen
  seller, which sends staff to the seller picker.
- [s_transactions.jpg](s_transactions.jpg): `/settings/transactions` as a
  seller, which the earlier app refuses (`not_authorized`).
