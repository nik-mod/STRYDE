# Temporary campaign imagery — 2026-10-22

The actual `/collections/all` development listing now reuses these full-shoe assets for ten non-purchasable color/pose studies. Its separate local-only data boundary and eventual Shopify product workflow are documented in [DEVELOPMENT-CATALOG.md](DEVELOPMENT-CATALOG.md). The image slots below continue to control the cinematic homepage only.

These are generated, unbranded concept studies, not authentic merchandise, specifications or representations of inventory. No external reference photograph or branded product was used as generation input. No product identity, performance claim, review, price, model or commerce behavior was added. The original approved hero remains unchanged. The Finale retains the same original artwork to close the campaign consistently.

## Slot map

The single fallback map is `snippets/presentation-image.liquid`. The section's native Shopify image picker takes precedence over its bundled fallback. Assigned Collection products always use their own featured images; standalone scene pickers never override them.

| Slot | Bundled artwork | Replacement in Theme Editor |
| --- | --- | --- |
| `collection_1` | Existing `stryde-concept-v2.png`, front three-quarter | Collection reveal → Scene 01 image |
| `collection_2` | New `stryde-concept-side-v1.webp`, lateral view | Collection reveal → Scene 02 image |
| `collection_3` | New `stryde-concept-rear-v1.webp`, rear angle | Collection reveal → Scene 03 image |
| `material_1` | Existing front artwork, woven-upper crop | Materials → Panel 01 detail image |
| `material_2` | New `stryde-concept-detail-v1.webp`, dedicated macro | Materials → Panel 02 detail image |
| `material_3` | Existing front artwork, sole-chamber crop | Materials → Panel 03 detail image |
| `featured` | New lateral view, reused from scene 02 | Featured product → Presentation image |
| `finale` | Existing approved front artwork | Finale → Presentation image |

The three new WebP assets total **1,144,682 bytes**: side 1536 × 1024 / 259,790 bytes; rear 1536 × 1024 / 317,822 bytes; detail 1254 × 1254 / 567,070 bytes. Side/rear retain alpha; the macro is an opaque square. They load lazily and the shared side asset is browser-cache reusable. No runtime image generator, external image service or new dependency was introduced.

## Replacing the studies

1. For a real assortment, assign a Shopify collection in **Collection reveal → Collection**, and upload each product's real featured photo in Shopify Products. Titles, prices, availability and product URLs remain native. Products without photographs retain the existing unavailable-image state. Scene image pickers apply only when no populated collection is assigned.
2. For standalone campaign compositions, upload your photographs into the named scene, detail or presentation pickers above. Featured/Finale precedence remains **Presentation image → assigned product featured image → labeled concept fallback**. Nothing needs to be changed in the timeline or section markup.
3. Keep **…image is concept art** enabled for any uploaded temporary/concept artwork. Turn it off only when replacing that slot with authentic merchant photography. Bundled fallbacks always show **Concept artwork · Temporary**, irrespective of that checkbox. The checkbox applies to the explicit picker image, never a product's own photograph. Clearing a picker restores the honest fallback/precedence chain.
4. Review all crops and approved copy in the Shopify store preview. Existing saved text is never rewritten by a schema default change. Replace any development copy with accurate merchant content before release.

Use full-object transparent cutouts with generous margins for Collection and Finale. Landscape images are supported; concept Collection images fit within the established 1375:1144 scene envelope. Supply tightly composed roughly square detail photos for Materials. Supplied Materials images reset to scale 1 / offset 0 instead of inheriting the old concept zoom and offsets; the existing gentle GSAP settle remains. Featured accepts a cutout or editorial photograph within its existing frame. Shopify serves uploaded images with responsive widths; bundled WebP fallbacks remain local theme assets.

