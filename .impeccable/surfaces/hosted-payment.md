---
version: 1
slug: hosted-payment
primary_target: independent/storefront/src/components/HostedPayment.tsx
related_targets: ["independent/storefront/src/components/Checkout.tsx", "independent/storefront/src/app/checkout/payment/page.tsx", "independent/design/assets/shopping-ui.css"]
---
# Hosted payment
Mode: Operate. User explicitly requested proceeding with provider selection, return states, interruption recovery and refunds while merchant registration is pending. Established STRYDE shopping identity is pinned; no visual-world interview is needed after their instruction to proceed.
## Direction contract
THESIS: Make the payment outcome understandable and recoverable, without encouraging duplicate charges.
OWN-WORLD: Existing Archivo, ice field, navy text, cobalt selection, square shopping controls and ruled provider rows.
STORY: Review bank availability, choose an enabled sandbox provider, leave for hosted card entry and return to a server-verified outcome. Uncertain results retain a check-status action and explicitly avoid another payment.
FIRST VIEWPORT: Existing split title/description, task column left and compact summary right; stacked on phones. Disabled banks remain clearly labelled. Status precedes actions.
FORM: Code-led extension of the existing shopping surface. Native radios, buttons and links. No new assets or comp round. seed: none (existing pinned world).
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
Constraints: no live activation, fabricated inventory or success claims; preview bag cannot become a bank charge. Native card entry belongs to bank pages. Production guards remain. No homepage changes.

## Documentation comparison — 6 November 2026

This is an ordinary extension of the incumbent shopping surface. `HostedPayment.tsx` reuses `ShopPage`, the existing shopping layout, summary, note, button and text-link components. It retains Archivo, the ice field (`#eef5f7`), navy text (`#102b3b`), square controls and the shopping cobalt (`#2053a4`). The shopping cobalt already exists in `shopping-ui.css`; it does not introduce or replace the homepage Film Cobalt token. Provider radios sit in ruled rows, and the confirmation uses a ruled definition list. Desktop keeps the task and summary columns; phone captures stack them in the same order. The preview checkout remains explicitly fictional and links to the separate payment surface.

The extension adds surface-specific availability recovery and payment/refund outcome copy rather than a new visual system. Unknown outcomes keep a check-status action and caution against another payment. The availability-error view offers a retry, distinguishes a connection failure from payment failure and restores focus to the outcome heading after the explicit check. Confirmed order information is rendered only from the returned status. No new shipping raster assets or global tokens are introduced.

Evidence lives in `.impeccable/review/payments/`: 18 base captures cover disabled, not-started, pending, declined, expired, review, confirmed, refunded and refund-pending states at 1440px and 390px; four additional captures cover availability error and recovered confirmation at both widths. `checks.json` records no horizontal overflow across the 18 base cases. `recovery-checks.json` records recovery to the confirmation heading with zero payment-start requests at both widths. Documentation review inspected the current source and representative disabled, provider-selection, pending, refunded, availability-error and recovered-confirmation captures. The independent final finish reviewer scored all three recovery, summary-copy and focus findings resolved and returned `ship` within the disabled development scope.

Disabled-state screenshots use actual local server availability; enabled states and recovery use mocked responses. Both banks remain disabled in the configured environment; they are not evidence of a real bank authorization, callback, refund or customer order. Backend 38-test and frontend 30-test passes, plus the Supabase ledger migration/RLS verification, are reported implementation checks rather than independent bank certification. Live bank validation remains outside this documentation review.

`PRODUCT.md`, `DESIGN.md` and `.impeccable/design.json` are preserved. No new approved system decision requires regenerating them; pre-existing documentation drift is outside this surface's scope.
