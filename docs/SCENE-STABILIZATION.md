# Homepage scene stabilization — 2026-10-22

The homepage uses one live WebGL viewer in the hero. Later chapters use static editorial images. The actual collection listing still uses the ten local-only, non-purchasable concept studies documented in DEVELOPMENT-CATALOG.md.

## Pose and detail

The opening pose now lifts the heel above/right of the toe and tilts the upper toward the camera, matching the user's diagonal reference direction. The complete model is centered with responsive breathing room. The deterministic `heroPose` contract includes rotationX and rotationZ; the outgoing handoff still levels the shoe, and reverse scrolling restores the same pose. A geometry-direction unit test checks the heel/toe orientation and camera-facing upper.

The supplied `assets/nike-tn-blue-white.glb` remains unchanged: approximately 4.3 MB, 115,586 triangles, one mesh/material draw call and three 2048px PBR maps. Texture anisotropy is capped at 8; lower ambient fill improves surface contrast, and the bundled preview gets slightly stronger existing normals plus an antialiased procedural blue-surface fabric treatment. This is a render-time material study, not new photogrammetry or higher-resolution geometry. More accurate seams, stitching or construction require a better original mesh/maps. Merchant models retain their own material definition; the preview treatment applies only to the bundled model.

## GPU work

The renderer draws only after a pose/size change, context restoration or re-entry into view. It produces zero additional WebGL draw calls while idle or offscreen in the Chromium checks. The shared GSAP scheduler remains the only animation clock; no second Lenis instance, ticker or requestAnimationFrame loop was added. Canvas resolution is limited to 1.6 million pixels and DPR 1.5, with antialiasing. Fixed chrome no longer repeatedly backdrop-blurs the moving canvas, and hero pointer transforms stop after leaving the hero.

Reduced-motion mode does not import or fetch the viewer/model and removes the canvas/pins if enabled at runtime. Static hero content flows without the edition overlapping its title. A merchant product/image takes priority over the bundled preview model; an explicit merchant model URL remains supported.

## Materials and merge repair

Four Liquid conflicts were combined while preserving presentation pickers, product bindings, model-preview toggles and honest image disclosures. There is exactly one image per Materials panel. Grid tracks and image sizing no longer let intrinsic image dimensions expand the frame. The pinned stage has a definite viewport height, a heading gap and bounded frames. CSS crop order matches GSAP, and GSAP clears parsed x/y pixel offsets before applying percentage crops, fixing the blank third image.

Validation now explicitly rejects merge markers; Theme Check alone previously treated those markers as text. Conflict index entries were marked resolved without creating a commit. No merge commit, push or deployment was performed.

## Evidence

Browser artifacts are under `C:/Users/LENOVO_LEGION/.codex/visualizations/2026/10/21/01a15e09-43e7-7bb2-a336-868299c3d058/`:

- `scene-performance/`: actual rendered hero, canvas pixel budgets, idle/offscreen draw counters and reduced-motion checks at 1440×900, 768×1024, 390×844 and 375×667, DPR 2.
- `materials-fix/`: all three phases forward/reverse, heading separation, frame bounds, nonblank pixel coverage, reduced motion and no-JS; also 1832×1180.
- `development-listing/`: ten entries at all four viewports, hover/reset, disclosures, native fixture/empty precedence, reduced motion and no-JS.
- `home-stabilized/`: current all-chapter visual sweep, reverse pin traversal and static hero checks.

These are local Chromium checks, not a universal 60 FPS or physical-device guarantee. The build/tests/structural validation/Theme Check remain the reproducible gates; connected Shopify checkout and physical-device profiling remain production checks.

Final gates pass: build, 31 tests, 62 theme files validated and 40 Liquid files checked with zero Theme Check offenses. All eight chapters were swept forward and backward at all four viewports; static hero content and short-phone Finale controls fit without overlap/clipping. The 375×667 Finale uses a smaller static shoe and one row of controls. During overlapping browser/build activity Windows briefly locked a generated chunk; the complete test suite passed after those concurrent processes finished.
