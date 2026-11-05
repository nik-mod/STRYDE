---
version: 1
slug: "efront-src-components-previewshopping-tsx-ca4de51f"
primary_target: "independent/storefront/src/components/PreviewShopping.tsx"
related_targets: ["independent/design/assets/shopping-ui.css","independent/storefront/src/components/AccountAuth.tsx"]
---

# Shopping and account UI
Mode: Operate. Existing identity extension authorized by the user on 2026-11-06: finish frontend and use placeholder sizes/prices until verified data is supplied.

## Direction contract
THESIS: Make the complete browsing-to-confirmation journey usable and recognizably STRYDE, while separating a visual shopping preview from real commerce.
OWN-WORLD: Preserve Archivo, ice #eef5f7, navy #102b3b/#102f43 and cobalt #2053a4. Square controls, generous whitespace, strong editorial type, ruled product rows and visible focus.
STORY: Choose the exact sneaker and a sample size; save it, adjust the preview bag, walk through delivery/review/confirmation. Existing customer authentication, addresses and wishlist keep their real connection. Recovery/payment previews never claim a real action.
FIRST VIEWPORT: Product photograph left, purchase information/size buttons right; mobile photo above purchase controls. Utility screens have a two-column title/description followed by a task area and summary or account rail; collapse to one column on phones. Actions stay next to their inputs.
FORM: Code-led extension of the user's pinned existing design system; no new-world selection or comp round. The bag drawer is the signature interaction; a short exponential slide respects reduced motion. No hero choreography changes.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Constraints: preserve the restored 3,409-sneaker collection and exact photograph links. Sample sizes, price, promo and delivery values are labeled UI-only. No payment, shipment, order or email created by preview checkout. No new raster assets. Production sample-mode gating remains in force. Homepage cinematic visuals remain outside this scope.
