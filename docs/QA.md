# Collection gallery refinement record

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
