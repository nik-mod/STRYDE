---
name: STRYDE
description: A continuous sneaker product film in blue, white, ice and ocean.
colors:
  film-blue: "#b9dced"
  film-cobalt: "#265fbd"
  film-ice: "#eef5f7"
  materials-blue: "#bfdfea"
  ocean: "#092e46"
  ocean-deep: "#061e30"
  ink: "#102b3b"
  paper: "#b7ddef"
  surface: "#f2f5f4"
  accent: "#dcf3fa"
  action-text: "#f3f7f8"
  action-hover: "#256580"
  finale-action: "#e4f2f8"
  film-rule: "color-mix(in srgb, var(--ink) 24%, transparent)"
typography:
  display:
    fontFamily: 'Archivo, "Helvetica Neue", Helvetica, Arial, sans-serif'
    fontSize: "clamp(64px, 8.4vw, 220px)"
    fontWeight: 900
    lineHeight: 0.79
    letterSpacing: "-0.04em"
    fontVariation: "'wght' 900, 'wdth' 76"
  display-secondary:
    fontFamily: 'Archivo, "Helvetica Neue", Helvetica, Arial, sans-serif'
    fontSize: "clamp(64px, 8.4vw, 220px)"
    lineHeight: 0.79
    letterSpacing: "-0.04em"
    fontVariation: "'wght' 720, 'wdth' 82"
  headline:
    fontFamily: 'Archivo, "Helvetica Neue", Helvetica, Arial, sans-serif'
    fontSize: "clamp(40px, 4.1vw, 100px)"
    fontWeight: 650
    lineHeight: 0.98
    letterSpacing: "-0.035em"
  title:
    fontFamily: 'Archivo, "Helvetica Neue", Helvetica, Arial, sans-serif'
    fontSize: "clamp(32px, 3.1vw, 76px)"
    fontWeight: 600
    lineHeight: 1.01
    letterSpacing: "-0.035em"
  body:
    fontFamily: 'Archivo, "Helvetica Neue", Helvetica, Arial, sans-serif'
    fontSize: "clamp(16px, 1.17vw, 26px)"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: 'Archivo, "Helvetica Neue", Helvetica, Arial, sans-serif'
    fontSize: "clamp(11px, 0.8vw, 17px)"
    letterSpacing: "0.13em"
rounded:
  square: "0px"
  action: "2px"
spacing:
  gutter: "clamp(24px, 4.5vw, 128px)"
  chapter: "clamp(64px, 6vw, 160px)"
  detail-gap: "8px"
  ledger-gap: "18px 32px"
  action-gap: "28px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.action-text}"
    rounded: "{rounded.action}"
    padding: "17px 28px"
  button-primary-hover:
    backgroundColor: "{colors.action-hover}"
    textColor: "white"
  button-finale:
    backgroundColor: "{colors.finale-action}"
    textColor: "{colors.ink}"
    rounded: "{rounded.action}"
    padding: "17px 28px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.surface}"
    rounded: "{rounded.action}"
    padding: "17px 28px"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "10px 14px"
  specification-chip:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.action}"
    padding: "9px 12px"
  study-navigation:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "16px 18px"
  product-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
---

# Design System: STRYDE

## Overview

**Creative North Star: "The Continuous Product Film"**

STRYDE combines a blue-and-white sneaker study with monumental editorial typography. Pale sky and ice fields give the subject room; ocean chapters concentrate attention. A locally bundled variable Archivo family shifts width and weight between expressive headlines and precise captions.

Depth comes from the sneaker, its light and its changing perspective. Useful HTML copy, annotation ledgers, material-study anchors and a chapter index keep the experience legible. The motion follows a continuous subject through product chapters; credited photography remains a separate reference plate.

**Key Characteristics:**

- Blue-and-white product identity, with ice, ocean and concentrated cobalt.
- Monumental variable typography paired with readable editorial copy.
- One continuous 3D subject, anchored by HTML navigation and disclosures.
- Hairline ledgers, square media and restrained action corners.

