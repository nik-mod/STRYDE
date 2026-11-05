# STRYDE store — quick guide

Your cinematic site and your real store both run locally. Nothing here is
deployed; when you have Supabase, only the database URL changes (see below).

## What runs where

| Address | What it is |
| --- | --- |
| http://localhost:3000 | **The store** — your full catalog (3,409 pairs), bag, checkout, payments |
| http://localhost:9292 | The original cinematic site (untouched reference) |
| http://127.0.0.1:9000/app | Medusa Admin — orders, products, inventory, prices |
| postgres://127.0.0.1:5433/stryde_development | The store database |

## Store admin

- Admin login: `owner@stryde.local`
- Password: `.data/admin-credentials.json` (never committed)

## Test payments

Checkout takes a card in test mode. No bank is contacted; nothing is stored.

- Success: `4242 4242 4242 4242` · any future expiry · any CVC
- Declined: any valid card ending `0002`
- Insufficient funds: ending `9995`

Shipping: Standard $9 · Express $19. Every pair is $140.00 (test pricing).

## Discount codes

- `WELCOME10` — 10% off, works in the bag and at checkout. Create more in
  Medusa Admin → Promotions; they work in the storefront immediately.

## Customer accounts

- Register/sign in from the header **Account** link. Signed-in customers get
  order history, an address book and a wishlist (synced to their profile;
  guests keep a wishlist in the browser).
- Carts created while signed in belong to the customer, so completed orders
  appear under Account → Orders automatically.
- Guests can track any order at **Track order** with the order number and the
  checkout email.

## Emails

No SMTP provider exists yet, so confirmation emails are written to
`.data/emails/order-<number>.eml` — same content a real provider would send.
Subscribers for the newsletter are recorded in `.data/newsletter.jsonl`.

## Store pages

Collection · product pages · size guide (`/pages/size-guide`) · FAQ
(`/pages/faq`) · contact · policies · track order · account (login, orders,
addresses, wishlist) — all reachable from the storefront navigation.

## Restart everything after a reboot

From `STRYDE/independent/`, in three terminals:

```bash
npm run db:dev          # 1. database (keeps running)
npm run backend:dev     # 2. Medusa API + Admin on :9000
npm run dev             # 3. storefront on :3000
```

The original site on 9292: from `STRYDE/`, `npm run dev` (only if it is not
already running).

If a service reports its port in use, it is already running — that is fine.

## How the catalog works

- The catalog comes from `storefront/src/data/stockx-editorial.json` — the same
  archive edit the storefront always showed. The seed (`npm run backend:seed:test`)
  turns each entry into a real product at $140 with sizes EU 40–43.
- Add, edit, price or photograph products in Medusa Admin → Products.
- Archive photos carry `archive_reference` provenance: sellable in this local
  test store only. Before any real launch, media needs owner confirmation in
  the registry (see docs/PAYMENTS.md) and a real bank adapter.

## Supabase (ACTIVE — the store now runs on the cloud database)

The store's Postgres is now the Supabase project **stryde**
(`vuyrngdcksbvmouqtkvy`, region ap-northeast-2/Seoul), connected through the
session pooler:

- `backend/.env` holds `DATABASE_URL=postgresql://postgres.vuyrngdcksbvmouqtkvy:…@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres`
  with `DATABASE_SSL=true` and `DATABASE_SSL_STRICT=false` (local VPN/proxy
  breaks Node's chain verification; TLS is still encrypted).
- The database password was reset on 2026-11-05 — find it wherever you saved
  it; `backend/.env.local-backup` keeps the previous LOCAL database URL for
  rollback. To go back local: swap `DATABASE_URL` from the backup file, set
  `DATABASE_SSL=false`, remove `DATABASE_SSL_STRICT`, restart the backend.
- The old `.env` local URL's database still exists under `.data/postgres`
  with everything from before the move.
- Because the database is remote, catalog reads are cached in the storefront
  for 5 minutes (`READ_CACHE_TTL` in `storefront/src/lib/medusa.ts`); bag,
  checkout and account actions are always live. First uncached page views take
  a few seconds; repeat views are instant.
- Verified in the cloud: migrations applied, 3,409 pairs seeded at $140, and
  a real test order (Order #1, $299.00) written to the Supabase `order` table.

The Supabase dashboard (supabase.com/dashboard) shows the same data under
Table Editor. Medusa Admin still manages the catalog at http://127.0.0.1:9000/app.

## Current state (verified end-to-end)

- Catalog grid, filters, search, pagination — all served from Medusa.
- Product pages at the original archive URLs (`/products/stockx-0001`, …) with
  gallery, sizes, wishlist and Add to bag.
- Persistent per-customer bag (drawer + full page), quantities, removal.
- Checkout: address → shipping quote → shipping selection → promo code → card
  payment → order, with inventory reservation and repeat-completion protection.
- Customer accounts: register, sign in, order history, addresses, wishlist.
- Guest order tracking by order number + email.
- Discount codes (WELCOME10 = 10% off) applied in bag and checkout.
- Confirmation emails written to `.data/emails` on every order.
- Newsletter sign-ups recorded to `.data/newsletter.jsonl`.
- Four verified orders in Medusa Admin, including a discounted one (#4, $261).
- Test suites: 11 storefront + 9 backend passing; production build passing.
