# STRYDE — editorial refinement audit

This audit concerns concrete elements in the existing Milestone 01 theme. It is not a claim that taste can be objectively certified or that the eight-scene experience is complete.

| Observed issue | Focused change | Reason |
| --- | --- | --- |
| Ellipse, two floating markers and animated orbital rotation had no product meaning. | Removed their markup, CSS and GSAP tracks. | The sneaker and typography carry the composition; the remaining reversible layers establish depth without a decorative moving system. |
| Concept disclosure was contained in a translucent rounded badge. | Plain 11px editorial caption, still inside the fallback figure. | The disclosure is readable information, not a product feature or promotional badge. It remains attached to the artwork and hides with the GLB fallback. |
| Rounded image surfaces, filter panels, inputs, page buttons and pagination repeated one pill language. | Matte square image planes, crisp form/filter controls, restrained text utilities and one capsule family for the hero's primary action. | Shapes distinguish shopping access from supporting tools. Native controls remain comfortable and focusable. |
| Aspirational copy repeated movement/perspective language without saying what the page showed. | FOOTWEAR / IN FOCUS, descriptive upper-to-sole study copy and direct empty-state text. | The words describe the visible object; no performance, launch, inventory or engineering claims are invented. |
| A chapter count suggested eight live scenes when only one foundation exists. | Removed the visible 01/08 counter. | The eight-chapter contract remains in code and documentation without implying the complete film has shipped. |
| Broad pin travel created a quiet blank interval after the initial view. | Reduced travel to 16svh desktop and 8svh mobile; preserved a full-height stage, short reversible scrub and native reduced-motion/no-JS alternatives. | The scroll distance is proportional to the work implemented in M01. |
| Footer reserved grid positions for links even when none were configured. | Render the navigation only when real links exist; a compact brand/links/legal-and-top composition adapts to available content. | Removes unused structural space and keeps actual merchant policy links. |
| Sold-out cards placed their status in an aria-hidden image wrapper. | Move the plain availability text below title/price, outside that wrapper. | Availability remains visible to assistive technology and no longer needs an image badge. |
| Default Discover navigation duplicated search behind a vague label; the wordmark carried an unconfigured registration symbol. | One native Collection navigation link, explicit search utility/mobile search entry, unchanged account/bag routes; remove the registration mark. | Utility labels and brand presentation stay credible and direct. |
| A central collection anchor led to a strip repeating the primary shopping link. | Remove both the anchor and duplicate strip; use a two-column identity/primary-action row. | Direct shopping remains available from the hero and header without a redundant intermediate destination. |
| Plain concept disclosure could intersect the sole at tablet and short-phone sizes. | Reserve a 28px caption band in the fallback figure; the fitted artwork ends above it and the 11px caption stays at its bottom edge. | Preserves the complete shoe and leaves at least an approximately 10px reading gap without adding a badge or breaking GLB fallback ownership. |

## Retained deliberately

The approved sky-blue/cyan/silver palette, monumental italic grotesk and original diagonal concept sneaker remain. The composition uses a consistent 5% page grid, large type behind the shoe, asymmetrical supporting copy and direct product/collection access. The concept artwork is still clearly temporary and is never presented as authentic inventory. Real merchant imagery, GLB, product title, selected variant price and availability retain precedence.

No new artwork or dependencies were required. Native Liquid forms, product/collection/cart/search behavior, pagination/filter wiring, accessible semantics, section lifecycle, reduced motion, GLB loading/disposal and all future chapter contracts were preserved. This iteration adjusts presentation and literal copy only; the development workflow is documented separately.

## Verification scope

The existing foundation tests cover data honesty and commerce branches; expected empty-state copy was updated. Browser review must check the new headline length, short laptop/mobile composition, plain caption readability, real-image/GLB precedence, forward/reverse scrub and section remounts. Actual Shopify checkout and real merchandise/model performance still require a connected store and licensed assets.
