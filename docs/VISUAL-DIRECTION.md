# STRYDE — visual direction

## Audit and scope

The Milestone 02.5 direction supersedes the M01 editorial treatment and refines Milestone 02. The Shopify OS 2.0 theme structure, Liquid commerce, variant selection, native forms, lifecycle cancellation, reduced motion, model loading and eight-chapter state contracts remain intact. Placeholder-label language ("Design study", "Shape / Texture / Proportion", "Footwear study", "Real product not selected") is gone; temporary assets are identified by small editorial tags only.

## Art direction

Sky blue `#41b4f0`, electric cyan `#adfff5`, silver white `#effaff`, ocean ink `#073653`, deep ocean `#06283f` and display mint `#c1fff8`. These colors are merchant-configurable. Ocean ink on sky blue has approximately 5.4:1 contrast; the deep-ocean chapters use silver-white text. The large cyan/white gradient display type is a decorative layer with an equivalent semantic heading exposed to assistive technology.

The type system is **Archivo** (variable, SIL OFL, bundled locally — `docs/ARCHIVO-OFL.txt`), composed per chapter rather than repeated: monumental oblique gradient display for the hero (BUILT FOR / VELOCITY), condensed engineering headings with tabular numerals for deconstruction, light-weight editorial display for materials, word-masked technical type with a drawn spine for technology, exhibition indexing with oversized numerals for the collection, an asymmetric rotated-frame campaign story for featured, quiet/loud manifesto contrast with scroll-modulated weight axes for brand (FORM / follows / forward.), and a minimal staged purchase reveal for the finale. Uppercase is authored in Liquid (`| upcase`) and the hero's gradient lines synthesize their oblique via a mask skew — both decisions work around Chromium dropping the italic face when `background-clip: text` rasterizes large glyphs (plain-color italic headings use the true italic face).

The hero composition follows the supplied reference's spatial logic — monumental type behind a floating product, description left, price/name bottom-left, capsule CTA bottom-right, thin elliptical stage ring with two markers grounding the shoe — as an original STRYDE interpretation. The reference's logo, brand name and sneaker artwork are not copied. GRIDO1 and Soda informed interaction techniques only (stacked boundaries, variable-axis choreography, pointer-responsive depth); neither identity is imported. There are no badges, pills, orbital systems, glow fields, debug panels or placeholder labels; every visible component has an editorial or commercial purpose.

The centered shoe is a transparent, original AI concept cutout, identified by small uppercase `Concept artwork` tags (hero footer kicker and image-frame tags) rather than disclaimer boxes. Configured merchant image and actual GLB take precedence and remove the tags. No image spin or simulated exploded view is applied anywhere. Product title, selected price, availability and detail links come from the actual selected Shopify product; without one, the hero shows the editable concept name and a collection CTA — never a fabricated price.

## Chapter palette map

| Chapter | Visual world | Boundary treatment |
| --- | --- | --- |
| 01 Hero | Bright sky blue, cyan/white gradient headline, silver/ice product | Stage color scrubs to silver-white |
| 02 Deconstruction | Silver-white field, ocean annotation, macro crops | Arrives by content choreography |
| 03 Materials | Silver-white with paper-blue macro frames | Arrives by content choreography; pins as a stage on desktop |
| 04 Technology | Deep ocean with cyan/silver detail and outlined display | Wipes up over materials |
| 05 Collection | Sky blue product reel with index numerals | Wipes up over technology |
| 06 Featured | Silver-white asymmetric campaign story | Arrives by content choreography |
| 07 Brand | Sky blue manifesto stage with outlined watermark | Wipes up over featured |
| 08 Finale | Deep ocean staging resolving through a gradient into the footer surface | Wipes up over brand; blends into the footer |

Deliberate hard wipes separate the dark chapters; shared fields connect the light ones; the hero→deconstruction boundary is a continuous color scrub. The camera/object contracts in ARCHITECTURE remain authoritative for the eventual GLB choreography.
