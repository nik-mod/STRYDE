# Cinematic theme architecture — Milestone 02.5

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

Chapter boundaries are intentional. Dark or sky chapters (technology, collection, brand, finale) enter through a scrubbed clip-path wipe — the incoming composition rises over the outgoing one; shared-field chapters (deconstruction, materials, featured) arrive by content choreography. The hero resolves into deconstruction through its stage-color scrub. All clips and offsets are applied inside the motion context only, so no-JS and reduced-motion visitors see every section complete.

Desktop-only pinned sequences, in document order (never overlapping): hero (2.5× travel), materials macro journey (2.2× — the section becomes a viewport stage and its three phases crossfade with depth), collection horizontal reel (track overflow), brand manifesto stage (1.6×), finale staging (1.7× — spotlight, product rise, masked purchase reveal). Touch layouts keep flowing panels and native horizontal scrolling.

Typography is composed per chapter instead of repeated: monumental oblique gradient display (hero), restrained engineering headings with tabular numerals and corner-tick framing (deconstruction), light-weight editorial display with macro captions (materials), word-masked technical heading with a scrubbed vertical spine and variable-weight outlined word (technology), exhibition indexing with oversized numerals (collection), asymmetric rotated-frame campaign story (featured), quiet/loud manifesto contrast with scroll-modulated weight axes (brand), and a minimal staged purchase reveal (finale). Weight modulation runs through `font-variation-settings` custom properties tweened by GSAP; all text remains real, selectable, and accessible.

`src/motion/environments.mjs` provides the product-environment registry: every chapter declares `data-env`, an observer exposes the active environment on `<html>`, and the lazy scene eases its key/rim lights toward the preset whenever the hero pose is not the owner. This is the deterministic seam future product switching and GLB lighting will use; it invents no products.

## Chapters 02–08 — layouts and choreography

| Chapter | Section | Layout | Scroll choreography |
| --- | --- | --- | --- |
| 02 Deconstruction | `chapter-deconstruction` | Engineering component list + sticky macro-crop frame with corner ticks | Crop crossfades plus a slow living-macro drift; items slide in |
| 03 Materials | `chapter-materials` | Light editorial heading; three alternating macro phases | Desktop pins the section as a stage and crossfades phases with depth; touch keeps flowing panels |
| 04 Technology | `chapter-technology` | Dark ocean field, outlined `MOTION` word, spine line, three numbered rows | Wipe entrance; word masks; spine draws with scroll; word weight modulates |
| 05 Collection | `chapter-collection` | Floating exhibition reel: frameless product compositions, full-ink numerals, hairline metadata rows | Wipe entrance; desktop pins the section as a stage and scrubs `x`; cards arrive from recessed poses via containerAnimation (first card exempt); nested visual wrapper carries fine-pointer hover scale/lift and image pointer parallax; touch keeps native scroll |
| 06 Featured | `chapter-featured` | Asymmetric campaign story, rotated frame | Content arrival; image parallax; frame rotation settles from −6° to −2° |
| 07 Brand | `chapter-brand` | Pinned manifesto stage: rule, outlined watermark, quiet/loud lines | Wipe entrance; rule draws; lines mask-reveal with weight modulation; manifesto rises |
| 08 Finale | `chapter-finale` | Pinned dark stage: spotlight, floor line, product, dramatic heading | Wipe entrance; spot blooms; product rises; heading masks with weight modulation; commerce rises last; gradient continues into the footer |

Temporary crops of the concept artwork use CSS custom properties (`--zoom/--tx/--ty`); the controllers read them and re-express them as GSAP transforms so the CSS fallback and the scrubbed state agree. Every concept image carries an `asset-tag` label; no price, availability or performance claim is fabricated anywhere.

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

The model starts loading only within 200px of the stage. Renderer DPR caps are 1.75 desktop / 1.25 mobile, with no post-processing or particle system. Intersection and document visibility pause draw calls. ResizeObserver updates aspect and renderer bounds without a per-frame layout read. WebGL context loss exposes the fallback; restoration resumes the same scene. Loading, import, network and renderer failures expose a polite status message.

Disposal releases geometry, materials, shared textures, ImageBitmap sources, observers, subscriptions, renderer and canvas. Pending parse results are immediately disposed after an unload. Production FPS, GPU memory and actual GLB quality require licensed assets and physical-device profiling; none have been measured against real merchandise yet.

## Validation limits

Local preview renders these same Liquid sources using a small Shopify-tag adapter and explicit fixtures. It cannot emulate Shopify's server, inventory, markets, tax, checkout, metafield formatting or filter provider. Commerce is disabled and POST requests return 405. Shopify store preview and checkout testing are required before release.
