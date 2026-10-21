# Cinematic theme architecture — Milestone 02.6 stabilization

This is a Shopify Online Store 2.0 theme. Liquid supplies product data, links and native forms. Bundled JavaScript enhances an accessible storefront. The homepage stages the eight-chapter cinematic journey: chapter 01 (hero) is fully implemented as a scroll-controlled sequence; chapters 02–08 are art-directed layouts with authored ScrollTrigger choreography running on clearly labeled temporary assets. They await the production model and merchant data for their final 3D content.

## Theme and runtime

- `layout/theme.liquid` owns document metadata, theme tokens, Archivo font preloads, skip link and header/footer section groups.
- `templates/index.json` orders the eight homepage chapters: `cinematic-hero`, `chapter-deconstruction`, `chapter-materials`, `chapter-technology`, `chapter-collection`, `chapter-featured`, `chapter-brand`, `chapter-finale`. Each is a configurable section with honest defaults that work unconfigured. Authentic merchant image/product/model takes priority over the original AI concept cutout, which is labeled `Concept artwork` wherever it stands in.
- Product, collection, cart, search, page and 404 JSON templates render native Liquid sections. Add-to-cart posts a real variant ID to Shopify (hero, featured and finale chapters render native `{% form 'product' %}` forms); cart update and checkout use Shopify routes. Product JS changes variant price, sale price, availability, URL and image. No JavaScript is needed to submit commerce forms. A no-script GET selector handles a sold-out variant deep link before purchase.
- `src/theme.mjs` owns the sole Lenis instance, GSAP registration, the fixed-header controller and Shopify section lifecycle. `commerce.mjs` is independent of the cinematic scenes.
- `src/motion/contracts.mjs` owns normalized, immutable chapter state, the shared `HERO_PHASES` boundaries and the deterministic `heroPose(progress)` used by the 3D rig. `lifecycle.mjs` owns async resources and the shared frame scheduler.
- `src/motion/hero.mjs` owns the pinned five-phase hero timeline (DOM path) plus its pointer-depth layers. `src/motion/chapters.mjs` owns the per-chapter controllers. `src/motion/header.mjs` owns scroll-responsive header behavior. `src/motion/environments.mjs` owns the chapter environment registry. `src/motion/magnetic.mjs` owns the CTA micro-interaction.
- `src/scene.mjs` and Three.js/GLTFLoader are a lazy chunk. No model setting means no scene download. The loader accepts an uncompressed GLB with embedded textures; no fake geometry is substituted.

## Typography

The display and UI face is Archivo (variable, weight + width axes), bundled locally as two woff2 files (~190 KB total, latin subset, SIL OFL — see `docs/ARCHIVO-OFL.txt`). Two deliberate technical choices:

1. **Uppercase is authored in Liquid (`| upcase`), not CSS `text-transform`.** Chromium drops the italic face when `background-clip: text` rasterizes large glyphs, and the same class of face-substitution appears with `text-transform: uppercase` on variable fonts at display sizes. Uppercasing the content and skewing the gradient lines keeps the oblique deterministic.
2. **The hero gradient lines synthesize their slant via `transform: skewX(-9deg)` on the mask wrapper.** All hero display text is uppercase, where oblique ≡ italic visually; plain-color italic headings use the true Archivo italic face directly, which renders correctly at every size.

## Hero chapter (01) — implemented

The hero pins for `2.5×` stage height (desktop) / `1.5×` (mobile) and scrubs five authored phases that mirror `HERO_PHASES` in contracts.mjs:

| Phase | Travel | DOM choreography | 3D rig (GLB path) |
| --- | --- | --- | --- |
| establish | — | Full composition, masked type entrance, idle float on the image only | Neutral rig, camera z 4.8 |
| depth | 0 → .18 | Type lines drift apart, float rises, ring rotates, copy dims | rotationY −.34 → +.05, camera dolly begins |
| transform | .18 → .46 | Line 1 masks out, art scales 1.22, ring grows | rotationY → +.30, camera z → 4.15 |
| macro | .46 → .72 | Line 2 masks out, art scales 1.62, ring fades, copy exits | rotationY → +.62, camera z → 3.6, fov +3.2, key/rim lights lift |
| handoff | .72 → .9 | Art settles to centered 1.3 pose, stage color resolves to the chapter-02 surface, commerce row exits | rotationY → +.14, camera z → 4.3, lights normalize |
| rest | .9 → 1 | Deterministic hold | Deterministic hold |

