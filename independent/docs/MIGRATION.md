# Migration status — 2 November 2026

Implemented in `independent/`, preserving the original working theme and local server on port 9292. No commits, pushes, destructive resets, production deployment or domain purchases were made. The independent development app runs on port 3000, Medusa on 9000 and isolated PostgreSQL on 5433.

## Preserved experience

The original Liquid sections were inspected and rendered once into local design fragments; Liquid is not needed to run or build this app. All eight cinematic chapters, DIFFERENT → STRYDE introduction, BEYOND ORDINARY hero, wave environment, orbital Three Moods, Form Edit, Featured, Brand, Finale, journey navigation and signature footer remain. Styles, Archivo fonts, color variables, photographic assets, original GLBs, environment and camera data are copied without artistic changes.

`design/motion` reuses the existing controllers. The entry module replaces Shopify commerce mounts with the independent React commerce UI and drops Shopify section events. The intro controller accounts for React's wrapper elements when making background content inert. Page exit disposes the shared scheduler. All other copied motion modules retain their original implementation. Full document navigation and the original pagehide/pageshow cleanup remain intentional; future SPA navigation must implement equivalent explicit mount/unmount ownership before it is enabled.

The account icon is omitted while guest checkout is the supported path. The development notice names independent test mode. Policy links and honest launch-preparation pages are added. Collection and product commerce content now comes from Medusa, so the original unverified branded reference-photo catalog is not offered as stock. The original masthead, card/gallery/lightbox visual classes and product layout are reused; commerce controls are React forms backed by the new API.

## Platform replacement

| Original dependency | Independent replacement |
| --- | --- |
| Liquid page/runtime rendering | Next server components plus trusted local cinematic HTML fragments |
| Shopify CDN/platform asset URLs | Owned local assets served by Next |
| Theme section load/unload events | Per-document initialization and existing cleanup/BFCache lifecycle |
| Shopify product/variant/collection objects | Medusa Store API + PostgreSQL records |
| Shopify Ajax cart/Section Rendering API/mock global bag | Same-origin typed Next API, per-customer signed HttpOnly cart cookie, Medusa persisted cart |
| Shopify product form, search and pagination | Backend search, filtering, sorting, server pagination and independent variant/bag forms |
| Shopify Checkout | Development-only Medusa test order flow, with live bank adapter deliberately unconfigured |
| Shopify hosting/config | Standalone Next/Medusa builds, environment configuration and prepared independent deployment stack |

The new app's package manifests have no Shopify dependencies. Production and development builds do not import the original project. The optional one-time `scripts/port-reference.mjs` is the only legacy extraction bridge and is never run by `dev`, `build`, `start` or the containers.

## Commerce behavior

Working against the local PostgreSQL-backed Medusa instance: catalog and individual product pages, product photography/gallery/zoom, size/variant deep links, backend prices and stock, sold-out presentation, collections/categories, search, sorting/filtering, pagination, individual persistent bags, quantities/removal, address validation, backend shipping quotes, shipping selection, recalculated totals and development order creation/confirmation. Medusa Admin supplies protected catalog/inventory/order management; an owner admin account still needs to be created. Guest checkout avoids unnecessary customer authentication.

The explicitly enabled development seed contains 14 generic fixture products and concept imagery. Prices/stock are fixture database records, not invented commercial claims. Production hides them even if the environment's test flag is accidentally left true. Unapproved commercial merchandise is hidden behind explicit metadata approvals. Next and Medusa block live order/payment completion. There are no card inputs, external payment calls, simulated live bank responses or real email delivery.

## Validation actually performed

| Check | Result |
| --- | --- |
| Original project tests | 160 passed; original tracked files unchanged |
| New frontend safety tests | 6 passed |
| Backend checkout/payment gates | 4 passed, including production refusing test provider/completion |
| Next production build | Passed, including TypeScript |
| Medusa backend and Admin production build | Passed |
| PostgreSQL migrations, including advisory locking | Applied successfully |
| Native standalone production runtime | Served successfully; backend health 200; fixtures hidden; checkout POST 403; no cookie secret in HTML |
| Browser homepage parity, 1440×1000 | Both versions: 29 ScrollTriggers, same start/end coordinates within 1 pixel, one canvas |
| Fast forward/reverse scroll | Trigger count stayed 29 and canvas count stayed 1; no page exceptions |
| Full intro and return navigation | Natural intro completed; background inert state restored; back navigation retained 29 triggers/one canvas |
| Mobile, 390×844 | Intro skip, menu/collection and product navigation worked; no horizontal overflow on hero/catalog/product |
| Browser catalog | 12 items on page 1, 2 on page 2; query search found one matching test product |
| Product/bag | Gallery/lightbox/Escape, available sizes, sold-out size, add/drawer, quantity updates and persisted bag passed |
| Customer isolation | Separate browser context had an empty bag |
| Server validation | Excess-stock and sold-out adds rejected; client price injection rejected (400); foreign Origin rejected (403) |
| Administrative authorization | Unauthenticated Medusa orders request rejected (401) |
| Test checkout | Browser saved fictional address, selected backend quote and created a persisted Medusa test order; explicit no-payment/no-shipment/no-email confirmation |
| Dependency audit | Frontend: zero advisories. Backend: zero high/moderate/critical; six low entries caused by deepmerge via Medusa's bundled, unconfigured SendGrid integration |

Audit fixes pin patched lodash, GraphQL utilities, glob, minimatch and UUID versions through explicit overrides. Backend builds and browser commerce were rechecked afterwards. Do not use npm's proposed major downgrade to Medusa 1 to clear the remaining SendGrid/deepmerge advisory; resolve it through an upstream-compatible fix before launch. See [the upstream advisory](https://github.com/advisories/GHSA-gcqx-w48m-w2h4).

Browser screenshots and machine-readable evidence are in `../evidence/`: `original-hero.png` / `independent-hero-final.png`, `original-materials.png` / `independent-materials.png`, chapter captures, `independent-catalog.png`, mobile captures, test checkout/confirmation, `browser-parity.json`, `additional-browser-checks.json`, `production-checks.json`, `source-parity.json` and audit/build logs. Screenshots are local artifacts, not a deployed preview.

This verification used headless Chromium with software WebGL. It establishes visible rendering and lifecycle parity, not a hardware GPU performance guarantee. Physical mobile devices, Safari/Firefox, measured Core Web Vitals, sustained hardware frame time, context-loss recovery, approved bank flows, email deliverability, actual shipping/tax/customs configurations, container/proxy deployment and backup restoration still need staging/device validation. Existing GLB quality and sizes are preserved; no lossy model/texture rewrite was attempted.

## Before commercial launch

Owner decisions/credentials are required for legal business/contact identity, actual merchandise/SKUs/prices/stock and rights, selected sales countries/currency/taxes, carrier agreements, merchant-approved bank gateway, transactional email, final policies, domain and hosting. Finish [payment/provider approval](PAYMENTS.md), resolve the remaining audit advisory and follow [deployment preparation](DEPLOYMENT.md). Nothing in this implementation authorizes publication or makes the commercial launch complete.
