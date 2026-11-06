# STRYDE payment status — 6 November 2026

## Implemented, with real payments disabled

- TBC and Bank of Georgia Medusa adapters: server authentication, hosted card redirects, bank GET verification and raw-body BOG signature verification.
- Checkout delivery/review links to `/checkout/payment`. Provider selection, pending, declined, expired, confirmed, review, refunded and refund-pending screens reuse STRYDE's shopping design. Card entry belongs to the bank page.
- `/api/checkout/hosted` binds requests to the signed cart cookie, checks origin/body limits and validates products before starting payment. Browser input cannot supply a cart ID, amount, bank ID, success result or arbitrary return URL.
- The authenticated server bridge checks region/provider assignment and approved currencies. Browser return parameters never prove payment.
- Callbacks handle a closed browser; return-page status can recover a missed callback. Medusa owns cart locking, authorization, capture and order creation.
- `payment_operation` is migrated into Supabase Postgres. A unique key reserves attempts before external mutations. Concurrent requests, timeouts and crashes cannot silently repeat those mutations.
- Recorded sessions are reused. Status can recover a persisted Medusa session whose final ledger write was interrupted. Unknown outcomes without a recoverable session require manual investigation.
- Full refunds use a persistent per-bank-payment ledger. BOG carries a deterministic idempotency key; TBC requests are never automatically resubmitted. Acknowledgement is not completion: Medusa records the refund only after bank GET confirms the full refunded amount.
- Partial refunds are rejected pending bank-specific testing and multiple-refund reconciliation. Refunds use Medusa's authenticated admin flow; no public customer refund endpoint was added.
- Paid-but-incomplete carts show review guidance and do not invite another charge.

## Current configuration

Both banks remain disabled because merchant credentials have not been supplied. `STRYDE_BANK_SANDBOX_UI=false` preserves the UI preview bag and sample sizes/prices. Preview selections never become bank payments.

A private matching bridge secret is configured on both servers; it is excluded from source. Production checks still reject bank checkout. No flag here enables production charges.

Supabase ledger RLS is enabled; `anon` and `authenticated` have no SELECT access. No browser database access or Supabase Auth change was added.

## Sandbox setup later

1. Obtain bank-issued sandbox merchant credentials; never label live credentials as sandbox.
2. Configure `backend/payments.env.example`: client credentials, TBC API key, approved currencies and bank-registered HTTPS endpoints.
3. Set the return URL to `https://YOUR-STOREFRONT/checkout/payment`. Set the HTTPS backend origin and register `/hooks/stryde-payments/tbc` or `/hooks/stryde-payments/bog` as appropriate.
4. Assign `pp_tbc_tbc` or `pp_bog_bog` to the test Medusa region. Public direct bank session creation is blocked: STRYDE uses the authenticated bridge and persistent cart reservation.
5. Keep the bridge secret matched on both servers. Set storefront `STRYDE_BANK_SANDBOX_UI=true` only in explicit development test mode. This selects the backend cart delivery form instead of the separate UI preview.
6. Use a server-side Medusa test cart with test prices, sizes and shipping. Browser-local preview bags are deliberately not promoted into payment carts.
7. Test redirects, 3DS, failures, expiry, callback replays, interruptions, refunds and order recovery with bank-provided credentials/cards, including replay across restarts.

## Local verification

- Backend: 38 tests, including concurrent reservation, uncertain outcomes, full-refund reconciliation and request replay suppression.
- Storefront: 30 tests, including production gating and redirect validation; TypeScript checks for both applications.
- Actual Supabase migration and RLS/privilege verification.
- Actual local backend bridge: options/status 200; missing bridge authentication 403. One empty development cart was created for this integration check. No order, bank API call or real charge was created.
- Desktop 1440px and phone 390px: 22 captures covering disabled availability, eight mocked payment states and connection-failure recovery. No horizontal overflow. Interactive recovery restores focus and makes zero payment-start requests. Mocked renders are UI evidence, not bank certification. Screens: `.impeccable/review/payments/`.
- Independent finish review: all three recovery/copy/focus findings resolved; disposition `ship` within disabled development scope.

## Remaining launch blockers

Business/merchant registration; acquiring approval; settlement account; real bank credentials, international card permissions and supported currencies; actual bank sandbox certification and signed BOG callback fixtures.

Real product prices/sizes/stock and image/sale permissions; taxes, shipping coverage/rates, business policies and contact details; monitoring and operational handling for uncertain payments/failed fulfillment; partial refunds; production Redis/workers, backups, public HTTPS deployment, production activation and customer emails.

## Official contracts

[TBC creation/callback](https://developers.tbcbank.ge/docs/checkout-create-checkout-payment), [TBC details](https://developers.tbcbank.ge/docs/checkout-get-checkout-payment-details), [TBC refund restrictions](https://developers.tbcbank.ge/docs/checkout-cancel-checkout-payment), [BOG callbacks](https://api.bog.ge/docs/en/payments/standard-process/callback), [BOG refunds](https://api.bog.ge/docs/en/payments/refund).
