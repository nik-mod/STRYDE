# Hero staging, trust layer — 2026-10-23 record

This pass transformed the hero into a signature composition, added an honest merchant-editable trust layer to the product page, and verified the finale climax — building on the parallel developer's TN model integration and real-photography catalog without replacing any of it.

- `npm run build`, `npm test` (56 pass), `npm run validate` (72 files), `npm run theme:check` (42 files, one pre-existing `OrphanedSnippet` warning from parallel work-in-progress, left untouched).

## Hero — sandwich composition

The product box now spans nearly the full viewport (`left 5% / right 4% / top 17% / bottom 16%`), so the hull-fitted 3D model renders at campaign scale instead of floating small in the right half. The headline became a sandwich: line 1 (`BEYOND`, condensed ink 880/80) above the product, line 2 (`ORDINARY.`, italic cyan 620/84) below it — `justify-content: space-between` over a `top 11.5% / bottom 25%` band — so the type interlocks with the silhouette instead of sitting beside it. A giant outlined `STRYDE` backdrop word (up to 470px, ink stroke at 16% alpha, z-index behind everything) fills the sky with brand identity and gives the product an environment to sit in; it breathes with the scrub (yPercent 4 → −3, scale 1 → 1.05), dissolves into the deconstruction handoff, and fades up on the entrance timeline. All breakpoint overrides (tablet portrait, mobile, short phones, landscape phones, reduced motion) were rebased to the new geometry. Breakpoint compositions, mid-scrub states, the handoff end state, mobile 390×844 (no horizontal overflow) and a reverse-scroll restoration (scrollY 0 with the word, foot and line transforms back at canonical start values) were verified in-browser.

## Trust layer (business requirement)

`main-product.liquid` gained four editable settings — sizing, delivery, returns and support notes — rendered as hairline trust rows beneath the buy controls. Each row renders only when the merchant fills it (verified: zero `product-trust` markup on the unconfigured preview product); empty defaults never invent policy claims. Locale keys added (`products.trust_*`).

## Verified as already strong (parallel developer's committed work — untouched)

The Collection renders distinct licensed real sneakers (New Balance 574, Air Max 90, Adidas Gazelle) with CC credits and non-purchasable disclosures; the Finale shows the TN model at 84vw with staged lighting; deconstruction/materials carry real TN photography. The one remaining Theme Check warning (`OrphanedSnippet`) belongs to that in-flight work.

Screenshots: `C:\Users\LENOVO_LEGION\.zcode\cli\artifacts\session_0d48ddcb21fcc260e4a4d228c8e80b3e\` — hero initial (`call_a4118a10…`), hero mid-scrub (`call_e62edab9…`), hero handoff (`call_f2b3cb52…`), finale (`call_ee3b75d9…`), mobile hero (`call_dc56673e…`), reverse restoration (`call_b01ae1c7…`).

Not verified this pass: slow/fast wheel stress through the new hero timeline (programmatic positions verified instead), tablet-width hero photography with a real configured collection, and reduced-motion runtime (structure unchanged; the backdrop word is a static CSS element with GSAP motion only). Nothing was committed, pushed or deployed.

---
# Milestone 02.6 verification record

2026-10-23. The Collection was redesigned as a pinned cinematic product sequence and the Finale was strengthened, per the M02.6 art-direction brief. Implemented on the M02.5 state; this session overlapped with parallel development on the same repository (see "Concurrent development" below).

- `npm run build`, `npm run validate`, `npm run theme:check`, `npm test`: all executed green at session end — 56 tests pass (20 from the M02/M02.5 line plus 36 added by parallel development), 72 theme files validate, Theme Check reports one pre-existing `OrphanedSnippet` warning from parallel work-in-progress (left untouched).

## Implemented

1. **Collection phase sequence (desktop):** the horizontal reel was replaced by one pinned, scrub-controlled composition — typographic intro (headline lands, then yields the stage), a per-product hero moment for each of the first three scenes with alternating asymmetric layouts (odd scenes: product left/copy right, numeral cropped at the right edge; even scenes mirrored), scroll-scrubbed per-scene field colors (`#41b4f0` / `#7fa9f6` / `#4fc4d4`, now merchant-configurable `Product 01–03 field` color settings), continuous in-phase drift on numerals and products, spatial exits (outgoing product recedes left/down-scale while the incoming enters from the opposite side), and an exit that keeps the final product on stage while the surface resolves into the Featured chapter — no blank frame between chapters.
2. **Finale climax:** giant outlined `STRYDE` word backdrop (blooms behind the product with a slow counter-drift), larger product (560px) with a rotation-settling rise, tightened event spacing, pin extended to 200% travel. Purchase controls and the gradient-into-footer handoff unchanged.
3. **Brand watermark centering fix:** the CSS `translate(-50%,-50%)` centering was being overwritten by GSAP transform writes (the word rendered shifted); replaced with margin-based centering compatible with the tween.

Browser verification (desktop 1440×900): intro composition, settled scene 1, scene 2 mid-transition (mirrored), and the finale climax captured and reviewed; hover architecture re-targeted to scenes (same wrapper pattern); mobile 390×844 renders the flowing scene layout (no pin, no horizontal overflow, full shoes, giant numerals).

Defects found and fixed during QA: the first exit implementation faded the stage to a blank surface frame before Featured arrived (exit now keeps the product visible through pin end); a navigation mistake during QA (measuring section position while pinned) initially mimicked a broken sequence — resolved by measuring from a neutral scroll position.

## Concurrent development — important context

