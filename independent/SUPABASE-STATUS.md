# Supabase database connection status

STRYDE's Medusa service now uses the existing Supabase PostgreSQL database for project vuyrngdcksbvmouqtkvy, via the session pooler. Medusa and Next.js still run locally; this change does not deploy either service.

Read-only inspection found PostgreSQL 17.11 and 185 Medusa migration records. Existing cloud records: 3,409 active products, 13,636 variants, 13,640 price rows, one customer and one order. Store, region, sales channels, stock location, shipping options and provider records exist. The authenticated Medusa Store API returned HTTP 200 with count 3,409 using the selected cloud publishable key and region.

No schema migration, seed, overwrite or local-to-cloud record merge was run. Original local PostgreSQL data remains in independent/.data/postgres. Original backend/frontend environment files are preserved in the timestamped .data/supabase-switch-* directory. The active backend/.env uses the private connection string, strict SSL verification and the supplied CA certificate copied to .data/supabase-ca.crt. No database password is stored in source control.

The dev runner now supports an explicitly enabled remote database and skips launching embedded PostgreSQL for remote hosts. Local database mode remains supported. Backend tests: 11 passed. Actual Medusa startup and Store API request passed with verified SSL.

Sensitive Medusa tables customer/order/user/provider_identity/api_key have RLS enabled and no policies granting browser access at inspection time. This is a limited check of those tables, not a full security audit.

Remaining: zero Medusa admin users, zero inventory_item/inventory_level records, and no provider_identity records were found. Admin login/account setup and real inventory still need configuration; the existing storefront sizes/prices/checkout remain explicitly illustrative in local test mode. Live payments, customer emails, production hosting and launch configuration are separate work. Uploaded media remains on the current file provider; Supabase Storage was not configured by this database switch.