All transforms are authored absolute values on a scrubbed timeline (no accumulation, fully reversible), the progress bus publishes `chapterState(0, progress, direction)`, and an entrance timeline (masked line reveals, art rise) plays only when the visitor loads near the top — a paused `.from()` timeline applies hidden start states on creation, so it is never built mid-page.

The hero composes three independent transform layers — scroll base pose (art frame), idle float (image mode only), and a damped pointer offset on its own wrapper (`data-hero-depth`, ±16/12 px, quickTo-eased) with a subtle counter-move on the display type — so pointer interaction can never overwrite the scrub-owned transform. Pointer layers mount only for fine pointers and are removed on cleanup.

## Cinematic continuity system (Milestone 02.5)

Technology, Brand and Finale enter through scrubbed clip-path wipes. Collection takes the stage through its own typographic/product sequence; shared-field chapters (deconstruction, materials, featured) arrive by content choreography. The hero resolves into deconstruction through its stage-color scrub. All clips and offsets are applied inside the motion context only, so no-JS and reduced-motion visitors see complete static content.

Pinned controllers mount in document order: hero (2.5× stage height desktop / 1.5× mobile), materials (2.2× viewport on desktop), Collection (1.15 + 1.15×scene count viewports), brand (1.6× viewport), Finale (2× viewport). Materials flows below 701px. Collection flows at widths up to 900px or with a coarse pointer and no hover; it has no horizontal reel or native sideways scrolling. Hero, brand and Finale retain their existing mobile pins. The Finale stage can grow with merchant content, while its default and fixture purchase controls fit the tested viewports. The M02.6 four-viewport browser audit, deterministic reverse sweeps and boundary checks passed; see QA.md for evidence and production limits.

Typography is composed per chapter instead of repeated: monumental oblique gradient display (hero), restrained engineering headings with tabular numerals and corner-tick framing (deconstruction), light-weight editorial display with macro captions (materials), word-masked technical heading with a scrubbed vertical spine and variable-weight outlined word (technology), exhibition indexing with oversized numerals (collection), asymmetric rotated-frame campaign story (featured), quiet/loud manifesto contrast with scroll-modulated weight axes (brand), and a minimal staged purchase reveal (finale). Weight modulation runs through `font-variation-settings` custom properties tweened by GSAP; all text remains real, selectable, and accessible.

`src/motion/environments.mjs` provides the product-environment registry: every chapter declares `data-env`, an observer exposes the active environment on `<html>`, and the lazy scene eases its key/rim lights toward the preset whenever the hero pose is not the owner. This is the deterministic seam future product switching and GLB lighting will use; it invents no products.

## Chapters 02–08 — layouts and choreography

| Chapter | Section | Layout | Scroll choreography |
| --- | --- | --- | --- |
| 02 Deconstruction | `chapter-deconstruction` | Engineering component list + sticky macro-crop frame with corner ticks | Crop crossfades plus a slow living-macro drift; items slide in |
| 03 Materials | `chapter-materials` | Light editorial heading; three alternating macro phases | Desktop pins the section as a stage and crossfades phases with depth; touch keeps flowing panels |
| 04 Technology | `chapter-technology` | Dark ocean field, outlined `MOTION` word, spine line, three numbered rows | Wipe entrance; word masks; spine draws with scroll; word weight modulates |
| 05 Collection | `chapter-collection` | One asymmetric product stage; mirrored scenes, cropped editorial numerals and configurable scene fields | One pinned scrub timeline: intro → first-product focus → spatial transition → subsequent product moments → exit into Featured. Final product remains visible through the pin end. Tablet/touch and fallback modes use a vertical number → image → metadata composition |
| 06 Featured | `chapter-featured` | Asymmetric campaign story, rotated frame | Content arrival; image parallax; frame rotation settles from −6° to −2° |
| 07 Brand | `chapter-brand` | Pinned manifesto stage: rule, outlined watermark, quiet/loud lines | Wipe entrance; rule draws; lines mask-reveal with weight modulation; manifesto rises |
| 08 Finale | `chapter-finale` | Dark stage: spotlight, floor line, larger product and giant outlined STRYDE backdrop | Wipe entrance; spot blooms; product rises and settles; heading masks with weight modulation; native commerce arrives last. Word counter-drift uses the 200% pin's master timeline |

