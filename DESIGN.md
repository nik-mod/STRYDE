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
    fontSize: "clamp(88px, 11.6vw, 290px)"
    fontWeight: 900
    lineHeight: 0.79
    letterSpacing: "-0.04em"
    fontVariation: "'wght' 900, 'wdth' 76"
  display-secondary:
    fontFamily: 'Archivo, "Helvetica Neue", Helvetica, Arial, sans-serif'
    fontSize: "clamp(88px, 11.6vw, 290px)"
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

The display is compressed, assertive and tightly spaced; captions and prose remain open and readable. The hero's second line is italic, lighter and wider than its first. Chapter headings use a condensed width (85%) with balanced wrapping.

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

**The One Subject Rule.** The fixed canvas owns only the currently active disclosed model study. Keep credited reference photography separate and retain the image fallback until the scene successfully owns its host.

One renderer follows hero, anatomy, materials, technology, featured and finale hosts; absolute poses reveal real profile, upper and outsole views. Chapter handoffs fade between authored product windows instead of translating the shoe across headings. Nested hero grids use minmax(0, 1fr) tracks and min-height: 0 to prevent intrinsic image sizing from expanding the canvas below its frame. The finale has no extra HTML scale or float on the live model. Material anchors correspond to the visible Color, Structure and Foundation study. The renderer is decorative and does not capture pointer events. Native Profile, Upper and Outsole buttons let visitors inspect real model surfaces, with a 650ms pose transition; scrolling restores the authored sequence. These controls appear only while WebGL is available, and stay hidden on short phones and portrait tablets to preserve the composition. Reduced motion and no-JavaScript modes keep the entire product story in normal document flow with static imagery and useful links.

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


The second recording refinement reduces headline scales throughout, limits hero horizontal text drift to 2%, and retains camera margins during every hero/finale pose. Anatomy uses a start-aligned sticky visual. The bundled Brand image is a two-plate detail/heel study; configured merchant imagery keeps its original single-image composition.