This document records the completed implementation. Token values are extracted from the loaded stylesheet cascade and current merchant settings, not the older preset. `theme.css`, `refinements.css`, `recovery.css` and `signature.css` form the shared foundation; `experience.css` loads last on the homepage only. Merchant settings remain authoritative for the shared palette. The homepage direction lives in `.impeccable/surfaces/templates-index-json.md`; this system does not prescribe that composition to every Shopify route.

## Colors

The palette moves from airy blue exhibition fields to deep ocean, always retaining the blue-and-white subject.

### Primary

- **Film Blue** supplies the homepage field; **Materials Blue** separates the material study.
- **Film Cobalt** emphasizes the secondary display line, active material anchors, selection and the fixed progress line.
- **Ocean** and **Ocean Deep** form the technology and finale environments.

### Neutral

- **Ink** carries body text, ledgers, navigation and the opening collection action.
- **Film Ice** is the anatomy field; **Surface** supports shared commerce surfaces and light text on dark chapters.
- **Paper** and **Accent** are merchant-controlled shared theme colors. The homepage's film field overrides Paper locally.
- **Action Text**, **Action Hover** and **Finale Action** preserve the existing action treatments. Film Rule is the low-contrast hairline divider derived from the current Ink.

**The Subject Color Rule.** Supporting colors frame the blue-and-white sneaker; preserve the clear distinction between pale study fields and ocean chapters.

## Typography

**Display Font:** Archivo variable, with Helvetica Neue, Helvetica, Arial and sans-serif fallbacks.

**Body Font:** The same Archivo family. Normal and italic files are bundled locally; both expose weight (100–900) and width (62–125%) axes.

The display is compressed, assertive and tightly spaced; captions and prose remain open and readable. The hero's second line is italic and lighter, sharing the first line's condensed width. Chapter headings use a condensed width (85%) with balanced wrapping.

### Hierarchy

- **Display:** Two-line hero type at a reduced scale; the first line uses the display token and the second the secondary token. This scale is specific to large homepage fields.
- **Headline:** Chapter headings; chapter-specific clamps remain in the source, including materials, technology and finale variants.
- **Title:** Material study titles, limited to roughly 11 characters per line on desktop; other annotation titles use smaller responsive clamps.
- **Body:** Responsive editorial prose with line height around 1.5–1.55; text measures generally run 33–39 characters. Native commerce retains its own denser hierarchy.
- **Label:** Uppercase chapter kickers and indexing; tracking changes by role, including 0.1em on ledger labels and 0.07em on specification chips.

**The Readable Scale Rule.** Scale prose as well as display type on wide screens; retain the explicit compact-screen overrides instead of shrinking a desktop composition uniformly.

## Layout

Desktop chapters use broad fields and substantial product windows, generally beside a narrower reading column. The materials spread uses a 1.2:0.8 split with a 5vw column gap. Anatomy reverses the emphasis through a 0.9:1.3 ledger-to-product split. Fine rules align ledgers and action zones to the shared gutter.

The homepage gutter follows the frontmatter clamp, switches to 5vw at widths up to 1180px, then 6vw at 700px and below. The portrait treatment at widths up to 900px stacks anatomy content and removes the hero metadata ledger to protect the subject and headline. At 700px and below, material studies and technology stack, study navigation keeps its three text anchors, and its explanatory sublabels hide. Hero actions fill the available width; their minimum height is 48px. Homepage chapter padding becomes 54px.

Short desktop viewports (minimum width 1181px, maximum height 820px) tighten hero, materials and finale sizing. Compact phones (maximum width 700px and height 740px) use a shorter hero minimum. Do not remove these height-sensitive compositions. The fixed bottom progress line is 3px high; the desktop chapter index uses small numbered cells on the right edge.

## Elevation & Depth

The product supplies the primary depth. Pale and dark environmental fields, ghost outline numbers and fine rules organize the remaining surface. Material insets use a diffuse shadow; credited reference plates have a stronger photographic shadow. Buttons lift slightly on hover. Broad content areas and the brand image stay flat and square.