During this milestone a parallel developer committed four "UI" commits (22a6593 → 2cfb251) that: committed the earlier M02/M02.5/gallery work; rewrote the collection scenes further (TN GLB model integration `assets/nike-tn-blue-white.glb`, editorial scene images, `collection.chrome_rear_note` copy, a `collection-hover.mjs` module, `signature.css`, expanded preview tooling and a 56-test suite); and added two GLB assets. This session's collection/finale controller and scene CSS were preserved through those commits. One redundant change from this session (duplicate scene-field color settings) was identified and reverted in favor of the parallel developer's implementation; no other files were touched. The theme package was intentionally NOT regenerated this session to avoid bundling the parallel developer's in-flight work.

Not verified this session: a continuous reverse sweep and fast-scroll stress across the full sequence pin (QA was interrupted by concurrent browser use — phase-level scrub states were verified numerically instead), tablet-width rendering of the sequenced layout, hover against a real configured collection, reduced-motion/no-JS runtime, and the parallel developer's TN GLB integration. No deployment, publication or commit was performed by this session.

---
# Tactile materials, complete views and living finale — 2026-10-22

The existing model now has stronger render-time weave and pale-surface grain, clearer normal definition and less flat lighting. Original texture maps and geometry are retained. Materials and Deconstruction show complete TN views within measured framing limits. Collection indices are smaller and fully inset. Finale's shoe is larger with transparent image padding removed from the composition, width-safe typography and a gentle float/rock loop tied to the existing pin's active state. No extra viewer, ticker or scroll controller was introduced. Merchant imagery and commerce branches are preserved.

Seven viewport checks pass for image alpha containment, whole indices, finale image/headline/controls inside the viewport, floating motion, offscreen pause, reduced-motion cleanup and shader/page errors. Additional deconstruction and no-JS framing checks pass. Build, 32 tests, validation and Theme Check pass. `SURFACE-POLISH.md` documents parameters, limitations and screenshot paths; it supersedes earlier crop and oversized-numeral descriptions below.

# Larger hero and Collection framing — 2026-10-22

The hero now fits the actual mesh silhouette using 3,546 convex-hull points baked offline into the GLB scene metadata. This removes the excess empty space in rotated bounding boxes and the unnecessarily distant camera floor. It uses a 94% safe area and retains the single idle-gated renderer. The model remains 327,498 triangles with unchanged textures; framing metadata brings its file size to 2,638,764 bytes. Merchant GLBs without metadata use original transformed bounding corners. `MODEL-DETAIL.md` includes the updated bake command and checksum.

The six-viewport pixel checks passed all forward/reverse poses, resizing, idle draw gating and reduced-motion teardown, with no edge clipping or overflow. Compared at identical poses with the previous hero-detail captures, actual shoe pixel height is 1.25–1.75 times larger across the sampled viewports. Artifacts: `C:/Users/LENOVO_LEGION/.codex/visualizations/2026/10/21/01a15e09-43e7-7bb2-a336-868299c3d058/hero-scale/`.

Collection figures use 60% stage width without the former 720px ceiling; only the labeled TN editorial images compensate for transparent padding with a 1.15 scale. The final scene stays at full scale through the exit. Native merchant images retain containment. All three scenes and reverse passes passed at six sizes, with clear copy/links, no horizontal overflow and reduced-motion flow. Screenshots: adjacent `collection-scale/`. Build, 32 tests, validation and Theme Check pass; no commit, push or deployment.

# Hero clipping, detailed GLB and Collection exit — 2026-10-22

The bundled hero model now retains 327,498 triangles from the original local export (previously 115,586), with original PBR images preserved byte-for-byte. Meshopt compression reduces the file from 4,293,624 to 2,541,660 bytes. The existing Three.js decoder is configured on GLTFLoader; only one viewer is mounted. See `MODEL-DETAIL.md` for source, commands, checksums and scope.

Removed the live model's stacked DOM zoom. Camera fitting contains the rotated model after pose and viewport changes. A new unit test covers 101 poses at five aspect ratios. Chromium checks at 2048×1140, 1440×900, 1440×700, 768×1024, 390×844 and 375×667 confirm the 327,498-triangle mesh actually renders, occupied alpha pixels stay inside every canvas edge at intermediate forward/reverse poses, resizing remains safe, idle draws stay zero and reduced motion removes the canvas. The final Collection title and link now remain visible through its exit; both pinned and flowing modes were checked. The first browser script had an incorrect assumption that tablet Collection was pinned; its flowing-layout scroll setup was corrected and the complete six-viewport run passed.

Artifacts: `C:/Users/LENOVO_LEGION/.codex/visualizations/2026/10/21/01a15e09-43e7-7bb2-a336-868299c3d058/hero-detail/`. Final build, 32 tests, validation of 62 theme files and Theme Check (40 files, zero offenses) pass. No commit, push or deployment.

# Collection composition repair — 2026-10-22

The pinned Collection now has a definite viewport height and a shrinkable stage. Its decorative numerals sit behind the product side of each mirrored scene, with animated opacity capped at 0.12 instead of overriding the CSS with solid ink. Images contain within the stage without the editorial scale enlargement; copy sizing also accounts for short viewports. The Collection link stays unobstructed. Native product markup and mobile/static flow are unchanged.

Chromium checks passed all three scenes in forward and reverse order at 2048×1140, 1440×900, 1440×700, 768×1024, 390×844 and 375×667: no horizontal overflow, numeral/copy separation, visible pinned links, decoded images and reduced-motion teardown. Screenshots and geometry measurements: `C:/Users/LENOVO_LEGION/.codex/visualizations/2026/10/21/01a15e09-43e7-7bb2-a336-868299c3d058/collection-composition/`. Build, 31 tests, validation of 62 theme files and Theme Check (40 files, zero offenses) pass. No commit, push or deployment.

# Scene, Materials and merge stabilization — 2026-10-22

