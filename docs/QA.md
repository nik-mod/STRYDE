# Milestone 01 verification record

2026-10-21. This record concerns the foundation, not a complete cinematic storefront.

- `npm run build`: pinned runtime dependencies bundled locally; Three.js/GLTFLoader split from the initial runtime.
- `npm test`: eleven tests pass after visual refinement. Covers normalized eight-chapter boundaries, deterministic reverse poses, observer cleanup, pending async resource cancellation, already-loaded resource cleanup, one-ticker attach/detach, variant ID lookup, sold-out deep-link/no-JS Liquid rendering, concept disclosure, native empty/fixture routes, real hero product title/selected-price/availability and image/model replacement of the concept.
- `npm run validate`: 31 theme files pass structural checks, JSON parsing, section schemas, snippet references, bundled chunks and milestone homepage scope.
- `npm run theme:check`: Shopify CLI inspects 28 files with zero offenses.
- `npm run theme:package`: builds, validates, checks and packages with Shopify CLI; output is `dist/stryde-m01.zip` and contains standard theme folders only.

Independent local browser checks used the same Liquid preview, with desktop, tablet and mobile captures. No horizontal overflow or browser page errors were observed. Header/mobile navigation and Escape close worked; collection, product, cart, search, page and 404 content rendered. Repeated Shopify section load/unload checks retained one active pin; reverse scrolling restored the original transform. No-JS sold-out selection remained disabled. Reduced motion displayed native fallback content without a canvas.

The optional scene loader was exercised using a deliberately synthetic single-triangle GLB intercepted in the test browser, outside the repository. This was a loader/lifecycle fixture, never merchandise. Relative URL loading, one-canvas ownership, actual `WEBGL_lose_context`, fallback visibility, `restoreContext` recovery, section-unload disposal and reduced-motion no-canvas remount were observed. This does not validate product geometry, visual fidelity, real model transfer/GPU budgets or production frame rate.

The independent design review passed M01 and requested two refinements: keep the preview notice clear of shopping controls, and move the asset caption clear of the oversized type. Both were corrected without changing the art direction. Preview is in-flow at the top; the frame caption occupies an unoccluded lower strip on desktop/tablet and its own top edge on mobile.

The subsequent sky-blue refinement replaces the initial palette/type/registration treatment with cyan/silver art direction and an original transparent concept sneaker. Header account access remains conditional on Shopify customer accounts. Preview disclosure occupies a measured in-flow 30px, included in viewport sizing. Concept image containment uses an absolute fitted image within the fixed scene host; its label remains in the shared fallback wrapper for proper GLB lifecycle hiding. Separate same-Liquid fixtures verify authentic-image precedence without pretending concept art is merchandise. See VISUAL-DIRECTION and ASSETS for audit, palette and generation provenance.

Final visual-refinement browser regression covered 1440×1000 desktop, 1366×768 laptop, 768×1024 tablet and 390×844 mobile. Full shoe, concept disclosure and shopping CTA fit the viewport; no horizontal overflow or browser page errors were observed. The shorter laptop composition was refined to separate story copy from the second headline, and disclosure text increased to 11px desktop/tablet and 10px mobile. The independent first review passed and identified those two refinements, which were applied and rechecked.

The refined theme also passed reverse-scroll restoration, five repeated section reloads without duplicate pins, reduced-motion fallback, sold-out product fixtures, no-JS variant behavior and native navigation checks. The synthetic intercepted GLB regression was repeated for relative URL resolution, context loss and restoration, fallback visibility and teardown disposal. These checks validate the retained infrastructure with fixtures; they do not establish real merchandise fidelity or store checkout behavior.

The independent second design review passed all four criteria with no material issues. Final browser checks confirmed the harness account notice responds successfully, the hero variant fixture uses the selected $195 price, sold-out status is retained, configured imagery removes the concept disclosure, the scroll-to-details anchor works and the collection CTA navigates correctly. All four reviewed viewport sizes retained visible shopping/disclosure controls and separated headline/story text.

Not tested: an authenticated Shopify store, live product availability, Shopify-generated form errors, actual filter provider/markets, discounts, taxes, shipping, real checkout, production model performance or the seven unimplemented cinematic chapters. A real store, licensed accurate models and final merchant content remain required. No deployment or publication occurred.

## Editorial refinement

The subsequent focused design audit is recorded in `DESIGN-AUDIT.md`. The approved blue/cyan identity, diagonal concept artwork and native commerce remain. Non-informative orbital elements, translucent disclosure styling, repeated rounded media/utility surfaces and vague placeholder slogans were removed. The visible headline now reads FOOTWEAR / IN FOCUS; the concept caption remains explicit and unboxed. The short reversible foundation pin is retained with less travel, and a short-height phone composition is provided. Product-card sold-out information now sits outside the aria-hidden media wrapper.

After these presentation changes, `npm run build`, all eleven foundation tests and Shopify Theme Check (28 files, zero offenses) passed. Native selected-variant pricing/availability, concept disclosure and real-image/model replacement tests remain in place. Updated browser screenshots and independent review are recorded separately once complete; no real-store or full-film claim follows from local fixture checks.

## Local development and final review

`npm run dev` was started and tested at `http://localhost:9292` without Shopify authentication. Actual browser saves and restores in CSS, source and asset JavaScript, a Liquid snippet and translation data automatically reloaded the page and rendered the changed values. Source JavaScript rebuilt before refresh. The three development tests cover serialized builds, failed-build recovery and filesystem/SSE integration. Together with the eleven foundation tests, all fourteen tests pass.

`npm run preview` was separately started on port 9294 and returned the same Liquid page without the development reload client. Build, 31-file structural validation and Shopify Theme Check (28 files, zero offenses) passed. Local POST commerce remains rejected with HTTP 405; fixtures and native Shopify form wiring are preserved.

Final Chromium review covered 1440×1000, 1366×768, 768×1024, 390×844 and 375×667. Shopping access, the full shoe and its plain concept disclosure remain visible, with no horizontal overflow or browser page errors. The redundant collection anchor/detail strip was removed, and a reserved caption band clears the shoe. Product, collection, cart and search layouts and forms were also checked on desktop and mobile. Independent final design review accepted the refinements with no material issues.

Reverse-scroll restoration, five repeated section reloads, runtime reduced-motion changes, sold-out/no-JS variant behavior and the synthetic GLB context-loss/recovery/disposal checks passed again. Screenshots are named `stryde-editorial-*.png` in the chat's visualization directory. These checks do not certify authentic merchandise rendering or connected-store checkout.

The first independent editorial review passed and identified two focused refinements: repeated collection navigation and caption/sole clearance at tablet and short-phone sizes. The center anchor and duplicate lower strip were removed; the primary hero and header shopping links remain. A 28px reserved caption band now separates the complete concept image from its plain disclosure across breakpoints. The image and caption remain in the same fallback wrapper. Build, eleven foundation tests and Theme Check were rerun successfully after those changes.
