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

## Milestone 02 editorial audit

| Observed issue | Change | Reason |
| --- | --- | --- |
| Placeholder labels (Design study, Shape / Texture / Proportion, Footwear study, Real product not selected, Temporary concept visual · Not actual merchandise) read as legal disclaimers. | Replaced with art-directed copy; temporary assets identified by small uppercase Concept artwork tags in the hero info block and on image frames only. | The disclosure remains honest without dominating the interface. |
| Hero composition placed the product right of center with excess empty space. | Full-viewport stage: product dominates the center, display type runs behind it, description left, price/name bottom-left, capsule CTA bottom-right, thin stage ring grounding the shoe. | Matches the reference spatial logic as an original STRYDE interpretation. |
| Generic Helvetica fallback typography. | Bundled Archivo variable (OFL) with weight/width axes; 830–880 weight, 108–118% width display compositions; uppercase authored in Liquid; hero gradient lines obliqued via mask skew due to a verified Chromium background-clip face-substitution bug. | Deliberate, reproducible typography instead of system defaults. |
| Small visually weak navigation. | Fixed header: 900-weight italic wordmark, underline-slide nav links, balanced icon row, scroll-responsive hide/reveal with a blurred solid backdrop, full-screen italic mobile menu. | Navigation reads as part of the composition and adapts to scroll state. |
| Flat blue rectangle background. | Restrained radial atmosphere on the hero (one light, one shade), deliberate chapter palette with shared fields and two intentional dark cuts, gradient finale blending into the footer. | Depth without decorative glow. |
| Short M01 scrub with pinSpacing:false and little narrative. | Five-phase pinned hero (depth/transform/macro/handoff/rest) with masked type exits, product scale choreography, ring motion and a deterministic handoff pose; seven further chapters with authored ScrollTrigger choreography. | The scroll now advances a continuous cinematic sequence and reverses it deterministically. |
| A flat concept image risked being presented as 3D. | The image path performs planar motion only (scale/translate/rotate of the frame); real rotation, dolly, lens and lighting remain exclusively on the GLB rig, driven by the same heroPose contract. | No simulated 3D anywhere. |

Retained: the sky/cyan/silver palette, native commerce (hero/featured/finale now render native Shopify product forms), lifecycle idempotency, reduced-motion and no-JS alternatives, honest empty states. Verification for this iteration is recorded in QA.md.

## Milestone 02.5 editorial audit

| Observed issue | Change | Reason |
| --- | --- | --- |
| Sections felt visually disconnected. | Deliberate boundary system: scrubbed clip-path wipes for technology/collection/brand/finale, content arrivals for shared-field chapters, hero color scrub retained. | The next composition now enters over or through the previous one; reversibility verified. |
| Oversized italic typography repeated in every section. | Per-chapter compositions: engineering (deconstruction), light editorial (materials), word-masked technical (technology), exhibition indexing (collection), asymmetric campaign (featured), quiet/loud manifesto with weight-axis modulation (brand), staged minimal finale. | One type system, eight distinct voices. |
| Material exploration lacked depth and motion. | Pinned desktop macro journey: phases crossfade with scale/depth, captions stagger, living-macro drift on crops. | Reads as a product exploration, not a static gallery. |
| Technology depended on static typography. | Word-mask heading, scroll-drawn spine line, row slide-ins, variable-weight outlined word parallax. | Structured technical hierarchy with authored motion. |
| Collection needed stronger spatial transitions. | Wipe entrance plus per-card recessed-arrival depth driven by the horizontal tween (containerAnimation) and oversized index numerals. | Spatial, exhibition-style reel without breaking the pin math or product links. |
| Brand lacked campaign composition. | Pinned stage: drawn rule, outlined watermark, quiet/loud manifesto contrast with scroll-modulated weight axes (genuine variable-font animation). | Editorial campaign feel with expressive, still-accessible type. |
| Finale felt like an ordinary product section. | Pinned cinematic staging: spotlight bloom, floor line, product rise, weight-modulated masked heading, commerce rising last, gradient into the footer. The staging is the entry point for the future shoebox GLB sequence. | A real conclusion with purchase focus; no fake 3D reveal. |
| Pointer interaction risked overwriting the scroll base pose. | Dedicated depth wrapper (damped quickTo offsets) plus a counter-moving type layer; scrub timeline owns its own transform properties exclusively. | Soda-style layered composition without transform ownership conflicts. |
| No product/environment seam for future switching. | data-env chapter registry, html-level active environment, scene lighting presets eased per chapter when the hero pose is not the owner. | Deterministic, data-driven preparation; no invented products or inventory. |

Retained: native commerce (hero/featured/finale forms), lifecycle idempotency, reduced-motion and no-JS static alternatives, honest empty states, one Lenis, one GSAP ticker, one WebGL canvas. Verification in QA.md.