The latest local state combines the incoming model/editorial work with the existing presentation-image system. Four Liquid conflict blocks and the generated-bundle conflict were resolved without committing. Validation now rejects merge markers. The supplied model renders once in the hero; other chapters stay static. The opening reference pose is diagonal with a visible upper; the rest handoff remains level. Existing 2K maps receive better filtering, lighting/normal definition and a subtle preview-only fabric treatment; source geometry is unchanged.

GPU draw-call checks confirm one canvas, zero idle/offscreen draws, scroll redraw and complete canvas removal in reduced-motion mode across four viewport sizes at DPR2. Canvas backing sizes stay below 1.6M pixels. Materials phases have one image each, remain below the heading and inside the viewport, and retain nonblank crops in forward/reverse, reduced-motion and no-JS checks. The ten-entry listing and native Shopify fixture/empty behavior were rechecked. Detailed changes, scope, measurements and screenshot paths are in `SCENE-STABILIZATION.md`. Older sections below are historical.

Final build, 31 tests, validation of 62 theme files and Theme Check of 40 Liquid files pass. The all-eight-chapter sweep and reverse traversal pass at four viewports, including static hero edition/title separation and visible Finale controls at 375×667. A transient Windows mapped-file lock during concurrent builds was cleared by completing browser activity and rerunning the full test suite; it is recorded in SCENE-STABILIZATION.md.

# Development product listing — 2026-10-22

The actual `/collections/all` route now renders **10 non-purchasable concept sneakers** by default in standalone local preview. Three existing full-shoe assets supply ten named, explicitly temporary color/pose studies. No new product images, fabricated prices, inventory, reviews, ratings or buy links were added. The catalog data lives only in `tools/fixtures/concept-catalog.mjs`; Shopify collections/products remain native. `DEVELOPMENT-CATALOG.md` documents this boundary and the eventual Shopify Admin replacement workflow.

Chromium checks passed at 1440×900 (3 columns), 768×1024 touch (2 columns), 390×844 touch and 375×667 touch (1 column). All ten images decoded and disclosures remained visible; no horizontal overflow or image/metadata overlap was found. Fine-pointer hover enlargement/lift and reset passed. The page creates no pins. Three section unload/reload cycles, including duplicate load events, retained one owner and released all listing ScrollTriggers on unload. Reduced motion removes listing triggers; no-JS keeps all ten entries and disclosures. The native-product fixture supersedes the concept catalog and retains its fixture price/link/sort controls. `?concepts=0` retains the honest native empty presentation. Unit rendering with Shopify-shaped context additionally verifies real links/prices/availability, filter parameter names, selected sorting and pagination even if concept data is supplied alongside real products.

Evidence and populated-page screenshots: `C:/Users/LENOVO_LEGION/.codex/visualizations/2026/10/21/01a15e09-43e7-7bb2-a336-868299c3d058/development-listing/` (`qa.json`, four viewport initial/full-page captures, desktop hover, reduced-motion, native fixture and small no-JS captures). Test source: `playwright-development-listing.js` in its parent directory. Independent visual evaluation passed; first-fold spacing was subsequently tightened so the mobile heading has two lines and the artwork appears sooner. Build, 30 tests, validation (45 files) and Shopify Theme Check (37 files, zero offenses) pass. Real Shopify backend commerce and physical-device/cross-browser certification are not asserted. Nothing committed, pushed or deployed.

# Temporary Collection image expansion — 2026-10-22

Three new optimized concept assets add lateral, rear-angle and dedicated detail studies. The Collection now has three distinct views; Featured shares the lateral image, Materials 02 uses the macro, and the approved Hero/Finale image remains intact. Central slot mapping, section image pickers and explicit concept-upload checkboxes are documented in `CONCEPT-IMAGES.md`. Materials frames now visibly disclose their concept content. New default material/Featured copy describes visual studies rather than performance claims; saved merchant copy is preserved.

Chromium checks at 1440×900, 768×1024 touch, 390×844 touch and 375×667 touch passed: all images decode, Collection has three distinct sources, all concept frames disclose, mobile art/copy stay separated, no horizontal overflow, reduced-motion/no-JS content remains accessible, and configured product fixtures retain their own imagery without concept tags. The desktop Collection passed 41 forward/reverse state checks and 12 rapid seeks with unchanged motion owners. Screenshots include each Collection scene, the macro and Featured at all four sizes. Visual inspection prompted extra inset for the landscape Featured concept so its toe remains inside the existing scale drift.

Evidence: `C:/Users/LENOVO_LEGION/.codex/visualizations/2026/10/21/01a15e09-43e7-7bb2-a336-868299c3d058/concept-expansion/qa.json` and sibling PNGs. Browser test source: `playwright-concept-expansion.js` in that artifact directory's parent. Render tests cover all eight slots, shipped assets/disclosures, merchant replacement, concept-upload labels, neutral detail-photo crop and assigned-product precedence over standalone scene pickers. Build, 27 tests, validation (44 files) and Theme Check (36 Liquid files, zero offenses) pass. No commit, push or deployment performed. Real-store/native Shopify image handling and physical-device/cross-browser validation remain production checks.

# Milestone 02.6 stabilization — historical record

2026-10-21. This record supersedes the current-layout descriptions in the historical logs below. The takeover found a clean working tree at `1ce32df`; `d20960e` is its parent. No reset, clean, commit, push, merge, upload or deployment was performed. A pre-edit source snapshot is retained in `.work/m026-stabilization-baseline/`.

**Status: Milestone 02.6 local visual/motion QA completed in Chromium on 2026-10-21.** The earlier approval-review usage-limit failure is historical. Browser execution is now available; the final brief explicitly requested completing the pending checks. Older unanswered approval-request statuses could not be inspected, and none were inferred. Authentic assets, real-store commerce and physical-device/cross-browser production validation remain separate requirements below.