Temporary crops of the concept artwork use CSS custom properties (`--zoom/--tx/--ty`); the controllers read them and re-express them as GSAP transforms so the CSS fallback and the scrubbed state agree. Concept Collection and Finale imagery carries an `asset-tag` disclosure; real Collection images do not. Missing merchant Collection imagery displays a plain unavailable message rather than substituting concept art. No price, availability or performance claim is fabricated.

## Collection ownership and configuration (02.6)

`chapter-collection.liquid` renders up to three real products from its section picker, or explicitly labeled concept studies when no collection is assigned. `field_1`, `field_2`, `field_3` are Theme Editor color settings, defaulting to #41b4f0, #7fa9f6 and #4fc4d4. Each scene exposes its value as `--scene-field`; the sequence scrubs the section background between these fields. The global environment registry continues to identify the chapter as `collection`; these colors do not change product data or manufacture GLB lighting fidelity.

The master timeline owns `.coll-scene-figure` position, scale and visibility, numeral drift, copy visibility and the field. `collection-hover.mjs` owns only the nested `[data-coll-visual]` scale/lift (1.04/−10px) and image pointer offsets (±5/4px). It caches bounds on pointer entry, invalidates on resize, and explicitly kills quickTo and event-created hover tweens on teardown. Inactive scene shells cannot intercept active links; visible figure and metadata links remain native targets. The heading stays visible while approaching the pin, then yields to product 01.

Flow layout reserves separate grid rows for the number, shoe/disclosure and metadata. It has no minimum viewport-sized scene, negative copy margin or absolutely positioned numeral. Product names can wrap, and collection links have a 44px minimum target. Reduced motion and no-JS use this static layout without `.is-sequenced`; reduced motion skips the chapter controllers entirely. Both fallback modes were browser-emulated at four sizes, including scrolled reloads. Their hero uses normal text/art/copy/control flow.

Hero cleanup is registered with its resource scope; header mounting is idempotent and queued header frames are cancelled on unload. BFCache restoration mounts one environment observer rather than replacing its cleanup reference with a second observer. Existing context/media ownership, abortable model loading, shared clock and native commerce are retained.

Pinned Collection numerals occupy lower corners, separated from copy. Figure X pixels are explicitly zeroed alongside percentage poses, preventing refresh-time accumulated offsets. Finale word centering similarly uses explicit zero X/Y pixels plus percentage centering; its purchase reveal targets rendered controls with explicit from/to poses. Finale shoe/type/spacing scale to viewport height, and the gradient belongs only to the outgoing tail so pinned controls retain contrast.

`src/theme.mjs` saves a per-URL session scroll checkpoint before pagehide cleanup removes pins. Same-viewport, same-motion reload/history entries restore it after fonts and pin refresh, through the existing Lenis instance or native scrolling. BFCache uses the captured in-memory checkpoint. New navigation, changed viewport/motion, expired records and unavailable storage do not force an old position. Browser tests verify exact mid-sequence reload and product-back restoration.

## Shared scene and transition contracts

All eight chapters belong inside one cinematic root and one persistent scene rig. No chapter creates a second renderer or re-fetches the shoe. Sequential pins (hero, materials, collection, brand, finale) never overlap. The 3D controller receives `{ root, scene, camera, rig, assets, bus, signal }`, implements `seek(localProgress, direction)`, and returns `dispose()`.

`chapterState(index, local, direction)` returns `{ chapter, id, local, global, direction }`, with `local ∈ [0,1]` and `global = (chapter + local) / 8`. The bus updates imperatively, outside any framework render cycle. Chapter 0 publishes its full five-phase range; the remaining seven ranges are contracts, not completed 3D sequences.

