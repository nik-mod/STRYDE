# Anti-template pass: verification

Date: 2026-10-22. Local Liquid preview; no connected Shopify store.

## Rendered review

All eight homepage chapters were freshly inspected at 1440 × 900, 768 × 1024, 390 × 844 and 375 × 667. Individual captures and contact sheets are in `.work/anti-template/after-*`. No horizontal document overflow was observed at the sampled chapter positions or on the catalog and product pages at these four sizes.

The existing diagonal Hero, macro Materials sequence, structured dark Technology chapter, view series, Featured composition and image-led Brand chapter remain distinct. The revised two-line Brand heading has no empty third row. Upright catalog and product typography retains merchant capitalization. The first native collection card starts at approximately 432px on the desktop fixture, about 100px earlier than the audited version.

## Navigation, scrolling and commerce

Forward chapter sweeps at all four sizes and reverse sweeps on desktop and small mobile restored visible content. Returning to the page start restored Hero description and commerce footer opacity to 1. Desktop retained five pin spacers; tablet retained four; phone layouts retained one. No duplicate model canvases were observed. These are visible-state checks, not frame-rate measurements.

The chapter index navigated to Technology and updated `aria-current`. The phone navigation opened, closed with Escape and returned focus to its summary control. Existing accessible control names and native form fields remain present.

Merchant fixtures used their supplied image in Hero, Collection, Featured and Finale, and the Hero edition showed `01` without the TN label. The small-phone merchant Hero description and footer did not overlap; after the entrance settled both were visible. The PDP retained `/cart/add`, variant IDs, quantity and add controls. Selecting variant 101 updated the displayed price from $195 to $180. The native listing read “1 product”; search read “1 result for ‘footwear’” with typographic double quotation marks in the actual UI. Ten disclosed concept studies remain isolated from native merchandise.

Local commerce is intentionally disabled. Checkout, inventory and Shopify server behavior were not tested.

## Accessibility fallback

A QA-only server rendered the actual Liquid and CSS with every script tag omitted. All eight chapter centers were inspected at all four sizes, with zero pin spacers, zero scripts, visible supporting copy and no horizontal document overflow. Evidence is in `.work/anti-template/static-*`.

The available browser API does not emulate the operating-system reduced-motion preference. Source review confirmed that the existing preference guard skips chapter motion and model loading and uses visible static layouts. The real no-JavaScript fallback was browser tested; native reduced-motion preference emulation was not performed.

## Automated checks

Build, all 48 tests, structural validation of 62 theme files, Shopify Theme Check of 40 files with no offenses, UTF-8 checks and `git diff --check` passed. Tests cover merchant media precedence, blank Brand lines, edition context, static catalog lifecycle cleanup, count pluralization, escaped search terms and the existing real-GSAP Hero takeover/reverse regression.

An independent design evaluator returned PASS with no blocking issues or priority fixes. That review used the current screenshots and source because browser access was unavailable in its agent session. The live browser checks above were performed by the primary reviewer. A different-provider evaluator was not available.

No dependencies, fonts, imagery, models, scroll controllers or canvases were added. No commit, push, merge, reset or deployment was performed.
