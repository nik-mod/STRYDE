# STRYDE visual recovery verification

Verified 23 October 2026 against the running same-Liquid preview at `http://localhost:9292/`. Evidence is in [the recovery folder](../.work/recovery/). This record distinguishes visual observations from automated checks.

## Fourteen issue results

“Resolved” below describes the inspected bundled TN experience, not an assertion that every possible merchant image or model will share its art direction. Before/after filenames are relative to `.work/recovery/`.

| # | Original defect | Implemented correction and observed result | Status / browser evidence |
|---|---|---|---|
| 1 | Oversized Hero words collided with the shoe and pushed supporting copy out of balance. | Protected type column, larger separate product field; stacked portrait tablet and phone compositions. | Resolved: `before-1440-hero-0.png` → `after-1440-hero-0.png`; `after-768-hero-0.png`, `after-390-hero-0.png`. |
| 2 | Scrubbed Hero left fragments of masked type; reverse could restore the wrong background. | Whole readable words, canonical background endpoints, stable commerce until its exit. | Resolved: Hero 0/25/50/75/100 in all five after sets; extra `after-390-hero-check-40.png`, `-50.png`, `-60.png`; fast-reverse records. |
| 3 | Hero released into an unrelated Anatomy image. | The existing single canvas moves and turns into the measured incoming profile footprint, then dissolves into its static render. Reverse restores canvas ownership. | Resolved for bundled TN desktop/tablet: `after-1440-handoff-{25,50,75,95,100,110}.png`, `after-768-handoff-{0,25,50,75,100}.png`. Phone and merchant-model modes retain a static handoff. |
| 4 | Anatomy heading, list and small image did not form a hierarchy. | Grouped introduction and observations; larger profile alongside them on desktop, above a two-column tablet list, stacked on phones. | Resolved: `before-1440-deconstruction-0.png` → `after-1440-deconstruction-0.png`; `after-768-deconstruction-0.png`, `after-390-deconstruction-25.png`. |
| 5 | Anatomy had excessive whitespace and awkward offsets. | Removed negative-offset compensation, tightened section geometry and observation spacing. | Resolved: Anatomy five-state sets at 1440/1366/768/390/375. Phones deliberately flow through the longer observation list. |
| 6 | Extreme macro crops obscured which component was being inspected. | Moderate source-specific crops retain upper, cage/midsole and dark tread landmarks. | Resolved: Materials 0/50/100 on desktop/tablet; `after-390-materials-subject-{3,4,5}.png` and matching 375 subject captures. |
| 7 | Material captions felt detached from the images. | Tight side caption on desktop, wide frame and caption strip on portrait tablet, immediately following captions on phones. | Resolved: `before-1440-materials-50.png` → `after-1440-materials-50.png`; `after-768-materials-50.png`, `after-375-materials-50.png`. |
| 8 | Material changes felt discontinuous and could lose readable captions. | Scrubbed frame wipe, controlled image motion and atomic caption ownership after the incoming landmark establishes. | Resolved: `after-1440-materials-wipe-{29,33,38,63,68,72}.png`, `after-1440-materials-wipes.json`; real-GSAP forward/reverse regression. Flowing phone panels preserve readability. |
| 9 | Technology approached as an empty dark field with competing masks. | Removed whole-section wipe; large low profile and readable observations share a compact composition. | Resolved: `before-1440-technology-50.png` → `after-1440-technology-50.png`; 768/390 Technology 50% captures. No technical specifications invented. |
| 10 | Collection repeated similar product presentations and long holds. | Distinct diagonal, heel and top-view arrangements with shorter desktop timing; explicitly three views of one study. | Resolved: Collection five-state sets; `after-390-collection-subject-{8,10,12}.png`, tablet subject captures. Native collection fixture takes precedence. |
| 11 | Featured image, title and action appeared disconnected. | Tighter image/copy ratio and spacing; readable model disclosure with an opaque backing. | Resolved: `before-1440-featured-50.png` → `after-1440-featured-50.png`; final Featured sets across all sizes. Native forms unchanged. |
| 12 | Brand copy and image had weak alignment and incompatible transform baselines. | Shared editorial alignment and one defined crop baseline; image and type stay together in portrait flow. | Resolved: `before-1440-brand-50.png` → `after-1440-brand-50.png`; `after-390-brand-50.png`. |
| 13 | Finale shoe was especially small at laptop width. | Removed legacy laptop cap; large centered product with height-aware sizing and a complete phone silhouette. | Resolved: `before-1366-finale-100.png` → `after-1366-finale-100.png`; `after-375-finale-100.png`, final 390 Finale set. |
| 14 | Finale had no clear reveal resolution; portrait controls could remain unreachable. | Staged product scale, whole title, context then controls; clamped flow endpoint on phones and portrait tablets. | Resolved: all five Finale progress sets reach at least .998; tablet/390 reach 1. Laptop buttons are complete with about 28px below them. |

