# Required merchant data and licensed assets

No authentic product photographs, accurate specifications, reviews, prices, merchant story, GLB or shoebox model were supplied. The attached reference screenshots are not theme merchandise. The theme ships original generated concept artwork, identified by `Concept artwork · Temporary` tags. Authentic merchant imagery/GLB takes priority. Keep the concept checkbox enabled for any temporary artwork uploaded through the new presentation pickers. Do not represent reference artwork or generated approximations as merchandise.

The 2026-10-22 image expansion adds three optimized concept assets and centralized slots for Collection, Materials, Featured and Finale. **[Replacement guide and complete slot map](CONCEPT-IMAGES.md)** lists every picker, fallback, filename, dimensions, provenance and generation prompt.

## Bundled display font

`assets/archivo-var.woff2` (upright) and `assets/archivo-var-italic.woff2` (italic) — Archivo variable (weight + width axes), latin subset, SIL Open Font License 1.1 (license copy: `docs/ARCHIVO-OFL.txt`). Source: Google Fonts / Omnibus-Type via the fontsource CDN (downloaded 2026-10-21, `archivo:vf@latest latin-standard`). ~190 KB total, preloaded in `layout/theme.liquid`, self-hosted, no runtime CDN dependency. Shopify assets are flat, so the woff2 files live in the assets root.

## Temporary sky-blue concept asset

Original project asset: `assets/stryde-concept-v2.png` (1375 × 1144, PNG with transparency). It remains the approved Hero/Deconstruction image and the Collection 01, Materials 01/03 and Finale fallback. The expansion's other three studies are listed in CONCEPT-IMAGES.md. Visible disclosure uses `Concept artwork · Temporary` tags, including the newly disclosed Materials frames. No fabricated price is added. Configured authentic imagery omits the fallback and its tag; reduced motion renders static imagery with the same disclosure.

Generated on 2026-10-21 using the built-in `image_gen` tool, transparent-background mode, with no API/CLI fallback and no reference artwork supplied as an image input. The subsequent reframe used only the first generated concept as its edit target. This is an AI concept, not a manufacturer-authorized product render, specification or representation of available inventory. No product accuracy or production asset clearance is asserted.

The selected output was inspected with `view_image`. Generation source: `C:/Users/LENOVO_LEGION/.codex/generated_images/01a15e0b-5469-7fe3-a1ca-506ee5eb274d/exec-ffb3fbc4-25ac-4739-9ba1-b596e81320e0.png`. Initial output: `exec-e65e47c9-c414-447c-bdf9-308cef8570a0.png` in the same generated-images folder. The selected image was copied into the project; no runtime reference depends on the generated-images folder.

### Full generation prompt

```text
Use case: product-mockup
Asset type: transparent conceptual sneaker cutout for a premium blue/cyan footwear website hero, explicitly temporary concept artwork, not real merchandise.
Primary request: Create ONE exceptionally detailed original futuristic sneaker design, luxurious and commercially convincing, floating in a diagonal hero pose: toe toward lower-left, heel toward upper-right, three-quarter lateral view. The complete shoe is fully inside the frame with generous transparent margins. A visually dynamic long sculpted silhouette, approximately 25 degrees heel-up diagonal.
Scene/backdrop: genuinely transparent background, isolated object cutout with alpha. No ground plane, no background, no cast floor shadow, no ellipse or graphics.
Style/medium: exceptionally polished photoreal premium commercial CGI product rendering, crisp micro-details and realistic physically based materials.
Materials/textures: metallic satin silver exoskeleton with brushed detail, ice-blue translucent TPU side panels and cushioning chambers, pale blue intricate woven mesh, realistic silver eyelets and white laces, fine stitching, credible sculpted layered sole with transparent ice-blue structural windows, sophisticated original upper architecture.
Lighting/mood: large soft commercial studio lights, elegant white highlights, cyan reflections and deep cool-blue accents, refined material contrast, three-dimensional volume.
Constraints: No logos, trademarks, brand symbols, letters, numbers, text or watermark anywhere. Original design, do not copy a particular brand or any attached shoe. Only one shoe. No cropping. No background graphics. Preserve true transparency.
```

