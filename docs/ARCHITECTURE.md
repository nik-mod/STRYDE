# Cinematic theme architecture — Milestone 01

This is a Shopify Online Store 2.0 theme. Liquid supplies product data, links and native forms. Bundled JavaScript enhances an accessible storefront. Only the foundation stage exists in this milestone; the eight complete film scenes remain unimplemented.

## Theme and runtime

- `layout/theme.liquid` owns document metadata, theme tokens, skip link and header/footer section groups.
- `templates/index.json` contains one configurable `cinematic-foundation` section. Authentic merchant image/model takes priority; otherwise an original AI concept cutout is clearly disclosed as temporary and not actual merchandise. References are inspiration only. Sky/cyan/silver art direction and future chapter colors are documented in VISUAL-DIRECTION.
- Product, collection, cart, search, page and 404 JSON templates render native Liquid sections. Add-to-cart posts a real variant ID to Shopify; cart update and checkout use Shopify routes. Product JS changes variant price, sale price, availability, URL and image. No JavaScript is needed to submit commerce forms. A no-script GET selector handles a sold-out variant deep link before purchase.
- `src/theme.mjs` owns the sole Lenis instance, GSAP registration and Shopify section lifecycle. `commerce.mjs` is independent of the cinematic scene.
- `src/motion/contracts.mjs` owns normalized, immutable chapter state and deterministic pose functions. `lifecycle.mjs` owns async resources and the shared frame scheduler.
- `src/scene.mjs` and Three.js/GLTFLoader are a lazy chunk. No model setting means no scene download. The loader currently accepts an uncompressed GLB with embedded textures; no fake geometry is substituted.

## Shared scene and transition contracts

All eight future chapters belong inside one cinematic root and one persistent scene rig. Do not create eight renderers or re-fetch the same shoe at each transition. Controllers receive `{ root, scene, camera, rig, assets, bus, signal }`, implement `seek(localProgress, direction)`, and return `dispose()`. The master timeline is the only owner of pinning and chapter handoff. A new controller is not permitted to add a competing pin.

`chapterState(index, local, direction)` returns `{ chapter, id, local, global, direction }`, with `local ∈ [0,1]` and `global = (chapter + local) / 8`. The bus updates imperatively, outside any framework render cycle. Chapter 0 currently publishes only global `[0, .125]`; the remaining seven ranges are contracts, not fake completed sequences.

Three.js uses a right-handed Y-up space. Imported licensed geometry is centered under `rig`, normalized to a maximum extent of 2.2 scene units, and the original mesh names/transforms remain available beneath it. A transition snapshot includes camera position/quaternion/FOV, rig position/quaternion/scale, component local transforms, material values, lighting, background and layer visibility. `outgoing.seek(1)` must equal `incoming.seek(0)` for every shared property. Controllers calculate transforms from saved neutral transforms, never accumulate changes with `+=`. Reverse scrolling must restore the same snapshot exactly.

| Chapter | Scene and future choreography | Required handoff |
| --- | --- | --- |
| 01 Hero | Typographic depth, silhouette rotation, camera dolly | One centered shoe; matched camera/lights enter exploded sequence |
| 02 Deconstruction | Named outsole/midsole/upper/laces/insole/heel components separate on authored paths | Macro-target component ends at known world transform and camera target |
| 03 Materials | Dolly between authenticated surface details | Same material, UVs, target point and exposure enter technology |
| 04 Technology | Actual feature diagram/wireframe and controlled surface reveal | Reassembled neutral shoe and camera match first gallery composition |
| 05 Collection | Vertical progress maps to horizontal product gallery | Featured product asset preloaded; departing and entering silhouettes align |
| 06 Featured | Product-to-product handoff, variant-aware final object state | Stable featured pose becomes campaign anchor; direct product access persists |
| 07 Brand | Merchant campaign imagery, typography masks and depth | Final campaign layer reveals the shoebox environment without hard cut |
| 08 Finale | Camera approach, hinged lid, interior light, product rise, commerce handoff | Product rest pose agrees with readable, native purchase interface |

Future controller assets must preload before their chapter activates. On missing data, use the accessible DOM product content and authored image fallback. Technical claims are drawn only from merchant data.

## Motion, responsive behavior and lifecycle

M01 has a short reversible foundation scrub: typography moves behind the shoe, the planar visual shifts slightly, and its bottom rule fills. The editorial refinement removed the non-informative orbital stroke and marker tracks. A flat concept image never spins or impersonates real 3D. It deliberately does not claim to be the completed cinematic hero. One pinned stage uses the section's existing scroll length (`pinSpacing:false`), ending before the footer. Travel is 16svh desktop and 8svh mobile, with separately composed type and controls. Future chapter lengths are responsive and coordinated by the master; only one pin is active at a time.

Lenis runs from GSAP's ticker in milliseconds. The shared scheduler attaches only while smooth scrolling or scene work needs it. Native touch scroll is preserved. Native dialogs, visible modal interfaces and the mobile menu pause smooth scrolling; visibility changes pause rendering. Forms, keyboard navigation, checkout and normal anchors remain native.

Each foundation mounts in `gsap.context` and responsive `gsap.matchMedia`. A condition scope owns its observer, abortable model fetch and eventual async cleanup. Breakpoint changes, reduced-motion changes, Shopify `section:unload`, page exit and back/forward cache restoration cancel and release resources. Section reloads are idempotent. Product event handlers use an abort controller. Runtime preference changes remount the correct alternative.

Reduced motion has no Lenis, pin, animated transform, scene chunk import or model fetch. Native content and optional product image remain present. No-JS also uses the native stage and forms.

## Performance and failure handling

The model starts loading only within 200px of the stage. Renderer DPR caps are 1.75 desktop / 1.25 mobile, with no post-processing or particle system in M01. Intersection and document visibility pause draw calls. ResizeObserver updates aspect and renderer bounds without a per-frame layout read. WebGL context loss exposes the fallback; restoration resumes the same scene. Loading, import, network and renderer failures expose a polite status message.

Disposal releases geometry, materials, shared textures, ImageBitmap sources, observers, subscriptions, renderer and canvas. Pending parse results are immediately disposed after an unload. Production FPS, GPU memory and actual GLB quality require licensed assets and physical-device profiling; none have been measured against real merchandise yet.

## Validation limits

Local preview renders these same Liquid sources using a small Shopify-tag adapter and explicit fixtures. It cannot emulate Shopify's server, inventory, markets, tax, checkout, metafield formatting or filter provider. Commerce is disabled and POST requests return 405. Shopify store preview and checkout testing are required before release.
