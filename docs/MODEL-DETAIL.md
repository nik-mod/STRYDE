# Detailed model and safe hero framing — 2026-10-22

The bundled `assets/nike-tn-blue-white.glb` is rebuilt from the original local download, `New Project 10_22_2026 (1).glb`. This is a geometry upgrade from that export, not a new reconstruction or an upscaled texture. Its three original 2048px PBR images are preserved byte-for-byte. It remains a generated, fused preview model with the source's limitations, rather than verified merchandise photography or an authentically separated engineering model.

| Model | Triangles | File bytes |
| --- | ---: | ---: |
| Previous storefront asset | 115,586 | 4,293,624 |
| Original local export | 963,230 | 5,622,996 |
| New storefront asset, including framing hull | 327,498 | 2,638,764 |

The new version retains about 2.83 times the previous triangle count while reducing file size by about 39%, including its framing metadata. GLTFLoader uses the Meshopt decoder shipped by the existing Three.js dependency. No new production package, CDN, renderer, ticker or scroll controller is required. The viewer still draws only when dirty and visible, with a 1.6-million-pixel buffer budget. These limits do not guarantee 60 FPS on every device.

## Reproduce the asset

Use glTF Transform CLI **4.5.1** (a build tool, not a production dependency). From the project root, substitute the path to the original export:

```powershell
npm exec --yes --package=@gltf-transform/cli@4.5.1 -- gltf-transform simplify 'PATH/TO/New Project 10_22_2026 (1).glb' .work/tn-detail-candidate.glb --ratio 0.34 --error 0.0003
npm exec --yes --package=@gltf-transform/cli@4.5.1 -- gltf-transform meshopt .work/tn-detail-candidate.glb .work/tn-detail-compressed.glb --level high --quantize-position 16 --quantize-normal 12 --quantize-texcoord 14
node tools/models/bake-framing-hull.mjs .work/tn-detail-compressed.glb .work/tn-with-framing.glb
```

Inspect the candidate before replacing `assets/nike-tn-blue-white.glb`. The previous version is backed up in `.work/tn-before-detail.glb`. Do not rebuild from the old reduced storefront asset: simplification cannot restore discarded geometry.

Original SHA-256: `3c28869de5e75b9a905b664c617b6b56c13ba6d429b0abdd0ee17d1a1fb73b85`.

New asset SHA-256: `34a38ee43af71cd0224c744d9a5bb6f1460e0f37447b00e19ea07c913f63e45d`.

## Framing repair

Previously the hero applied a DOM scale up to 1.62 while also moving the camera closer and rotating the shoe. This stacked zoom clipped the heel/toe. The first safe fit then made the shoe too small by projecting empty corners of an expanded bounding box and retaining an unnecessarily distant camera. The final fit uses 3,546 convex-hull points baked once from the actual mesh. They fill a 94% camera safe area after pose and viewport changes, without a second DOM zoom. No hull construction runs in the browser. Merchant models without this optional metadata use the transformed corners of their original bounds. Image-only fallbacks retain their authored motion. Reverse seeks remain deterministic.

Collection figures now use 60% of the stage without the former 720px cap. TN editorial views receive a 1.15 scale to compensate for transparent padding; the final scene no longer shrinks to 0.88 at the exit. Native product photos retain containment without the TN-specific enlargement.

Collection's last scene retains its title, context and link through the pin's end, instead of leaving an empty copy column beside the shoe. Merchant model URLs, product metafields, product data and purchase controls remain supported.

## Current rendering limits — 26 October 2026

The restoration pass re-inspected the actual 2,638,764-byte GLB: one fused mesh/material, 327,498 triangles and three embedded 2048×2048 WebP maps. The material names identify a generated Tripo export. The packed map has useful roughness variation; its red channel is almost uniformly white (mean 254.47/255) and is not treated as a newly discovered AO asset. Original UVs, geometry, maps and file checksum remain unchanged.

Achievable with these inputs: improve grazing-light response from the original normal map, moderate the pale upper's plastic-looking gloss, retain matte blue textile/foam and dark rubber separation, use directional key/rim lighting, cast shadows and safe whole-shoe framing. Normal response is stronger only in the existing blue-upper relief and softer on pale overlays. Broad height/color finish classification is an estimate, not a verified component mask.

A substantial further realism gain requires an accurate authorized source model: separated laces and cage, correct toe and sole geometry, modeled Air-unit interior/transmission, accurate UVs and measured textile/roughness/normal maps. The current fused, partly baked atlas cannot supply these through lighting, shaders or DPR. It is a disclosed generated preview, not a 1:1 digital twin.

Current Hero budgets: a single renderer and continuous terrain mesh; up to 2M rendered pixels on desktop / 650k on phones, desktop/mobile DPR caps 1.5/1.25, cached 512/256px cast shadows, paused offscreen/hidden, static fallbacks for reduced motion and missing WebGL. Other chapters retain demand rendering.