Prior uncommitted stabilization changes were preserved. A second pre-edit snapshot, including untracked source/tests, is in `.work/m026-final-qa-baseline/`; HEAD remains `1ce32df`. Nothing was committed, pushed, merged, reset, cleaned or deployed.

## Implemented fixes

- Collection flow: replaced absolutely positioned oversized numbering, `76svh` scene minimums and the copy's `-6vh` margin with separate number, art/disclosure and metadata grid rows. Removed the art's lateral offset and duplicate metadata gutter. Links have 44px minimum targets; long names wrap. Collection uses this unpinned flow at ≤900px and on coarse/no-hover pointers, including tablet/touch. Default fallback and reduced-motion markup use the same flow.
- Scene fields are Theme Editor color settings (`field_1..3`), preserving #41b4f0 / #7fa9f6 / #4fc4d4 defaults. Unit rendering verifies independent custom values reach their scenes.
- Removed incorrect concept tags from merchant product scenes; missing real imagery gets an unavailable message. Added the missing concept disclosure to the Finale fallback.
- Collection's intro heading remains visible while approaching the pin instead of starting masked offscreen. Final product still remains visible through exit. Inactive absolute scene shells no longer intercept active scene links.
- Hover keeps sequence-owned transforms untouched. The separate controller caches geometry, clamps image offsets, resets on leave and explicitly releases event-created tweens/listeners.
- Hero's returned cleanup is now registered; duplicate header mounting cannot replace a live disposer with a no-op. Header unload cancels its queued frame and guards late callbacks. BFCache restoration retains one environment observer cleanup instead of mounting a second observer.
- Brand watermark drift now moves ±3% around its CSS margin-based center; the previous −47% to −53% shifted it above that center a second time. Finale word drift now shares the full master pin timeline. Finale stage height can grow with its contents rather than permanently clipping controls/copy inside a fixed height.

## Final browser-confirmed defects fixed

- Collection metadata crossed the giant numerals. Numerals now occupy the lower corners, keeping cropped editorial scale while clearing product information.
- The mirrored shoe retained an unintended 129.6px X offset after refresh. Explicit zero-pixel X poses on the sequence prevent that offset from compounding with percentage transforms; full shoes and disclosures remain framed.
- Brand's early pin showed almost only a rule. Its first line is now visible on arrival; the watermark and remaining lines enter earlier without adding content or decoration.
- The third Materials crop showed mostly blue space and the upper collar. Its authored crop now frames the heel's translucent chambers in the existing concept image; no replacement asset was created.
- Finale controls were below the viewport during the pin (desktop control bottom was about 1019px in a 900px viewport). Viewport-aware shoe/type sizing and tighter internal spacing now fit controls, including the fixture price, at all four sizes. The finishing gradient is restricted to the outgoing tail, preserving contrast through the pin.
- The Finale backdrop retained a −707px pixel shift alongside percentage centering. Explicit zero-pixel X/Y poses keep it centered while the word counter-drifts. Purchase controls use explicit from/to poses on rendered buttons/links, avoiding a stale 34px offset and transforms on display-contents forms.
- Pagehide pin cleanup clamped the browser's saved position: a mid-Collection reload moved from 10518 to 8233, and product-back navigation moved from 9359 to 7074. A guarded, per-URL session checkpoint taken before teardown restores reload/history entries after fonts and pins settle. Verified final results are 10518→10518 and 9359→9359. Different viewports/motion modes and normal new navigation do not reuse an old checkpoint; inaccessible storage falls back to native restoration.
- The short-phone header covered the opening headline. Its short-height offset is corrected. Reduced-motion and no-JS heroes now use separate text/art/copy/control flow rather than overlapping absolute layers.

## All-chapter visual and pacing audit

| Chapter | Source assessment / action | Browser status |
| --- | --- | --- |
| Hero | Five phases, 2.5× desktop / 1.5× mobile travel retained; short-phone header clearance and static fallbacks corrected | Entrance/middle/exit inspected at all four sizes |
| Deconstruction | Crop crossfades, image/list rhythm and transitions retained | Entrance/middle/exit inspected at all four sizes |
| Materials | 2.2× desktop macro pin retained; mobile panels flow; final crop corrected | Entrance/middle/exit and final crop inspected at all four sizes |
| Technology | Wipe, word masks and row/spine timing retained | Entrance/middle/exit inspected at all four sizes |
| Collection | Five-phase pin retained at desktop; full product framing and metadata/number separation corrected; tablet/touch flow retained | 41 forward/reverse checkpoints, 18 rapid seeks, wheel stress, resize, reload and native fixture link passed |
| Featured | Existing image/copy parallax handoff retained | Entrance/middle/exit and Collection boundary inspected at all four sizes |
| Brand | 1.6× pin retained; first line and earlier reveals remove the weak entrance | Entrance/middle/exit inspected at all four sizes |
| Finale | 2× pin retained; centered backdrop, visible product entrance, fitted controls and dark pin surface | Entrance/middle/exit, word centering and fixture purchase-control fit passed at all four sizes |

The all-chapter pacing pass used 96 representative screenshots plus supplemental final-state captures and actual wheel/reverse sweeps. No unintended blank stage or horizontal overflow was observed after fixes. Intentional macro crops, large numerals and negative space remain. Pin durations were retained; confirmed defects were corrected through timing, pose and composition. This is not physical-device profiling or a 60 FPS certification.

## Executed automated validation

