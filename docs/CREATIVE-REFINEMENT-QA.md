# Creative refinement — browser verification

Date: 2026-10-22. Local Liquid preview, not a connected Shopify store.

## Scope and evidence

All eight chapters were inspected at entrance, middle and exit at the four requested viewport sizes. Captures, contact sheets and position/overflow records are in `.work/creative-depth/`. The folder also preserves the pre-implementation audit and baseline images. A browser's final scroll position clamps at the page bottom, so Finale exit captures include the footer instead of attempting an unreachable scroll offset.

| Viewport | Eight-chapter review | Horizontal overflow | Outcome |
| --- | --- | --- | --- |
| 1440 × 900 | Entrance / middle / exit | None observed | Pass |
| 768 × 1024 | Entrance / middle / exit | None observed | Pass |
| 390 × 844 | Entrance / middle / exit | None observed | Pass |
| 375 × 667 | Entrance / middle / exit | None observed | Pass |

Affected compositions were checked again after fixes. The Materials caption remains readable during its image wipe. The incoming Collection product is established before pinning. Technology reveals its heading earlier. Brand's phone disclosure and text have a clean gap. Featured's known model render occupies more of its frame; merchant photos retain their original treatment.

## Scroll and lifecycle checks

Forward and reverse sweeps sampled all eight chapter centers on desktop. Materials restored the expected subject/caption; Collection restored the expected view; Hero copy and controls restored. The DOM retained five desktop pin spacers and one model canvas. Phone layouts used one Hero pin, with Brand, Collection and Finale in normal flow.

An immediate six-page jump during the opening animation reached scroll position 7962, then a native return-to-top restored scroll position 0, Hero copy opacity 1 and footer opacity 1. The phone version also restored these states. Slow/local steps and larger jumps were reviewed during the chapter sweeps. These checks establish visible state restoration, not a measured frame-rate guarantee.

A new test uses real GSAP timelines to reproduce the early-intro takeover and reverse. It passes with the fix and was checked against the previous Hero implementation, where it fails.

## Static accessibility fallback

A temporary QA-only server rendered the same Liquid and production CSS with script tags removed. All eight chapter centers were inspected at all four sizes: zero pin spacers, no hidden Materials/Brand/Finale copy, and no horizontal overflow. This verifies the real no-JavaScript layout.

The available browser API does not emulate the operating-system reduced-motion preference. That mode was reviewed in source: the existing preference guard skips motion controllers/model loading and uses the visible static layouts. Native reduced-motion browser emulation was not performed and is not reported as a browser pass.

## Commerce checks

The actual product fixture query `/?fixtures=1&image=1&variant=102` retained native `/cart/add` forms and used the fixture image in Hero, Collection, Featured and Finale. The 375 × 667 Hero fixture was rechecked after fixing the taller footer and nested grid sizing: image bottom 401.1px; description top 410.9px / bottom 476.1px; commerce footer top 489.1px / bottom 648.2px, within the 667px viewport. Description and footer opacity were both 1.

Liquid regressions cover merchant image overrides, product image precedence, absent photographs, optional concept labels, escaped content, and image/model overrides. Actual Shopify checkout, inventory and server behavior remain untested because local commerce is deliberately disabled.

## Final checks

`npm run build`, `npm test` (43 passing tests), `npm run validate`, `npm run theme:check` (40 files, no offenses) and `git diff --check` passed. The independent design evaluation passed after the entrance, caption, spacing and Hero state fixes.

No new dependencies or external imagery were added. No commit, push, merge, reset or deployment was performed. Actual product variety still requires merchant-selected products; the default Collection remains a disclosed, honestly titled view series. Macro fidelity is limited by the available model renders rather than invented surface detail.