## Browser coverage

All eight chapters were captured at actual existing ScrollTrigger progress 0/.25/.5/.75/1 at these DOM viewport sizes:

| Viewport | Captured states | Largest progress error | Horizontal overflow |
|---|---:|---:|---|
| 1440 × 900 | 40 | .00219 | None |
| 1366 × 768 | 40 | .00326 | None |
| 768 × 1024 | 40 | .00326 | None |
| 390 × 844 | 40 | .00067 | None |
| 375 × 667 | 40 | .00242 | None |

The progress reader is hidden and restricted to `body[data-local-preview]` plus `?inspect=1`. It reads real trigger start/end/progress through the existing scheduler; it does not create another animation controller. In flowing phone sections, “chapter progress” includes approach and departure, so adjacent chapters can share a screenshot. Additional subject captures cover all three Materials and Collection views rather than assuming the first trigger covers the entire flowing section.

Forward sequences, large fast scrolls and reverse restoration were exercised across the five sizes. At the top, the blue Hero returns, the handoff overlay is absent and there is one canvas. Desktop/tablet bridge cleanup was also checked after landing. Sources, regression tests and captures cover reverse caption ownership and interrupted Hero entrance restoration.

The browser screenshot service returns slightly scaled image files: 1416×885, 1339×753, 753×1004, 375×812 and 360×640 respectively. The DOM viewport dimensions above were independently recorded for every state. Images were inspected at their returned native resolution; contact sheets are only an index. `verification-summary.json` checks the 200 records, dimensions/aspect and overflow. Complete before sets exist for 1440, 1366 and 390; the before tablet set is partial. No complete 375 before set is claimed.

Static no-JavaScript output was rendered at all five sizes: eight chapters, no hidden sampled headings/captions/actions, and no horizontal overflow. See `fallback-results.json` and `fallback-*-full.png`. This is a no-JavaScript check, not OS reduced-motion emulation. The browser did not expose OS reduced-motion emulation, so that preference was not visually verified; existing reduced-motion guards remain in source.

## Commerce and automated checks

Browser checks at 375px covered the disclosed ten-study local concept index, native fixture collection replacement, native product variant selection, sold-out deep link, price/URL updates and `POST /cart/add` variant binding. The homepage fixture image replaces the bundled shoe artwork. The native product page had no horizontal overflow and no captured console errors. Commerce is intentionally disabled in the local preview; no live transaction or connected Shopify checkout was tested.

- `npm run build`: passed after the last source change.
- `npm test`: **56/56 passed**, including real-GSAP caption ownership, interrupted Hero/reverse state, one-canvas landing and native commerce/merchant-precedence regressions.
- `npm run validate`: **63 theme files validated**.
- `npm run theme:check`: **40 files, no offenses**.
- `git diff --check`: passed.

Independent design evaluation returned NEEDS REVISION in round 1 and PASS in round 2 after the disclosure/caption fixes. It used a separate agent from the available OpenAI provider, not a different model provider. Root did not read its evaluation report. This evaluation supplements the root browser review; it does not establish live Shopify behavior.

## Evidence and limits

Quick comparisons: `comparison-hero.jpg`, `comparison-deconstruction.jpg`, `comparison-materials.jpg`, `comparison-finale.jpg`. Full-size screenshots use `before-{width}-{chapter}-{percent}.png` and `after-{width}-{chapter}-{percent}.png`; per-chapter JSON records identify actual progress. `after-{width}-sequences.jpg` indexes all 40 captures for each viewport.

Remaining visual limits: supplied model renders are still model renders rather than commissioned product photography; the 3D-to-image landing has a short lighting/material dissolve. The mobile experience uses deliberate static image flow rather than the desktop camera bridge. Merchant asset combinations retain their editable workflows and data precedence but were not exhaustively art-directed. No unresolved defect from the inspected 14-item list is being hidden behind automated test results.

Existing shared work was preserved. The original dirty baseline was saved as `baseline.patch` and `baseline-status.txt`, with a frozen pre-recovery theme in `before-theme/`. The user/collaborator's later `22a6593 UI` checkpoint was retained. No reset, clean, merge, commit, push or deployment was performed by this recovery agent. Shopify Liquid, GSAP, Lenis, the existing Three.js renderer and native commerce architecture remain; no dependencies were added.
