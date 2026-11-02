# Local StockX photo archive

The local preview contains 11,928 entries across 69 filename-derived brand groups. It combines the existing 26 references with 11,902 additional photographs. This is the complete usable content of the downloaded archive after exact-byte deduplication and two matches to existing curated filenames; it is not a complete or current export of StockX.

Source: [msaaksjarvi/stockx-image-dataset](https://github.com/msaaksjarvi/stockx-image-dataset). Its README describes around 12,000 sneaker images collected from StockX. The downloaded `stockx-imgs.zip` contains 11,957 files. Of these, 53 are exact-byte duplicates, leaving 11,904 unique originals. Names are transcribed from filenames. No style codes, prices, inventory, sizes or current availability are inferred. Some names can describe alternate listings of the same physical shoe; the count is catalog entries, not independently verified distinct models.

Most images in the archive are 200 pixels wide. The importer also reused 44 successfully downloaded, visually compared higher-resolution StockX CDN images. Original archive bytes and the download remain in the ignored `.data/stockx-import/` directory. Storefront copies are WebP files under `design/assets/stockx-archive/`, copied to `storefront/public/assets/stockx-archive/`. Product pages disclose filename-derived identities and thumbnail resolution where applicable. Source hashes, filenames, resolution and archive URLs remain in the JSON data. A public archive does not establish commercial display rights.

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

The current preview only accepts the StockX edit, replacement-photo and downloaded archive asset sets. Retired `shop-products` Takeout cutouts do not enter its catalog or product lookup. Collection cards render one cover photo; additional product photos remain in the product gallery, avoiding overlapping hover images. When the independent project is present, the old development preview on port 9292 redirects collection/search and StockX product links to port 3000. Old `pair-*` product links open the current collection because their identities are unverified. The underlying legacy archive files are preserved.

`evidence/stockx-archive-import.json` records counts and import failures. `evidence/stockx-bulk-browser.json` records browser checks for search, brand filters, pagination, stale search cancellation, product images/lightbox, mobile overflow and browsing without JavaScript. `evidence/stockx-bulk-build.log` records the production build. No real commercial catalog, inventory or checkout readiness is implied by these preview checks.