**The Product Window Rule.** The fixed canvas owns the currently active disclosed model study, or both visible chapter windows during a handoff. Keep credited reference photography separate and retain the image fallback until the scene successfully owns its host.

One renderer follows hero, anatomy, materials, technology, featured, Brand and finale hosts. Deliberate bounded tilts inspect the real profile, upper and foundation, with zero roll and no idle rocking. Each chapter fits its camera once across its authored poses and models; scrolling does not continually zoom the shoe. Models keep uniform natural proportions, and asset changes use one complete opaque shoe at a neutral view. At chapter boundaries the same renderer draws both visible authored product windows using separate viewports and scissors. The shoe stays inside its chapter; no large canvas travels across the intervening heading. The hero and finale have no extra HTML scale, rotation or float on the live model. Material anchors correspond to the visible Color, Structure and Foundation study. The renderer is decorative and does not capture pointer events. Hero thumbnail view controls are removed; Brand retains its existing useful view buttons. Reduced motion and no-JavaScript modes keep the entire product story in normal document flow with static imagery and useful links.

## Shapes

Square media, straight hairlines and rectangular ledgers establish the form language. Homepage action buttons and specification chips use the small action corner token. Do not generalize retained bag-control or legacy pill styling into new homepage cards. The hero and materials spreads use open composition rather than a grid of rounded containers.

## Components

- **Primary collection action:** Ink fill and pale text in the opening field; a pale fill and Ink text in the finale. Desktop padding and the small corner are in the frontmatter. Preserve hover, active, disabled and visible-focus states.
- **Secondary action:** A quiet inline arrow link in light chapters; an outlined ghost action in the finale. Links remain native anchors.
- **Study navigation:** Three bordered text anchors with index, title and explanatory sublabel. Cobalt text and a translucent white field indicate the current study. On mobile, keep index and title while hiding sublabels.
- **Annotation ledger:** Numbered rows, readable titles and short prose, separated by thin rules. Metadata uses semantic description lists. Keep the hero metadata hidden in portrait tablet and phone layouts.
- **Specification chip:** A compact uppercase outlined rectangle with transparent fill and the action corner token. It communicates a study label rather than simulating a purchase option.
- **Chapter index and progress:** Numbered right-edge anchors identify the current chapter; a separate fixed bottom line shows progression. Preserve native link behavior and focus visibility.
- **Commerce input and product card:** Shared routes retain transparent, square fields and image-led cards with semantic product names, prices and availability. Homepage film styling remains scoped to the homepage.
- **Reference plate:** Large credited photography with an explicit reference disclosure; never present it as inventory or proof of product performance.

## Do's and Don'ts

### Do:

- Do retain the blue-and-white subject and the pale-blue, ice and ocean environments.
- Do preserve local Archivo width and weight variation, readable prose and compact-screen overrides.
- Do connect every material-study anchor and caption to the corresponding visible perspective.
- Do preserve native Shopify product, variant, availability, search, collection and cart behavior.
- Do keep reference credits, model-study disclosures and shipping-asset provenance intact.
- Do keep content and navigation usable with reduced motion, failed WebGL and no JavaScript.

### Don't:

- Don't replace the continuous product subject with repeated flat-picture reveals in animated product chapters.
- Don't let the 3D overlay capture pointer events or obscure essential reading and action zones.
- Don't use reference studies as purchasable inventory or evidence of performance claims.
- Don't apply homepage-only type sizes or stage geometry to native commerce routes.
- Don't add long empty pinned intervals or a blank closing tail.


The second recording refinement reduces headline scales throughout, limits hero horizontal text drift to 2%, and retains camera margins during every hero/finale pose. Anatomy uses a start-aligned sticky visual. The bundled Brand chapter uses a live 3D lighting studio; configured merchant imagery keeps its original single-image composition.


## Multiple TN models within the existing chapters