- `npm run build`: passed.
- `npm test`: **24/24 passed**, including four new settings/merchant-data/hover-teardown/header-frame regressions. The development integration actually starts a same-Liquid server without authentication and verifies CSS and source-JS refresh notifications. It needs loopback access; the first sandboxed run failed with EACCES, then the complete suite passed with approved loopback access.
- `npm run validate`: passed, 40 theme files; eight-chapter order, schemas, section/snippet references and bundled imports validated.
- `npm run theme:check`: passed, 35 files, zero offenses.
- `npm run theme:package`: passed using the existing Shopify CLI process. `dist/stryde-m01.zip` contains all 40 theme files; archive/source SHA-256 checks match every entry, with no developer files included. The ZIP includes both local fonts, the existing concept asset, runtime/chunks, all eight chapter sections and commerce templates. The historical filename is retained by the existing tool and does not imply M01-only contents. No upload/publication occurred.

## Executed browser regression

Headless Chromium tested the running same-Liquid preview at `http://localhost:9292`, at **1440×900, 768×1024, 390×844 and 375×667**. All eight chapters were captured at entrance/middle/exit, inspected in contact sheets and checked in full-size critical captures. Tablet/mobile contexts also used touch/coarse-pointer emulation.

- Collection: 21 forward and 20 reverse checkpoints restored identical transforms/opacity/visibility; 18 rapid seek jumps, slow wheel progression and a large reverse-wheel stress passed. Boundary reversals through Technology→Collection and Featured→Collection passed. No blank Collection checkpoint was observed.
- Full Finale→Hero reverse sweeps ran at all four sizes, with 45 deterministic pinned-state comparisons total. Pin ownership remained unique: desktop 5, tablet 4, phones 3. Collection remains unpinned on tablet/touch.
- Reload while mid-Collection restored exact scroll and scene state. Resize while pinned to tablet flow and back restored one Collection pin. Five unload/load cycles, including duplicate load events, left one owner. Hover scaled/lifted its nested wrapper, reset on leave and left the scrubbed figure transform untouched.
- A configured same-Liquid collection fixture with image and native product URL was clicked successfully. Product-back navigation restored its exact prior Collection position. This validates local wiring, not a connected Shopify collection.
- Finale fixture-price controls fit completely: bottom 826.9/900px desktop, 823.3/1024px tablet, 675.7/844px mobile and 624.0/667px small phone. The backdrop center matched its stage within 1px at all four sizes.
- Reduced motion and JavaScript-disabled modes were actually emulated at all four sizes, including scrolled reloads. No pins remained; heading, art, copy and controls were separated; shopping access and no horizontal overflow passed. Short-phone opening-header clearance and mobile menu Escape close passed.
- Product variants, collection sort, cart update/disabled fixture checkout and search forms passed on desktop/mobile. Local fixture transactions remained disabled. No browser page errors were recorded in the final regression suites.

Browser-only instrumentation exposes the actual bundled GSAP/ScrollTrigger references in an intercepted response for assertions; it is not in theme source or ZIP. Screenshot tests omit only the development SSE refresh script to prevent unrelated source-save navigations while capturing. They run the actual Liquid, CSS and storefront runtime.

Artifacts and runnable browser scripts are outside the theme, in `C:/Users/LENOVO_LEGION/.codex/visualizations/2026/10/21/01a15e09-43e7-7bb2-a336-868299c3d058/`. Final captures and JSON results (`audit`, `regression`, `reverse-sweeps`, `fallback`, `no-js`) are under `m026-final/`; scripts are named `playwright-m026-*.js`. Supplemental final crop/default Finale captures supersede the earlier exploratory images. No source-debug hooks ship.

## Remaining production validation

No requested local browser check remains blocked. Authentic Shopify inventory, markets, platform-generated errors, connected-store Collection hover and checkout remain unverified. Licensed product/box GLBs, real geometry/texture fidelity, physical touch devices, other browser engines and production GPU/frame-rate budgets require a later production pass; no assets were searched for or generated here. Native fixture checks are not live-store certification.

## Historical Collection gallery refinement record (pre-02.6)

The following entries were inherited from earlier development. References to a horizontal reel, old Finale and earlier test counts describe those historical versions, not the current sequence. Their “this session” wording belongs to their original authors.

2026-10-21. The THE LINEUP collection chapter was refined (composition, numerals, framing, hover) on the M02.5 state without touching the horizontal ScrollTrigger architecture. All checks below were executed in this session.

- `npm run build`, `npm test` (20 pass), `npm run validate` (40 files), `npm run theme:check` (35 files, zero offenses), `npm run theme:package` all pass.

Changes:

1. **Composition:** the generic paper frame boxes were removed — products float directly on the chapter field with their numerals and metadata, and the desktop pin now stages the whole section as a flex column (viewport-height aware) so head, numbering, sneakers and metadata share one rhythm. Cards enlarged to 36.5vw for dominance; head and gaps compressed. The previous viewport negative margins — which left only ~135px of horizontal travel and cropped the last card — were fixed with a properly bounded viewport.
2. **Numerals:** full ink color at weight 300 italic, larger, positioned top-left of each card consistently; fully visible at the start, middle and end of the reel (last card right edge measured 1281px inside the 1440px window at progress 1.0).
3. **Framing:** the object-fit scale-zoom that cropped shoe toes and heels at some aspect ratios was removed; sneakers render contain-fit at 110% width — complete shoes, no container clipping.
4. **Hover:** a nested `.coll-card-visual` wrapper carries the GSAP hover (scale 1.055 + 12px lift in one combined tween with `overwrite: auto`), the image carries a restrained pointer parallax (±9/7px via quickTo), and the card — which the horizontal tween owns — is never touched by hover. Fine-pointer gated, reduced-motion safe, restore-on-leave verified (transforms return to none).

Browser QA: first/middle/last reel positions captured; entrance depth choreography verified (first card correctly exempt — its containerAnimation trigger sits behind the container origin); hover verified live (matrix(1.055, 0, 0, 1.055, 0, -12)) and restore verified; reverse wheel sweeps from mid-reel returned the page to scrollY 0 with the reel fully reset; mobile 390×844 keeps native overflow scrolling, no pin, no horizontal overflow (375 ≤ 390).