Three.js uses a right-handed Y-up space. Imported licensed geometry is centered under `rig`, normalized to a maximum extent of 2.2 scene units, and the original mesh names/transforms remain available beneath it. The rig follows `heroPose(progress)` — the same boundaries the DOM path scrubs — so an image fallback and a GLB model tell the same story at the same scroll. `captureHandoff({ camera, rig, lights })` exports the exact outgoing scene state (camera position/quaternion/fov, rig transforms, light intensities/positions) for the chapter-02 controller; `outgoing.seek(1)` must equal `incoming.seek(0)` for every shared property. Controllers calculate transforms from saved neutral transforms, never accumulate changes with `+=`. Reverse scrolling restores the same snapshot exactly.

A missing or failed model never blocks the hero: the image path is the shipped default, and model errors expose a polite status while product imagery remains.

## Motion, responsive behavior and lifecycle

Lenis runs from GSAP's ticker in milliseconds. The shared scheduler attaches only while smooth scrolling or scene work needs it. Native touch scroll is preserved. Native dialogs, visible modal interfaces and the mobile menu pause smooth scrolling; visibility changes pause rendering. Forms, keyboard navigation, checkout and normal anchors remain native.

Each section mounts in `gsap.context` and responsive `gsap.matchMedia`. A condition scope owns its observers, abortable model fetch and eventual async cleanup. Breakpoint changes, reduced-motion changes, Shopify `section:unload`, page exit and back/forward cache restoration cancel and release resources. Section reloads are idempotent. The fixed header hides on scroll down, reveals on scroll up and gains a solid blurred backdrop once the page scrolls; it is independent of the animation rig.

Reduced motion has no Lenis, pin, animated transform, scene chunk import or model fetch. Native content and optional product image remain present; deconstruction crops and material panels render stacked and static; wipes, spots and spine lines render in their resting visible states. No-JS uses the native stage and forms with static layout.

## Performance and failure handling

Campaign imagery now has a central fallback map in `snippets/presentation-image.liquid`, with eight named slots across Collection, Materials, Featured and Finale. It renders direct image children so existing motion selectors and transform owners remain intact. Section image pickers replace fallback artwork without source edits; a concept checkbox preserves disclosures on supplied temporary images. Product bindings retain their existing priority, and Collection standalone pickers cannot override assigned products. Supplied detail photographs reset the concept-only crop variables. See `CONCEPT-IMAGES.md` for the map, precedence and replacement procedure. No timeline, pin length or commerce controller was changed by the image expansion.

The model starts loading only within 200px of the stage. Renderer DPR caps are 1.75 desktop / 1.25 mobile, with no post-processing or particle system. Intersection and document visibility pause draw calls. ResizeObserver updates aspect and renderer bounds without a per-frame layout read. WebGL context loss exposes the fallback; restoration resumes the same scene. Loading, import, network and renderer failures expose a polite status message.

Disposal releases geometry, materials, shared textures, ImageBitmap sources, observers, subscriptions, renderer and canvas. Pending parse results are immediately disposed after an unload. Production FPS, GPU memory and actual GLB quality require licensed assets and physical-device profiling; none have been measured against real merchandise yet.

## Validation limits

The empty local `/collections/all` route now receives ten concept view-models from `tools/fixtures/concept-catalog.mjs`, via the preview renderer's `section.preview_catalog` property. This property is absent from Shopify's SectionDrop and is not a schema setting or persisted theme JSON. The data file is excluded from uploadable theme folders. A separate Liquid concept branch contains no commerce links/forms/prices or simulated sorting/filtering; native populated collection rendering always has precedence. An empty real Shopify collection remains empty. `?concepts=0` exercises that native empty presentation locally; existing `?fixtures=1&image=1` exercises native-product rendering. See `DEVELOPMENT-CATALOG.md`.

Local preview renders these same Liquid sources using a small Shopify-tag adapter and explicit fixtures. It cannot emulate Shopify's server, inventory, markets, tax, checkout, metafield formatting or filter provider. Commerce is disabled and POST requests return 405. Shopify store preview and checkout testing are required before release.
