---
version: 1
slug: care-refinement
primary_target: independent/storefront/src/components/CareNavigation.tsx
related_targets: ["independent/design/assets/care-refinement.css", "independent/storefront/src/components/CustomerPage.tsx", "independent/storefront/src/app/pages/contact/page.tsx", "independent/storefront/src/app/policies/[handle]/page.tsx"]
---
# Customer care and policy refinement
Mode: Operate / Read. User requested better UI for the eight customer-care and policy destinations in their footer screenshot. Preserve factual content, service availability, form behavior and STRYDE identity. This is an extension, not a new visual world.
## Direction contract
THESIS: Make help and policies feel like a considered part of the store, with quick navigation and a readable task area.
OWN-WORLD: Existing Archivo, ice, shipping blue, navy and cobalt. Clear text hierarchy, ruled content and square form controls. Contact preserves its dark chapter identity.
STORY: Reach the right page, recognize the current destination, read or complete the task, and reach related help without returning to the footer.
FIRST VIEWPORT: Desktop eight-link directory, split title/introduction and purpose-specific content. FAQ has a dark topic rail; policies have a dark sticky index and a clear reading column. Phones replace the directory with a labelled native selector and stack content without overflow.
FORM: Code-led refinement of the existing shopping and information identity, authorized by the user's UI request. seed: none (existing world). No new assets or invented policies.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
Verification: all eight destinations at 1440, 900 and 390px; native FAQ expansion; mobile page selector; existing form states preserved. No backend changes.

## Documentation evidence — 6 November 2026

This ordinary surface extension agrees with the incumbent Archivo, ice/navy/cobalt, square-control and ruled-content system. `care-refinement.css` reuses shopping/customer-care colors and information-page emphasis; its dark FAQ/topic and policy rails extend the existing fit/tracking/contact tonal treatment. `CareNavigation` supplies the same eight destinations through grouped desktop links with current-page state and a labelled native phone selector. `CustomerPage`, contact and policy templates share that directory; policies retain the existing preparation notice and approved source content, while contact retains its existing form component and readiness state.

`PRODUCT.md`, root `DESIGN.md` and `.impeccable/design.json` are preserved. The route directory, reading-column spacing, responsive rails and form surround are local composition decisions, not new global tokens or a new visual world. No new raster assets were introduced, so no shipping-image provenance entries are needed.

The final verification set in `.impeccable/review/care/` contains 27 regenerated PNG captures: all eight routes at 1440, 900 and 390px, plus settled FAQ-open states at those widths. Its `checks.json` records no route overflow or browser errors and passed mobile-selector/FAQ interactions. `accessibility-checks.json` records cyan focus outlines on the dark contact, FAQ, policy and tracking surfaces, and the full provisional-size warning outside the table scroller at approximately 343px wide on a 390px viewport. The size-guide template preserves the exact warning text, associates it with the table through `aria-describedby`, and retains a screen-reader caption. The implementation run reports TypeScript and 30 existing tests passing.

The independent finish reviewer reports **ship**, with all three findings resolved: dark-surface focus visibility, the complete size warning outside the scroller, and settled mobile FAQ-expanded evidence. This is the reported independent review disposition. These checks do not establish live service delivery, physical-device behavior or commercial-policy approval.