Fixed during QA: a quickTo scale tween silently no-opped when paired with a second same-element quickTo (the bundled GSAP creates relative `+=0.1` ends) — replaced with a single combined tween; the first card was stuck at its entrance start-state alpha because its containerAnimation trigger sits behind the container origin; metadata was pushed below the pinned viewport before the rhythm compression.

Not verified: hover on a real configured Shopify collection (fixture mode renders labeled concept tiles; the real-product markup branch keeps its native anchors unchanged), and reduced-motion runtime (structurally gated as before). No deployment, publication or commit was performed.

---
# Milestone 02.5 verification record

2026-10-21. Milestone 02.5 (cinematic continuity, per-chapter typography, pointer depth, environments) was implemented on the M02 state. All checks below were executed in this session.

- `npm run build`: bundles cleanly with the new controllers and environment module.
- `npm test`: 20 tests pass (19 prior + the environment-registry test: complete preset coverage per chapter, finite lighting values, frozen singletons, unknown-name fallback).
- `npm run validate`: 40 theme files pass structural checks and the eight-chapter homepage order.
- `npm run theme:check`: 35 files inspected, zero offenses.
- `npm run theme:package`: packages `dist/stryde-m01.zip` with fonts included.

Browser review (ZCode in-app Chromium, same-Liquid fixture preview, desktop 1440×900 and mobile 390×844):

- Materials macro journey: desktop pins the section as a viewport stage; phase crossfades with depth verified mid-pin (phase 02/Metal active at ~45% travel); mobile correctly keeps flowing panels (journey class absent).
- Technology: wipe entrance over materials, word-mask heading, spine line drawn with scroll, outlined word parallax with weight modulation.
- Collection: wipe entrance over technology; horizontal reel pins and scrubs; cards arrive from recessed poses (containerAnimation); oversized index numerals render; mobile keeps native overflow scroll.
- Featured: asymmetric composition with rotated frame and parallax verified entering over the reel.
- Brand: pinned manifesto stage; variable-weight modulation observed live mid-scrub (letters captured between weight states); quiet/loud composition, rule draw, watermark; mobile retains the pin at reduced travel.
- Finale: pinned staging with spotlight bloom, product rise, weight-modulated masked heading; end state fully legible with both CTAs; gradient blend into the footer.
- Hero: preserved five-phase behavior; pointer-depth layers verified (depth wrapper offset +4.2/−2.7px and type counter-move −1.8/+1.1px mid-ease at pointer 1100,250 — composed on separate transforms from the scrub timeline).
- Reverse stability: repeated large reverse wheel sweeps from the bottom restored scrollY 0 with the hero composition pixel-identical (type, ring, copy, CTA all restored through five sequential pins and four wipes).
- No horizontal overflow on mobile (scrollWidth 375 ≤ 390, zero unclipped wide elements).

Defects found and fixed during this QA pass:

1. Materials journey initially pinned the inner stage with pre-hidden captions and a cropped viewport — rebuilt to pin the section as a full-height flex host with the first phase's copy in the resting composition.
2. Empty `.hero-form-errors` divs occupied a flex slot and could displace finale/featured CTAs — hidden via `:empty`.
3. Short-viewport (<840px height) finale content overflowed the pinned stage — compact composition added for that range.
4. A documentation edit briefly reverted three docs to their committed M01 state; all three were rewritten with the merged M02/M02.5 content (no code affected).

Not verified in this environment: `prefers-reduced-motion` and no-JS runtime behavior reviewed structurally only (the in-app browser cannot emulate media preferences); measured FPS numbers (no frame timing instrumentation in this harness — animation smoothness assessed visually only); real Shopify store behavior and the licensed model remain open. No deployment, publication or commit was performed.

---
# Milestone 02 verification record

2026-10-21. Milestone 02 was implemented directly on the M01 foundation. All checks below were re-run in this session; nothing is reported as passed that was not executed.

- `npm run build`: esbuild bundles `src/theme.mjs` plus the lazy Three.js scene chunk; stale chunk pruning verified.
- `npm test`: 19 tests pass — eight-chapter boundary normalization, `heroPose` continuity at all four phase boundaries, clamp safety, forward/backward pose identity, deterministic handoff pose (rotation/camera/lens/light relationships), phase labels, progress bus detach/dispose, lifecycle scope cancellation, one-ticker Lenis/scene scheduling, variant lookup, same-Liquid product/sold-out deep-link rendering, homepage eight-chapter staging with honest asset tags, empty/fixture commerce routes, hero native add-to-cart wiring, image/model replacement of the hero concept art, and the magnetic interaction controller.
- `npm run validate`: 40 theme files pass structural checks, JSON schemas, section/snippet references, bundled chunks and the eight-chapter homepage order.
- `npm run theme:check`: Shopify CLI inspects 35 files with zero offenses (a `preload_tag` warning pair, one Liquid syntax typo and three missing translation keys were found and fixed during the build).
- `npm run theme:package`: packages `dist/stryde-m01.zip`; verified the zip contains the theme folders plus the two woff2 fonts (assets are flat per Shopify requirements).

Browser review (ZCode in-app Chromium, same-Liquid fixture preview):

