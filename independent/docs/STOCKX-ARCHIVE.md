# Local StockX photo archive

The source data contains 11,928 footwear entries across 69 filename-derived brand groups. It combines the existing 26 references with 11,902 additional photographs. It is not a complete or current export of StockX. The visible preview is now a smaller, quality-filtered sneakers/trainers selection; source entry counts are not visible product counts.

Source: [msaaksjarvi/stockx-image-dataset](https://github.com/msaaksjarvi/stockx-image-dataset). Its README describes around 12,000 sneaker images collected from StockX. The downloaded `stockx-imgs.zip` contains 11,957 files. Of these, 53 are exact-byte duplicates, leaving 11,904 unique originals. Names are transcribed from filenames. No style codes, prices, inventory, sizes or current availability are inferred. Some names can describe alternate listings of the same physical shoe; the count is catalog entries, not independently verified distinct models.

Most images in the original archive are only 200 pixels wide and are no longer eligible for display. Original archive bytes and the download remain in the ignored `.data/stockx-import/` directory. The upgrade pipeline downloads unresized source originals, checks their native dimensions and compares foreground shape and color against the archived reference before creating a WebP. Ready images have a minimum width of 800 pixels and a minimum height of 200 pixels. It never enlarges a thumbnail to qualify it. Product names remain filename-derived rather than verified style-code identities. A public archive does not establish commercial display rights.

The user selected **sneakers/trainers only**. `sneaker-selection.mjs` conservatively selects known sneaker model families and excludes other footwear, accessories and unknown families. `hasSharpSneakerPhoto` applies the same category and photo-quality gate to catalog, search and individual reference-product lookup. Small images and unresolved matches remain hidden. These are presentation checks, not merchandise or authenticity certification.

Run `node scripts/upgrade-sneaker-photos.mjs` to resume the source-photo pass. Its per-image cache avoids downloading known results again; `--retry-unavailable` rechecks missing/uncertain sources. Raw originals, URLs and matching metrics are kept under `.data/stockx-import/quality*`. Eligible files use a content hash in their public filename, preventing stale thumbnail caches. It stops further CDN requests on HTTP 403/429. `evidence/sneaker-photo-upgrade.json` records the final visible count and unavailable-image count. The source JSON keeps excluded entries so the import is reversible.

## Reproduction

Download `stockx-imgs.zip` from the source repository into `.data/stockx-import/stockx-imgs.zip`, then run from `independent`:

```powershell
python scripts/extract-stockx-archive.py
node scripts/import-stockx-archive.mjs
node scripts/build-motion.mjs
```

The extraction script validates paths, file sizes and JPEG/PNG signatures and writes a manifest of unique original bytes. The importer decodes images with Sharp, preserves the 26 curated entries, skips existing filename matches, generates stable archive IDs, writes local WebP files and atomically replaces the catalog JSON. It uses the backend's already installed Sharp dependency. The optional `--upgrade` flag tries corresponding public CDN image filenames, accepts only larger decoded images with matching aspect ratios and similar downsampled pixels, and stops further CDN requests after a 403/429 response. Missing CDN images retain the real archive thumbnail. No marketplace pages, proxies, anti-bot bypasses or login credentials are involved.

## Serving and checks

The server reads and caches the catalog by file version. Initial HTML renders only one page of entries. `/api/reference-catalog` returns paginated search/filter results; the full catalog is never embedded in the HTML. The existing catalog controller retains its transitions and picker interactions and cancels obsolete searches. Native forms and pagination also work without JavaScript. This API and editorial product browsing remain limited to development test mode; no Medusa merchandise was created or published.

The current preview only accepts the StockX edit, replacement-photo and downloaded archive asset sets, and requires the sneakers/native-image quality checks above. Retired `shop-products` Takeout cutouts do not enter its catalog or product lookup. Collection cards render one cover photo; additional product photos remain in the product gallery, avoiding overlapping hover images. When the independent project is present, the old development preview on port 9292 redirects collection/search and StockX product links to port 3000. Old `pair-*` product links open the current collection because their identities are unverified. The underlying legacy archive files are preserved.

`evidence/stockx-archive-import.json` records counts and import failures. `evidence/stockx-bulk-browser.json` records browser checks for search, brand filters, pagination, stale search cancellation, product images/lightbox, mobile overflow and browsing without JavaScript. `evidence/stockx-bulk-build.log` records the production build. No real commercial catalog, inventory or checkout readiness is implied by these preview checks.