### Targeted reframe prompt

```text
Edit the provided transparent sneaker concept cutout. Preserve the same original silver and ice-blue sneaker design, photoreal commercial CGI materials, diagonal toe lower-left and heel upper-right pose, detailed woven mesh, laces, metal structural ribs and translucent sole. Reframe ONLY: make the shoe approximately 76 percent of the canvas so ALL of the toe, outsole and ENTIRE heel pull loop are fully visible with at least 10 percent genuinely transparent breathing room on every side. Reconstruct the small missing top of the heel pull loop naturally. Background must remain truly transparent, no ground, no background, no shadow plane, no text, letters, numbers, logos or watermark. Do not add a second shoe. Full complete object with generous transparent margins.
```

## For the full cinematic experience

Supply a licensed, product-accurate GLB for each featured silhouette. The initial loader expects a self-contained uncompressed GLB (embedded textures, no Draco/Meshopt/KTX extension dependencies). External CDN URLs require CORS permission; prefer Shopify Files. Compression support can be added deliberately with bundled decoders in a later milestone.

- Separate meshes named `outsole`, `midsole`, `upper`, `laces`, `insole`, `heel_support`, `structural_support`; include a manifest if real parts use other names. Preserve component pivots and a documented neutral assembled pose. Mesh separation must correspond to the actual shoe.
- Shoe origin at its visual center, Y up, consistent units and materials. No baked random transforms. Supply macro-ready UVs and authentic weave, mesh, foam and traction details.
- PBR base color, roughness/metalness, normal and optional occlusion. sRGB color textures; linear normal/data maps. Avoid unnecessary 4K maps. Target ≤120k triangles desktop, ≤60k mobile; ≤8 materials and 8 primary texture sets per shoe. Prefer 1K maps, maximum 2K for inspected surfaces. Starting transfer budget ≤6 MB desktop / ≤3 MB mobile, GPU texture budget ≤48 MB / ≤24 MB per active product. These are intake targets, not achieved measurements.
- A licensed low-detail mobile variant, still image fallback (at least 1800px longest edge), mobile crop, image alt text, component reference diagrams, and approved product/feature callout text.
- Shoebox meshes `box_base`, `box_lid`, `tissue`, optional `insert`, and the exclusive product. Lid pivot on its real hinge/opening edge; document lid closed and fully open poses. Supply brand artwork, interior textures and realistic dimensions. Target box ≤20k triangles and ≤3 MB embedded payload. No particle assets needed for M01.
- Editorial campaign desktop/mobile images and merchant-approved copy, subject/photographer releases where applicable.

For every asset record creator/vendor, source URL or invoice, license grant, product/style identifier, permitted commercial/web derivatives, attribution obligations and optimization history. Keep originals outside the theme package. Avoid filenames or embedded metadata that expose private client information.

## Shopify setup

Create actual products, variants with options/SKUs/prices/inventory, product media, collections, navigation and store policies. Theme Editor → Cinematic foundation accepts a featured product, collection, presentation image and optional GLB URL. Global Theme settings configure brand/logo/colors. The homepage uses the selected product's image if no presentation override is set.

Optional product metafields:

| Namespace / key | Definition | Use |
| --- | --- | --- |
| `custom.cinematic_model` | File reference; restrict to GLB-compatible generic files | Optional model when the section has no explicit model URL |
| `custom.materials` | Rich text | Authentic product materials detail on product page |

Future chapters need authenticated technology copy, component-to-callout mapping, material data, campaign content and product-to-model/variant mapping. Define and validate those structures together with the relevant milestone; they are not currently fabricated in theme data.

M02's optional viewer normalizes a supplied GLB and drives it with the five-phase deterministic `heroPose(progress)` — the same phase boundaries the image fallback scrubs — covering rotation, camera dolly/fov and key/rim lighting. `captureHandoff({ camera, rig, lights })` exports the exact outgoing state for the chapter-02 deconstruction controller. Merchant verification is required for framing, scale, material fidelity and licensing. The image fallback performs planar motion only and never simulates 3D.
