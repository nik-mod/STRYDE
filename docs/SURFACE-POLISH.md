# Surface, frame and finale polish — 2026-10-22

The user clarified that the existing generated shoe should be retained and made more tactile. Its geometry and original 2048px texture files are unchanged in this pass. Render-time normal detail now adds a stronger interwoven blue fabric pattern and subtle pale-surface grain. Screen-space derivatives fade the procedural detail before it aliases at distance. Roughness, normal-map strength, ambient lighting and exposure were adjusted to make surfaces less flat and washed out. These are artistic material refinements, not a new scan, higher-resolution source photography, or a verified exact replica. Model-preview disclosures remain.

## Image framing

Materials' first TN view now uses the complete angled image instead of the intrinsically clipped detail render. The three TN views use individually measured crop limits (1.32, 1.15 and 1.0) with zero offsets, accounting for the existing entrance/scroll zoom. Deconstruction uses safe limits for angle, heel and sole. `data-model-fullshot` enforces contain behavior for these images. Merchant picker branches remain unchanged.

Collection numerals now use a smaller complete index, line height 1, protected side bearings and an inset baseline. The exit no longer pushes the last numeral down out of its stage.

## Finale

The TN profile image's transparent padding is reframed through `finale-profile-window`, using source coordinates x=200, y=260, width=1040, height=540 within the original 1400×1050 artwork. This keeps the actual silhouette intact while making it larger without consuming the old image's empty vertical space. The underlying image file is unchanged. This crop is specifically for the bundled profile render; if that asset is replaced, recalibrate the window or remove it. Merchant product and picker photos do not use this wrapper or the TN-specific enlargement.

The image has a gentle independent 8px floating motion and 0.8-degree rocking motion. The existing finale pin owns play/pause, so the loop does not run offscreen. An earlier separate trigger ended before the pin; tying playback to the existing pin fixed that. GSAP context/media cleanup removes the loop for reduced motion and section unload. There is no new WebGL renderer, scroll controller or ticker.

The heading fits the available width, and removing duplicate inner padding keeps the large shoe inside phone viewports. Buttons remain visible at short heights.

## Verification

Chromium coverage includes 2048×1140, 1440×900, 1440×700, 738×807, 768×1024, 390×844 and 375×667. Checks cover actual image alpha bounds inside Materials frames, complete index bounds, visible finale heading/actions and full shoe window, live floating motion, offscreen pause, reduced-motion cleanup, no horizontal overflow and no shader/page errors. Additional checks cover all three deconstruction views at three widths and no-JS Materials/finale framing.

Artifacts: `C:/Users/LENOVO_LEGION/.codex/visualizations/2026/10/21/01a15e09-43e7-7bb2-a336-868299c3d058/surface-polish/` and `collection-scale/`. Build, 32 tests, validation of 62 theme files and Theme Check of 40 files pass. Nothing committed, pushed or deployed.
