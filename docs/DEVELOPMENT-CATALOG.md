# Local development sneaker listing

`http://localhost:9292/collections/all` shows **10 non-purchasable concept studies** when the standalone preview has no native products. This is the actual collection listing route, separate from the cinematic homepage. It reuses the three full-shoe artworks in ten explicitly temporary color/pose studies; it does not imply ten manufactured silhouettes or inventory items. No new image generation or commercial photography was required.

## Data boundary

The only catalog definition is `tools/fixtures/concept-catalog.mjs`: names, color-study descriptions, existing asset filenames, intrinsic dimensions and restrained color/rotation treatments. There are no prices, inventory quantities, variants, availability flags or product URLs.

`tools/preview.mjs` injects these view-models as `section.preview_catalog` only while rendering the empty `/collections/all` page. This is not a Shopify collection/product object, theme setting, metafield or persisted template value. Shopify's SectionDrop has no such property, so an uploaded theme cannot enable the fallback through its settings. The `tools/` data file does not enter a theme package. The Liquid branch also requires an empty collection: a populated native collection always wins even if a local catalog happens to be present in its render context.

The concept branch renders `snippets/development-catalog.liquid`. It has no buy controls, prices, product links, fake filters, sort selectors or pagination. Each entry displays **Concept artwork · Temporary** and the page explains that the studies are unavailable for purchase. The native branch retains Shopify products, real prices, product links, filters, sorting and pagination. Empty Shopify collections retain their genuine empty state.

Local QA URLs:

- `/collections/all`: the default 10-entry development catalog.
- `/collections/all?concepts=0`: the native empty-state presentation, with the concept fallback explicitly disabled.
- `/collections/all?fixtures=1&image=1`: the existing labeled native-product fixture; this takes priority over concepts. Commerce remains disabled in standalone preview.

Change a development study in the one catalog file and restart `npm run dev` to reload the Node view-model. Do not copy these entries into Shopify products, the production template JSON or section schema. Visual classes and motion remain theme code; names/data stay in development tooling.

## Replacing with real merchandise

1. Create genuine products in Shopify Admin, set their actual pricing/availability and publish them to the Online Store sales channel as appropriate.
2. Upload authentic product photographs and select each product's featured image.
3. Assign products to the desired Shopify collections. `/collections/all` uses Shopify's all-products collection.
4. Open the theme's Shopify storefront preview, or use the existing `npm run theme:dev -- --store YOUR-STORE.myshopify.com` workflow with an authorized store.
5. Confirm the real titles, photographs, prices, native links, filtering, sorting and pagination. Real products render automatically; no array removal, theme switch or code edits are required. Review mobile framing and approved merchant copy.

`npm run dev` on port 9292 is deliberately an offline fixture renderer: it does not synchronize Shopify Admin data. Its `fixtures=1` option tests the native markup with labeled test data. To inspect actual merchandise after Admin changes, use the connected Shopify theme/store preview in step 4.

The homepage image-picker replacement workflow remains in `CONCEPT-IMAGES.md`. This catalog does not change those slots or any homepage timeline.
