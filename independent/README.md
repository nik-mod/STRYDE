# STRYDE independent development platform

The source archive contains **11,928 footwear entries**, including 26 curated references. The visible local collection now accepts **sneakers/trainers only**, with a matching native source photo at least 800 pixels wide. Boots, heels, sandals, slides, accessories and uncertain model families are excluded. Small archive thumbnails are retained privately as references and are not displayed as product photography. See the current verified-photo count in `evidence/sneaker-photo-upgrade.json` and [archive provenance and reproduction](docs/STOCKX-ARCHIVE.md).

Search and filters use server pagination, sending 12 results rather than the full source catalog. Larger originals are downloaded from public StockX image URLs and checked against their archive references. Image URLs include a content hash so cached thumbnails cannot replace new originals. Script and stylesheet URLs are also versioned by content; the catalog footer and stale-script pagination error have been corrected.

This historical archive is not StockX's entire current catalog. Development merchandise fixtures are excluded from normal collection/search browsing; use `?fixtures=1` explicitly for commerce QA. Editorial references have no invented stock or prices, do not accept purchases, and are not enabled by this fallback in production. Approved commercial Medusa products take precedence when available. Commercial image-use authorization is not established by downloading a public archive.

Product management now includes a native Medusa product-review widget, private media provenance registry, secure interactive administrator setup and publication safeguards. See [Product management & StockX permissions](docs/PRODUCT-MANAGEMENT.md). Create the owner account with `npm run admin:setup`; no credentials are hardcoded. StockX photography is pending explicit commercial authorization and exact merchandise identities; no StockX photos have been imported into the commercial Medusa catalog.

The original Shopify project and port 9292 are untouched. This directory is a separate Next.js / React / TypeScript storefront, self-hosted Medusa 2.22.2 backend and PostgreSQL database. It has no Shopify API, Checkout, hosted cart, CLI or Liquid runtime dependency.

The cinematic page is the existing rendered design, preserved as trusted local HTML fragments. The original GSAP 3.15, Lenis 1.3.27 and Three.js 0.186.1 controllers, CSS, Archivo fonts, HDR, posters and GLBs are copied into `design/`. Next serves this document with React commerce components. Plain anchor navigation preserves the original cross-document animation and cleanup lifecycle. There is no React reimplementation of the animations and no client router owning the same DOM. The only motion adaptations remove Shopify section listeners/commerce hooks, account for the intro's React wrappers, and dispose the shared scheduler on page exit.

## Run locally

Node 22.18+ (Node 24 used). From this directory, one-time setup:

```powershell
npm ci
npm ci --prefix storefront
npm ci --prefix backend --legacy-peer-deps
node scripts/init-local.mjs
```

For this initialized workspace, start the complete local stack with one command:

```powershell
npm run dev
```

The runner checks PostgreSQL, Medusa and the storefront in order. It reuses healthy services and starts missing ones, waiting for readiness before continuing. PostgreSQL stays bound to 127.0.0.1:5433 and preserves its data under `.data/postgres`. No migration, seed, reset or administrator creation runs automatically. Keep the terminal open; Ctrl+C stops only services this runner created.

```powershell
npm run dev:check
```

This checks readiness without starting or changing services. For a brand-new database only, run `npm run db:dev` in one terminal, then `npm run backend:migrate` and `npm run backend:seed:test` once in another before using the combined runner. Existing databases do not need to be reseeded. Individual `db:dev`, `backend:dev` and `dev:storefront` commands remain available for targeted work or a separately configured backend. The storefront returns a real unavailable response if commerce cannot be reached; it does not invent successful operations.

Open [the independent storefront](http://127.0.0.1:3000). The [original reference](http://localhost:9292) stays available. The [Medusa admin](http://127.0.0.1:9000/app) requires your own administrator. Create it using `npm run admin:setup`; the interactive command hides password input and avoids putting credentials in source or command-line arguments. Guest checkout is implemented; customer accounts are deferred until there is a reason to collect/store account credentials.

The seed creates 14 labeled, generic test products with concept imagery, USD test prices, sizes 40/41/42 and test stock. Size 42 has zero stock. These are actual Medusa database records, separate from the unverified branded photographic references in the original project. The seed writes its publishable API key and region into the ignored storefront environment file. It refuses production. Re-running it preserves existing products and orders; it does not reset stock.

Use fictional details in test checkout. Test address → backend shipping quote → shipping selection → Medusa test provider → actual development order. Confirmation explicitly says no real payment, shipment or email. Order management belongs to Medusa Admin. No card field is collected and no live bank adapter is configured.

## Validation

```powershell
npm test
npm test --prefix backend
npm run build
npm run build --prefix backend
node scripts/audit.mjs
```

Builds work without Shopify or the original directory. `design/markup` is copied to `storefront/design` by the asset build. Only the optional one-time `scripts/port-reference.mjs` uses the legacy renderer; it must run from the original repository root and is never a production build step. Do not rerun that utility over deliberate changes to the independent design snapshot.

See [migration evidence and remaining work](docs/MIGRATION.md), [payment research](docs/PAYMENTS.md) and [deployment preparation](docs/DEPLOYMENT.md). This is a working development migration, not an approved commercial launch.