The original intro, blue/white hero, typography, palettes and eight-chapter layout are preserved. Chapter 02 now studies the user supplied white/black Air Max Plus Drift in its original anatomy layout. Chapter 03 retains its three material panels: the blue Air Max Plus in Color, then the white/black Drift in Structure and Foundation. Each panel's model, fallback, inset, title, description and specs describe the same shoe. There is no added bottom section.

One shared journey canvas and camera select the model declared by the active product window. Models are cached separately with their own framing hull and base yaw: 90 degrees for the blue TN, zero for the Drift. The Drift loads as chapter 02 approaches; unavailable models retain matching static imagery. Each asset keeps its natural proportions. At an asset boundary, a neutral view exchanges one complete opaque model for the next without shader-spliced parts or an artificial heel spin. Captions use non-overlapping masked reveals. Scroll seeks and reverse scrolling resolve to the same absolute pose. Hidden tabs release their WebGL renderer. The intro triptych uses blue TN, Drift profile and a clean white/cyan TN photograph, with contained framing for the two new shoes.


## Third supplied TN — chapter 06

The deep blue/navy Air Max Plus uses the existing featured layout, titled Deep blue, with its own model, fallback renders and matching detail ledger. On desktop, a short pin holds the complete composition while the original blue TN turns into the navy shoe through the shared opaque heel handoff. Phone and short flowing layouts time the same change to the visible shoe window. Merchant imagery retains precedence. The intro files were restored to their pre-turn content and are unchanged by this integration.

The two dense supplied scans use UV- and normal-aware 180,000-triangle delivery copies with unchanged embedded PBR maps and transforms. Original user files remain intact; source framing hulls are retained. The original blue hero model is unchanged.


## Collection and product studios — 25 October 2026

Collection and product routes retain the ice/ocean/cobalt palette and local Archivo but use a denser commerce hierarchy. Their styles load after storefront.css and only on their own routes. navigation.css opts eligible documents into short native page transitions; reduced motion opts out. Product media has a separate shared transition name, assigned to only the clicked collection cover.

The photo collection opens with a sky-blue “Find your next move” masthead: condensed Archivo, a cobalt italic second line, and two linked real catalog photographs on an indexed orbital field. The source photographs are fitted in their media's local coordinates before the editorial rotation, keeping the full shoes in frame. A brand index leads into “The lineup”, a sticky desktop search/brand/color/sort toolbar, removable filter chips and a roomy or compact gallery. The density choice lasts for the browser session. Phone layouts use a stacked masthead, horizontal brand index and two-column gallery with full product images. Local photographs use 12 entries per page with URL-backed search, filters, sort, numbered pagination and Back/Forward behavior. All 889 supplied groups remain reachable. Named designs filters existing identity metadata; no sizes, prices or stock are invented. Native Shopify products retain Shopify filters, pagination, links and availability. Brief typography and shoe arrivals, bounded card reveals and alternate-image hovers supply motion without another renderer; reduced motion retains static content and all controls.

Product pages use one dominant image, a horizontally scrollable thumbnail rail, view counts, previous/next controls and a full-screen native dialog with zoom, keyboard arrows, Escape and touch swipe. On mobile, 44px arrows sit in a dedicated footer beneath the image area. Imported white-ground photographs receive bounded content framing from a small cached image analysis; their source assets are unchanged. Real merchant imagery keeps its authored framing. Native merchandise retains variant select/form fields, quantity, availability, prices and policies; accessible variant buttons are a progressive enhancement. No-JavaScript thumbnails remain real links.

The full intro plays on fresh direct or external homepage entry and on a reload at the top. Internal navigation back home skips the full overlay, while same-home logo activation scrolls to the opening without reloading. Reduced motion, restored history, anchors and mid-story reloads keep their existing skip behavior. A previous visit must not permanently suppress the intro for the rest of the tab. The homepage hero removes the generic description, metadata block and ticker. Chapter 05 is now a staggered two-column photographic field with bounded scroll parallax, not a pinned slideshow. The navy feature keeps its own matching model and static fallback at every position. The Brand chapter now uses the live lighting studio described below.


### Brand lighting studio