Naming convention for future bundled studies: `stryde-concept-{view}-v{revision}.webp`. To change a development fallback, update its one slot assignment in `presentation-image.liquid`, its intrinsic width/height and descriptive concept alt text. Add a new revision rather than overwriting the approved hero. Merchant replacements should normally use pickers, not asset filename edits. Hero and Deconstruction intentionally continue using the approved original outside this expansion's slot map.

## Generation provenance

Generated with the built-in `image_gen` tool on 2026-10-22; no API/CLI fallback and no image input. Original PNG outputs remain in `C:/Users/LENOVO_LEGION/.codex/generated_images/01a15e09-43e7-7bb2-a336-868299c3d058/`:

- Side: `exec-5ff563be-e7ba-412d-98c8-f3a68552ca2c.png` (transparent mode).
- Rear: `exec-9d13f5f5-f515-4813-91e8-70b78ca59814.png` (transparent mode).
- Detail: `exec-833f1dfc-16a3-4f68-b69c-6f398d562976.png` (opaque mode).

Outputs were visually inspected, then encoded to WebP at quality 90 / alpha quality 100 with the already bundled Sharp runtime. Encoding preserved dimensions and composition; original outputs were retained. Only the optimized copies ship in the theme.

### Final prompt — side

Use case: product-mockup. Asset type: temporary unbranded concept sneaker cutout for the STRYDE sky-blue/cyan website, not real merchandise photography. Generate ONE original futuristic low sneaker in a refined clean lateral side profile, toe left and heel right, a slight 8-degree heel-up inclination. Entire shoe and pull loop fully inside frame, 12 percent transparent breathing room every side. Long sculptural satin-silver rib architecture, pale ice-blue woven upper, translucent cyan structural sole windows, white laces, finely resolved microtexture. Visually related to a premium silver/cyan footwear concept campaign, but a distinct original silhouette, no brand identity. Exceptionally polished commercial CGI concept study, soft white studio highlights, restrained cool reflections. Genuinely transparent alpha background. No ground, shadow plane, props, layout, symbols, lettering, numbers, logos, trademarks, swooshes, recognizable brand signatures or watermarks. One complete shoe only; generous clear margins, landscape composition. Do not imitate an existing branded product.

### Final prompt — rear

Use case: product-mockup. Asset type: temporary unbranded concept sneaker cutout for a sky-blue/cyan premium footwear campaign, explicitly not authentic merchandise. Generate ONE original futuristic silver and frosted-cyan sneaker seen from a sculptural rear three-quarter angle: heel dominant toward lower-right, toe receding toward upper-left. Entire shoe, outsole and heel loop fully framed with 12 percent genuinely transparent breathing room each side. A coherent but distinct companion to a silver/cyan concept collection: satin-metal flowing heel ribs, milky translucent cyan sole chambers, ice-blue technical knit, pale laces glimpsed over the vamp. Premium believable material rendering, white studio highlights, controlled deep ocean-blue reflections. No platform or shadow plane; transparent alpha background. Only one shoe, no props. No letters, numbers, logos, trademarks, swooshes, recognizable brand/product design signatures, brand markings or watermarks. Original form design, not a replica. The heel structure must be the focal point, not a duplicate front-angle pose.

### Final prompt — detail

Use case: product-mockup. Asset type: temporary concept footwear material close-up for a framed editorial macro image, not a technical specification or merchandise photo. Create a square premium CGI macro study of an original unbranded futuristic silver/cyan sneaker: one sweeping satin silver structural rib crossing tactile pale ice-blue woven mesh and a clear cyan curved sole chamber. Tightly composed material detail, purposeful diagonal material boundaries, full image field occupied by the surfaces, no empty top area. Soft studio lighting, delicate brushed-metal grain, clear cool highlights, no glow effects. Cohesive sky-blue, cyan and silver palette; deep-blue recesses. Solid sky-blue background visible only in small gaps between surfaces. No complete shoe, no text, logos, branding, numbers, watermarks, diagrams, labels or props. Do not reproduce a recognizable branded product. Clearly an original conceptual design study.
