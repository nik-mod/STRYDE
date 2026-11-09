---
version: 1
slug: experience-auth
primary_target: independent/storefront/src/components/AccountAuth.tsx
related_targets: ["independent/storefront/src/components/AccountRecovery.tsx", "independent/storefront/src/components/AuthScene.tsx", "independent/design/assets/experience-polish.css", "independent/design/markup/home.html"]
---
# Experience and account refinement
Mode: Operate for account and utility pages; Experience for the existing Hero. User explicitly requests larger header controls, no hero caption/rule, living 3D background, GSAP page motion, useful copy, animated 3D account screens and actual registration/login/recovery. Existing identity and no-emojis preference are pinned.
## Direction contract
THESIS: Keep the product film clean, while making everyday account tasks clear, usable and connected to the real commerce backend.
OWN-WORLD: Existing Archivo, pale blue, ice, navy, cobalt and authored SVGs. Existing hero waves gain depth without a new renderer or larger pixel budget.
STORY: Explore the sneaker, find controls easily, register or sign in, and recover access through a single-use link. Never pretend an email reached an inbox without delivery configured.
FIRST VIEWPORT: Hero caption and rule removed, original headline and shoe preserved. Header actions gain icon-plus-label targets; phones use accessible SVG action icons. Account split pairs the form with a live contained shoe on navy, with a static reduced-motion fallback.
FORM: Code-led extension of the established world. GSAP utility entrances preserve visible defaults and reduced motion; one decorative renderer only on account screens. seed: none (pinned world).
FINISH: reviewed and documented as an ordinary extension of the incumbent system. The finish verdict and evidence live in `.impeccable/review/experience-auth/finish-review.md`; extension notes live here. Global DESIGN.md and its sidecar are preserved. No new shipping raster was generated.
Functional evidence: real test account registration, repeat login, password reset through private local outbox, used-token rejection, old-password rejection and new-password login. Inbox delivery requires merchant email credentials; no external message was sent.

## Implemented extension — 6 November 2026

The visual authority remains the incumbent Continuous Product Film: local Archivo, pale blue and ice reading fields, cobalt italic emphasis, navy product stages, straight rules and square controls. This surface adds account tasks within that language rather than establishing a new global system. The original intro and scroll-directed shoe choreography remain; the existing Hero environment gains deeper, slower-moving crests. Its lower caption, scroll instruction and associated rule are removed. Homepage copy now names the visible shoes, colors and construction details more concretely.

Header Account and Search controls pair authored SVGs with text on desktop; at widths up to 700px, the labels remain accessible while the icons provide compact touch targets. Desktop utilities are at least 46px high; compact utilities are at least 44px high. Hero actions are at least 52px high. `experience-polish.css` loads after `shopping-ui.css`; existing route-specific care refinements retain their later position in the cascade.

Account access and recovery use the existing account split: a contained shoe on navy beside the form at desktop widths, with the form preceding the decorative story at compact widths. The 768px live viewport shows the task-first form; its shoe is farther down the page. Sign-in/create-account controls, named inputs, password visibility, inline validation, pending states and recovery messages preserve the existing commerce hierarchy. Recovery covers request, missing token, mismatch, successful reset and an explicit return to sign-in.

`AuthScene.tsx` reuses `/assets/nike-tn-blue-white.glb` and `/assets/hero-product-desktop.webp`. The photograph stays visible until the first loaded model frame; reduced motion, unavailable WebGL and context loss retain or restore it. The decorative canvas has a capped pixel ratio (1.5), pauses offscreen or in a hidden tab, and disposes its resources on unmount. This account renderer is separate from the existing homepage journey and is confined to account screens. Existing assets and their provenance remain unchanged; no raster generation or texture/model replacement belongs to this extension.

`SiteMotion.tsx` adds bounded GSAP heading/support entrances after hydration, with visible default content, route cleanup and reduced-motion opt-out. The homepage keeps its existing motion ownership. Contact's introduction remains solely owned by `information.mjs`: the finish correction removed `.contact-introduction` from the generic heading selector to prevent competing transforms.

## Account behavior and delivery boundary

Registration and sign-in reach Medusa customers stored in the configured Supabase Postgres database; these are not Supabase Auth users. Registration/login normalize email case, and sessions use the existing HttpOnly cookie. Recovery uses the customer reset-token flow, a 15-minute single-use link and a token fragment removed from the address bar after reading. Development email files remain in a private local outbox; the browser receives no public outbox endpoint or reset token in a request acknowledgement.

No email-provider credentials are configured, so customer inbox delivery is incomplete. `independent/EXPERIENCE-AUTH-STATUS.md` and `independent/deploy/{backend,storefront}.env.example` document the verified Resend sender/domain, backend `RESEND_API_KEY` and `AUTH_FROM_EMAIL`, public HTTPS `STOREFRONT_URL`, and server `AUTH_EMAIL_MODE=resend` requirements. Restarting services and proving receipt plus reset in an owned inbox remain release work. Production refuses development-file delivery; an asynchronous request acknowledgement does not prove receipt.

## Finish review and QA evidence

Disposition: **ship — verdict pass for F1 only**. The initial full review found F1 and no other material findings within its supplied scope. The final verdict pass in `finish-review.md` verifies sole Contact heading ownership and settled 1440/390 captures, resolving F1; it is not a fresh whole-surface approval. It does not approve production inbox recovery, deployment or public commerce launch.

The documenter read the direction contract, PRODUCT.md, DESIGN.md, the sidecar's extension/component/narrative data, relevant implementation and deployment examples, `EXPERIENCE-AUTH-STATUS.md`, the finish review, `checks.json` and `live-checks.json`. Direct visual inspection covered `auth-live-1440`, `auth-live-768`, `auth-model-390`, `login-390`, `register-390`, `forgot-390`, `reset-390`, `reset-mismatch-1440`, `reset-success-1440`, `hero-live-1440`, `hero-390` and `contact-fixed-390`. These captures show readable forms, full shoes in their stages, the task-first compact order, recovery states and the larger header controls. Old `auth-scene-*` and debug attempts are excluded as evidence.

Recorded browser checks cover twelve route/viewport combinations at 1440/390 without horizontal overflow or page errors. `live-checks.json` records animated account WebGL and Hero with no errors; reduced-motion captures use the expected static fallback. The reviewer separately inspected the full required route/state set, including desktop registration/recovery, login errors, FAQ/collection and corrected Contact at both widths.

Supplied functional verification reports 30 frontend and 43 backend tests passing, both TypeScript checks passing, and actual HTTP/browser registration, logout, repeat login, private-outbox recovery, password reset and new-password login. Reused-token and old-password attempts failed; cross-origin mutation, invalid-token and email-rate guards returned 403, 400 and 429 respectively. The documenter did not rerun those tests or repeat the customer flow.

No production build/deploy or physical-device frame-pacing/GPU benchmark is claimed. Captures and recorded browser checks do not establish every scroll seek, assistive-technology interaction or device performance. Distributed rate limiting and durable event delivery remain production work documented by the implementation status.

## Preserved documentation drift

PRODUCT.md still describes the Shopify theme baseline, while this account extension belongs to the independent Next.js/Medusa implementation. DESIGN.md retains historical Hero/closing descriptions alongside the explicit 5 November independent-Hero supersession; its sidecar also retains older closing motion and slightly different Product Window/One Subject narrative wording. These pre-existing inconsistencies were observed, not repaired or promoted to new rules. DESIGN.md and `.impeccable/design.json` remain byte-identical to their state at this documentation pass's start. This brief is the factual record of the present extension.