- Desktop 1440×900: hero composition verified against the reference — gradient display type behind the floating product, elliptical stage ring with markers, left description, price/name row, capsule CTA, scroll cue. Scrub verified at multiple positions: type masks out in sequence, art scales to macro, ring rotates/fades, stage color resolves to the chapter-02 surface, commerce row exits; reverse wheel scrolling restored the exact initial state.
- All seven later chapters rendered and inspected: deconstruction (sticky macro crops + numbered list), materials panels, dark technology rows with outlined parallax word, pinned horizontal collection reel (track transform confirmed mid-pin: translateX(-165px) at ~40% travel; touch layouts keep native overflow scroll), featured split story, brand manifesto wall with outlined watermark, finale with gradient blend into the footer.
- Mobile 390×844: hero refit (display size corrected after the first pass clipped both lines), stacked commerce row, full-width CTA, full-screen italic mobile menu with Escape/link close.
- Fixed header: hides on scroll down, reveals on scroll up, solid blurred backdrop after 24px.
- Fixture commerce (`/?fixtures=1&variant=102`): hero shows selected price, title, availability, native add-to-cart (disabled by the preview harness) and details link.

Defects found and fixed during this QA pass:

1. The local preview engine lacked a `preload_tag` filter, rendering raw font URLs as page text — filter registered.
2. A closing-tag typo in the collection chapter broke Shopify Theme Check's Liquid parse — fixed.
3. Three translation keys removed during the copy rewrite were still referenced by the 404/cart templates — restored.
4. Chromium renders `background-clip: text` glyphs with the upright face at display sizes (verified by in-page probes: identical computed styles, gradient at 196px upright vs plain italic). Resolution: uppercase authored via Liquid `| upcase`, hero gradient lines obliqued via mask skew; true italic retained for plain-color headings.
5. The hero entrance timeline was created even when the visitor loaded mid-page; a paused `.from()` timeline applies hidden start states on creation and blanked the hero on restored/mobile-resize scroll positions. The timeline is now only created near the top.
6. Fonts initially lived in `assets/fonts/`; Shopify requires flat assets, so they moved to the assets root and the package was re-verified.
7. Mobile display type clipped both headline lines at 16.4vw — reduced to 13.8vw.

Not verified in this environment: `prefers-reduced-motion` and no-JS runtime behavior were reviewed structurally (CSS static-layout rules, JS motion guards, scene-import gating) but the in-app browser cannot emulate media preferences; a GLB round-trip (loader ran in M01 QA with a synthetic fixture) was not re-exercised; real Shopify store behavior, checkout, production FPS and the licensed model remain open. No deployment, publication or commit was performed.

---
# Milestone 01 verification record

2026-10-21. This record concerns the foundation, not a complete cinematic storefront.

- `npm run build`: pinned runtime dependencies bundled locally; Three.js/GLTFLoader split from the initial runtime.
- `npm test`: eleven tests pass after visual refinement. Covers normalized eight-chapter boundaries, deterministic reverse poses, observer cleanup, pending async resource cancellation, already-loaded resource cleanup, one-ticker attach/detach, variant ID lookup, sold-out deep-link/no-JS Liquid rendering, concept disclosure, native empty/fixture routes, real hero product title/selected-price/availability and image/model replacement of the concept.
- `npm run validate`: 31 theme files pass structural checks, JSON parsing, section schemas, snippet references, bundled chunks and milestone homepage scope.
- `npm run theme:check`: Shopify CLI inspects 28 files with zero offenses.
- `npm run theme:package`: builds, validates, checks and packages with Shopify CLI; output is `dist/stryde-m01.zip` and contains standard theme folders only.

Independent local browser checks used the same Liquid preview, with desktop, tablet and mobile captures. No horizontal overflow or browser page errors were observed. Header/mobile navigation and Escape close worked; collection, product, cart, search, page and 404 content rendered. Repeated Shopify section load/unload checks retained one active pin; reverse scrolling restored the original transform. No-JS sold-out selection remained disabled. Reduced motion displayed native fallback content without a canvas.

The optional scene loader was exercised using a deliberately synthetic single-triangle GLB intercepted in the test browser, outside the repository. This was a loader/lifecycle fixture, never merchandise. Relative URL loading, one-canvas ownership, actual `WEBGL_lose_context`, fallback visibility, `restoreContext` recovery, section-unload disposal and reduced-motion no-canvas remount were observed. This does not validate product geometry, visual fidelity, real model transfer/GPU budgets or production frame rate.

The independent design review passed M01 and requested two refinements: keep the preview notice clear of shopping controls, and move the asset caption clear of the oversized type. Both were corrected without changing the art direction. Preview is in-flow at the top; the frame caption occupies an unoccluded lower strip on desktop/tablet and its own top edge on mobile.

The subsequent sky-blue refinement replaces the initial palette/type/registration treatment with cyan/silver art direction and an original transparent concept sneaker. Header account access remains conditional on Shopify customer accounts. Preview disclosure occupies a measured in-flow 30px, included in viewport sizing. Concept image containment uses an absolute fitted image within the fixed scene host; its label remains in the shared fallback wrapper for proper GLB lifecycle hiding. Separate same-Liquid fixtures verify authentic-image precedence without pretending concept art is merchandise. See VISUAL-DIRECTION and ASSETS for audit, palette and generation provenance.

Final visual-refinement browser regression covered 1440×1000 desktop, 1366×768 laptop, 768×1024 tablet and 390×844 mobile. Full shoe, concept disclosure and shopping CTA fit the viewport; no horizontal overflow or browser page errors were observed. The shorter laptop composition was refined to separate story copy from the second headline, and disclosure text increased to 11px desktop/tablet and 10px mobile. The independent first review passed and identified those two refinements, which were applied and rechecked.

The refined theme also passed reverse-scroll restoration, five repeated section reloads without duplicate pins, reduced-motion fallback, sold-out product fixtures, no-JS variant behavior and native navigation checks. The synthetic intercepted GLB regression was repeated for relative URL resolution, context loss and restoration, fallback visibility and teardown disposal. These checks validate the retained infrastructure with fixtures; they do not establish real merchandise fidelity or store checkout behavior.

