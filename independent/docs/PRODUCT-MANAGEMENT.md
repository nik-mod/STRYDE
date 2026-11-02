# Product management and StockX media

The product editor remains Medusa Admin. STRYDE adds one product-detail widget and protected API routes for identity, media provenance, ordered galleries and publication checks. It does not create a second dashboard or alter the cinematic homepage, GLBs, intro, waves or choreography.

## Owner setup

From `independent`, with PostgreSQL running:

```powershell
npm run backend:migrate
npm run admin:setup
```

The setup command prompts for your email and a hidden password (at least 16 characters), then confirmation. It passes credentials to a child process through its environment, not command-line arguments, source files or a saved configuration file. It refuses to overwrite an existing account/password. Create your owner account in your own terminal; no owner credentials are chosen or hardcoded by the implementation. The account receives STRYDE catalog-manager permission. Use native Medusa invitations/roles for additional staff; do not share the owner password. The media endpoints require an authenticated user with `metadata.stryde_catalog_manager=true`. The owner setup assigns it securely on creation.

Sign in at http://127.0.0.1:9000/app. Use native Products, Categories, Collections, Inventory, Orders and Customers screens. Product create/edit/delete, descriptions, options, sizes/colors, prices, currencies, sales channels and inventory remain native Medusa features.

## Product workflow

1. Create a **draft** product with accurate merchandise details, variants and prices. Configure the correct sales channel, shipping profile and inventory location. A photo does not establish authenticity or availability.
2. On the product detail page, find **STRYDE product & media review**. Save the exact brand, model/revision, manufacturer style code, colorway, StockX product identifier and HTTPS product reference. Identity changes return commercial products to draft and clear storefront approval.
3. The optional catalog lookup uses only the official `GET https://api.stockx.com/v2/catalog/search` endpoint. Without authorized credentials/use permission it returns a clear blocked state. Candidate matching is never fuzzy auto-approval. Confirm the exact style and colorway yourself before saving identity. Catalog responses are not an image feed.
4. Obtain a photograph through a method explicitly permitted by StockX/the relevant rights holder. Upload the actual authorized file; the server does not download supplied URLs, scrape pages, use third-party proxy APIs or bypass anti-bot restrictions.
5. Enter a source reference, private written-license reference and any public attribution. Confirm exact product matching, commercial display and permanent storage permission, preserved markings and neutral studio presentation. Only allow resizing/format conversion if the grant permits it. API access, photo rights and merchandise identity are independent checks.
6. Upload still JPEG/PNG/WebP files, maximum 12 MiB and 40 megapixels, at least 1000 pixels on the long side and 500 on the short side. File decoding validates the real format and dimensions. SVG, animated files, invalid/truncated images and duplicate bytes are rejected. This validates technical quality; color accuracy, background, rights and exact-shoe matching still require the owner's review.
7. Preview the uploaded images, select the gallery and use **Move earlier/later** to order it. The first selected image becomes the product thumbnail. Save as draft while anything remains unresolved. Remove incorrect media using **Remove**; provenance is retained privately and the product returns to draft.
8. Confirm the actual merchandise identity and sale permission separately. Select storefront visibility and **Publish reviewed product**. The server checks every selected image against the private records, exact identifiers, permission attestations and gallery order. The native Admin publish/update path applies the same check. **Archive product** keeps a hidden draft; saving/publishing through review restores it. Native CSV/batch imports are currently blocked to avoid bypassing this review; bulk migration needs a separately reviewed workflow.

The system records source, StockX product ID/reference, matching style/model/colorway, import time, dimensions, SHA-256, original URL, derivatives, uploader, license reference, attribution and review status. Private licensing references live in the `catalog_media` module/table, not product metadata exposed to shoppers. Public review labels distinguish **owner-attested** rights and **owner-confirmed** matching; no API verification or legal certification is fabricated. Publication never enables live checkout.

## StockX access still required

Research checked 2 November 2026:

- [Official API introduction](https://developer.stockx.com/portal/api-introduction): access requires approved developer credentials.
- [Official catalog API reference](https://developer.stockx.com/portal/api-reference): product search, product details and variants expose identifiers and attributes. The reviewed product response does not document a general authorized photograph feed.
- [Standard API license](https://developer.stockx.com/portal/license-agreement): restricts the standard license to internal use and restricts commercial use; it does not establish permission to reuse photos for STRYDE retail listings. Required proprietary markings must remain intact.

Request written authorization specifically covering your independent commercial storefront, permitted products/territories, exact media delivery mechanism, local permanent storage/rehosting, public display, permitted resizing/format changes, attribution, license duration and revocation handling. Ask whether it also permits using catalog data in this workflow. Do not assume an API key or a StockX listing grants these rights.

Only after approval, configure server-side `STOCKX_API_KEY`, `STOCKX_ACCESS_TOKEN` and `STOCKX_CATALOG_USE_AUTHORIZATION` (your grant/reference). No secrets go to the browser. This implementation supports a supplied valid token; automatic OAuth token refresh and an image-feed adapter remain blocked until the actual authorized access agreement and supported delivery endpoint are supplied. Catalog lookup is administrative only, never a storefront-page dependency. If lookup rejects an expired token, the error is explicit; there is no scraping fallback.

No real StockX image was downloaded, imported or claimed as authorized during implementation. A successful commercial StockX publication cannot be demonstrated without a real grant and correct merchandise data. Manual uploads are functional infrastructure; permission cannot be manufactured by software or a checkbox.

## Storage and storefront delivery

Uploads use Medusa's owned local file storage under `backend/static`, backed by the prepared persistent upload volume. Set `MEDIA_PUBLIC_URL=https://YOUR_DOMAIN/media` on the backend in production; the local default is `http://localhost:3000/media`. The Next `/media/[filename]` route fetches only the configured private backend's `/static/` path, validates filename, response type and size, and exposes no admin routes. API credentials are not used in media URLs. Back up the upload volume alongside the database. An owned object-storage provider can replace local storage later without changing the product-management workflow.

Original bytes are preserved. Optional WebP derivatives resize the full frame without cropping, stretching, recoloring, background replacement or watermark removal. Responsive derivatives are reused by catalog/search cards, related products and gallery thumbnails. Product main images and zoom use the approved gallery; bag thumbnails follow the product primary image. Required public credits are displayed alongside catalog/product/related/cart media. Cinematic scenes remain separate from catalog merchandise.

## Existing catalog audit

[Product-by-product JSON](catalog-audit/products.json) and [CSV mapping](catalog-audit/products.csv) cover the original 14 development products. Their repeated images are development concept artwork; real brand/model/style/colorway and licensing information are missing. No verified StockX replacement exists for these generic identities. Keep fixtures out of production; create separate accurate commercial drafts. No image was replaced with an unrelated shoe, and fixtures were not converted to merchandise.

Refresh the audit by running `npm exec -- medusa exec ./src/scripts/audit-product-media.ts` from the `independent/backend` directory. The audit does not fetch remote media or modify products.

## Verification

`node scripts/verify-product-management.mjs` creates a temporary, randomly credentialed QA administrator and a labeled development product. It checks native product/price/inventory APIs, technical image upload, ordering, removal, unauthorized access, publication rejection and pending StockX access. Technical image charts are not sneaker photographs or StockX media. It then exposes only that fixture through a trusted development seed path for browser checks. Run `node scripts/verify-product-management.mjs --cleanup` afterwards; only marked QA accounts/product/media are removed. The ignored `.data/product-management-qa.json` contains temporary QA credentials and must be removed after the run. Never copy the QA/development database into production.
