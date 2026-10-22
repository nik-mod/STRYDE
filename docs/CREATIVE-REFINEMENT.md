# STRYDE creative depth refinement

## Five findings from the rendered experience

The baseline audit and captures live in `.work/creative-depth/`. All eight chapters, the motion controllers, image assets, Liquid product bindings and phone layouts were inspected before this pass. No website screen recording was supplied. The reference video frames are a model rotation, not evidence of website behavior.

1. Materials used complete angle/profile/sole views with small scale changes. Its broad frames and detached copy did not establish a close examination of physical details.
2. Technology depended on an outlined word and three rows. Without a product image, the dark field became a long, under-composed interval.
3. Collection repeatedly presented the same TN at similar scale. The available original STRYDE assets also depict one concept from different angles; presenting them as different saleable products would fabricate variety.
4. Brand introduced isolated lines before its manifesto appeared. Its typography-only stage and extra pin duration left the identity dependent on empty space.
5. Hero removed both display lines, supporting copy and shopping context before the handoff. Several pinned chapters consumed more scrolling than their visual progression justified.

## Composition and choreography

Archivo remains the only type family. The earlier navigation, supporting typography and header icon refinements are preserved. Tablet navigation now uses the existing menu pattern through 900px to keep the wordmark and controls clear.

Anatomy uses a compact engineering heading, closer introduction/list relationship and a larger adjacent product stage. The sticky image begins beside the introductory composition rather than below a large detached header.

Materials is a three-subject macro journey: the blue upper from the detail render, the cage/midsole from a tightly cropped profile, and the tread/arch from the sole render. Its image occupies approximately three fifths of the desktop stage. The heading becomes a compact preface; the detail title and short observation sit directly beside each subject. The frame owns its reveal mask and the image owns its scale and pan. The outgoing image stays behind the incoming wipe; the incoming copy has an opaque surface to prevent overlapping text. The first subject is visible at rest. Touch layouts flow through separate macro panels with local scrub motion.

Technology pairs a large primary profile with compact, structured rows in the dark ocean field. A merchant editorial image takes precedence, followed by the selected product photograph. A selected product without a photograph shows an honest pending state instead of a concept substitute. Without merchandise, the configured TN or original concept fallback remains explicitly disclosed. Default copy describes visual relationships rather than unverified performance claims.

Collection remains an honestly titled view series until a merchant binds a collection. Image and index scale vary within the exhibition composition; pins are shorter and the final view persists into the handoff. Real collection products retain their own titles, images, prices, availability and links. Standalone scene image pickers never replace actual product photographs.

Featured becomes a calm, larger image beside restrained typography. The rotating frame treatment is removed; its native product form is unchanged.

Brand adds an image-led split composition alongside the three editable lines and manifesto. The complete editorial is visible on entrance. A shallow image mask, close crop and variable weight progression create the visual event. The short desktop pin becomes a flowing layout on phones. The campaign image picker replaces the disclosed TN detail or original concept fallback, retaining merchant image alt text.

Hero travel is shorter and retains the second display line, description and shopping context through the model handoff. Scroll tweens use canonical initial values, and the first positive scroll settles the entrance and renders the current scrub position again; this prevents a fast early exit from preserving the entrance's hidden copy state when reversing. The Three.js model pose/camera contracts remain intact. Finale gives the profile render greater importance, reduces title scale and introduces commerce earlier. Its desktop pin is shorter; its phone composition flows without pinning. The glow layer is removed.

## Commercial and accessibility boundaries

All eight sections, existing Shopify forms, route bindings, variants, lifecycle cleanup, GSAP contexts, Lenis and the shared ticker remain. There are no new dependencies, remote fonts or outside images. Image pickers and merchant text remain configurable; bundled model/concept studies retain disclosure. Merchant detail photographs start at their authored static crop, with a small overscan only during motion to support edge-safe panning.

The source has visible static layouts when JavaScript or motion is unavailable. Reduced-motion contexts skip motion controllers and pins. The implementation does not claim that raster crops are interactive 3D, and the fused model is not exploded. Existing render resolution and the absence of approved campaign photography limit how close the imagery can move before it softens. Actual product variety depends on an assigned Shopify collection.

## Validation

After implementation, `npm run build`, `npm test` (43 tests), `npm run validate` and `npm run theme:check` passed. Theme Check inspected 40 files with no offenses. The new Liquid regressions cover image precedence, missing product photographs across all commerce chapters, fallback disclosure, merchant crop isolation and escaping. A real-GSAP regression verifies that an early entrance interruption, fast exit and reverse restore the Hero's canonical copy, footer and image states. Browser verification and final capture results are recorded separately by the reviewing agent; native operating-system reduced-motion emulation is not claimed by these automated checks.

Final browser results and limitations: [Creative refinement QA](CREATIVE-REFINEMENT-QA.md).