The bundled chapter 07 replaces the paired enlarged raster crops with one complete live 3D sneaker. A compact “In a different light.” heading and short current-view caption sit above the product; view controls and collection/detail links sit below. No large manifesto or repeated photo wall appears in this branch. A selected merchant campaign photograph remains authoritative in the static branch.

GSAP scrubs a deliberate profile → gentle upper → gentle foundation inspection, then holds the final view, with a real key light moving from one side to the other. Pitch stays within ±.62 radians and roll stays zero on every viewport. Rim, ambient and environment levels are composed for the ocean stage and explicitly reset outside this chapter. The same existing renderer, model cache, framing hull and scheduler serve the scene; no second WebGL context is created.

### Hero focus and motion refinement

The bundled hero uses a left-aligned two-line headline and a separate complete shoe on desktop; phones stack the headline above the shoe. Its only supporting elements are a collection action and a quiet model credit. Edition labels, thumbnail controls, ticker and duplicate actions are removed. Masked staggered glyphs reveal only after the existing site intro releases the page. On scroll the two lines separate by a few pixels while the shoe makes a restrained inspection turn inside a fixed frame. Reverse scroll and interrupted entrances settle deterministically. Merchant product information and forms remain native. Intro replay rules and all other section layouts are unchanged by this refinement.

Desktop travel is 1.4 viewport heights. Taller phones use a shorter .95 viewport pin; viewports below 740px high use normal flow. The active labels and rendered pose share the timeline progress, including seeks and reverse scrolling. Three view buttons seek the actual timeline when pinned. They are hidden in static or unavailable-WebGL states, leaving genuine navigation links and a full-shoe high-resolution fallback. Generic chapter arrival transforms do not compete with the pinned studio. The brand-specific media condition remounts its context when the height mode changes and restores the same viewed phase. Studio top spacing includes the fixed header and local preview banner.

## Three-model orbit choreography — 26 October 2026

The current landing motion uses continuous full orbits to connect the three supplied shoes. At each exchange a single complete opaque model turns through a narrow end view, changes identity at that matched angle, and completes the revolution into its authored inspection pose. One shared progress value controls the angle and model choice; pinned studies use their existing scrub clock so captions and identities stay aligned. Fine orbit traces and moving key/rim light appear during the exchange inside the product window. The shared renderer and its pixel budget remain in place.

Chapter 02 turns the opening blue model into the white/black Drift. Chapter 03 now presents blue, Drift and deep navy with matching photographs, titles, descriptions and specs. The final study emphasizes the navy upper and side profile. Chapter 06 uses the same exchange into its navy campaign. The camera is fitted once across all model hulls, authored poses and actual exchange intervals (including flowing phone intervals), preserving natural proportions and full-shoe margins. Reverse scrolling restores the same motion and identity. Phone panels stay in document flow, with only the active frame owned by the live renderer so adjacent fallback photographs remain visible.

Chapter 01 retains its typography, layout, palette and imagery. Its existing entrance now uses counter-direction character rolls and a short product rise; its scroll pose has a small authored bank. The site intro is unchanged. Reduced motion and unavailable WebGL keep the matched static content and ordinary navigation.

## October 26 campaign refinement

The existing intro and hero composition stay intact. The hero entrance uses staggered type and a longer product settle, with a shorter scroll hold. Chapters 02–03 use compact copy, a sticky anatomy window and larger product stages. Model exchanges use a reversible quarter-turn and return; chapter 06 holds its own navy product with a small inspection sway. Chapter 07 becomes a split editorial studio with a three-frame contact sheet. The finale fans four real product photographs into an ocean-blue collection invitation.

The local collection combines 889 existing photo groups with 19 StockX references. `tools/fixtures/stockx-edit.json` records product URLs, image URLs, style codes, authored descriptions and SHA-256 provenance. Original downloaded photographs live in `assets/stockx-edit/`. References are separated by a StockX edit filter and remain purchase-disabled until connected to actual merchant inventory. Collection headers remain visible during scrolling; numeric anchor destinations prevent Lenis from tripling CSS header clearances.