The independent second design review passed all four criteria with no material issues. Final browser checks confirmed the harness account notice responds successfully, the hero variant fixture uses the selected $195 price, sold-out status is retained, configured imagery removes the concept disclosure, the scroll-to-details anchor works and the collection CTA navigates correctly. All four reviewed viewport sizes retained visible shopping/disclosure controls and separated headline/story text.

Not tested: an authenticated Shopify store, live product availability, Shopify-generated form errors, actual filter provider/markets, discounts, taxes, shipping, real checkout, production model performance or the seven unimplemented cinematic chapters. A real store, licensed accurate models and final merchant content remain required. No deployment or publication occurred.

## Editorial refinement

The subsequent focused design audit is recorded in `DESIGN-AUDIT.md`. The approved blue/cyan identity, diagonal concept artwork and native commerce remain. Non-informative orbital elements, translucent disclosure styling, repeated rounded media/utility surfaces and vague placeholder slogans were removed. The visible headline now reads FOOTWEAR / IN FOCUS; the concept caption remains explicit and unboxed. The short reversible foundation pin is retained with less travel, and a short-height phone composition is provided. Product-card sold-out information now sits outside the aria-hidden media wrapper.

After these presentation changes, `npm run build`, all eleven foundation tests and Shopify Theme Check (28 files, zero offenses) passed. Native selected-variant pricing/availability, concept disclosure and real-image/model replacement tests remain in place. Updated browser screenshots and independent review are recorded separately once complete; no real-store or full-film claim follows from local fixture checks.

## Local development and final review

`npm run dev` was started and tested at `http://localhost:9292` without Shopify authentication. Actual browser saves and restores in CSS, source and asset JavaScript, a Liquid snippet and translation data automatically reloaded the page and rendered the changed values. Source JavaScript rebuilt before refresh. The three development tests cover serialized builds, failed-build recovery and filesystem/SSE integration. Together with the eleven foundation tests, all fourteen tests pass.

`npm run preview` was separately started on port 9294 and returned the same Liquid page without the development reload client. Build, 31-file structural validation and Shopify Theme Check (28 files, zero offenses) passed. Local POST commerce remains rejected with HTTP 405; fixtures and native Shopify form wiring are preserved.

Final Chromium review covered 1440×1000, 1366×768, 768×1024, 390×844 and 375×667. Shopping access, the full shoe and its plain concept disclosure remain visible, with no horizontal overflow or browser page errors. The redundant collection anchor/detail strip was removed, and a reserved caption band clears the shoe. Product, collection, cart and search layouts and forms were also checked on desktop and mobile. Independent final design review accepted the refinements with no material issues.

Reverse-scroll restoration, five repeated section reloads, runtime reduced-motion changes, sold-out/no-JS variant behavior and the synthetic GLB context-loss/recovery/disposal checks passed again. Screenshots are named `stryde-editorial-*.png` in the chat's visualization directory. These checks do not certify authentic merchandise rendering or connected-store checkout.

The first independent editorial review passed and identified two focused refinements: repeated collection navigation and caption/sole clearance at tablet and short-phone sizes. The center anchor and duplicate lower strip were removed; the primary hero and header shopping links remain. A 28px reserved caption band now separates the complete concept image from its plain disclosure across breakpoints. The image and caption remain in the same fallback wrapper. Build, eleven foundation tests and Theme Check were rerun successfully after those changes.

## Pass 8 — transparent renders, handoff and end-state life

Owner screenshots showed the re-rendered TN studies as opaque white rectangles
("cropped pictures"), a washed shoe with a ghost double during the hero→anatomy
handoff, and an empty dead finale stage. Root causes found and fixed:

- The 2800/1000 study renders were produced with an opaque white clear color.
  `tools/render-tn.mjs` now renders with `alpha: true` and a transparent clear;
  all twelve views were re-rendered and re-harvested (probe: shoe alpha occupies
  20–251 × 56–161 of a 280×210 sample, i.e. real transparent margins).
- `profileFootprint` in `src/scene-bridge.mjs` was re-measured for the new
  2800×2100 profile render (left 200, top 560, size 2320×1060 in render space).
- The bridge dissolve no longer crossfades two semi-transparent shoes: the
  static study snaps fully opaque at alignment completion (progress .8) and the
  live canvas then fades away on top of it. The deconstruction crop/annotation
  swaps are staggered (out completes before in starts), removing the double-shoe
  ghost mid-chapter.
- Materials panels now show full-shoe views (angle / profile / sole) at native
  fit with macro studies moved to the insets, and the study rail was moved clear
  of the fixed chapter numeral rail after it clipped at the viewport edge.
- Featured: the dark floor-smudge override was removed (studio radial retained,
  one soft contact ellipse), and an editable detail ledger (Label: Value rows)
  fills the right column.
- Hero: a time-based idle float/sway on the resting 3D model (amplitude dies as
  scrolling starts and during the handoff) plus a chapter-index ticker along the
  bottom edge (CSS marquee, reduced-motion guarded, fades on scroll, hidden on
  mobile).
- Finale: the monumental word is present as texture at pin arrival (no dead dark
  frame), the resting float gained a sway, the word drifts slowly at rest, and a
  pre-existing layout bug was fixed where the finale grid sized its implicit
  track to the action row's max-content and shoved the whole composition
  off-center (clipped on mobile).

Recovery note: OneDrive sync reverted ten files (all chapter sections,
signature.css, chapters.mjs, hero.mjs, refinement tests) to pre-phase-6 state
mid-session; they were restored from the last commit after marker audits
confirmed HEAD held the newer work. Verification screenshots (`p8-desktop-*`,
`p8-mobile-*`) were captured with stepped wheel scrolling so Lenis and pinned
scenes behave as for a real reader. `npm run build`, 56/56 tests, structural
validation (88 files) and Theme Check (one pre-existing orphaned-snippet
warning) pass. Not tested: connected-store checkout, real merchandise.
