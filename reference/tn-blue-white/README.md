# Nike TN blue/white reference intake — 2026-10-22

Status: reference preparation complete; actual 3D export blocked by Meshy subscription. No new GLB has been created or installed in the storefront.

## User references

- `user-reference.png`: user supplied lateral photograph; target blue upper, white cage, white mudguard and midsole, blue shank and Air windows, black outsole.
- `video-frames/`: 10 samples, one per second, decoded from the user's approximately ten-second recording. These are sampled frames, not every source frame.
- `recording-contact-sheet.jpg`: overview of the sampled rotation. Recording shows generated geometry; it is useful for appearance review, not ground-truth product dimensions.

## Online references

`product-view-01.jpg` through `product-view-08.jpg` and `sources.json`: eight photographs of Nike Air Max Plus University Blue Gradient / Celestine Blue, FJ4736-400.
Source article: https://sneakernews.com/2023/01/24/nike-air-max-plus-university-blue-gradient-fj4736-400/

These are RELATED silhouette references, NOT an exact verified colorway match. The photographed FJ4736-400 has a darker cage and blue mudguard; the target photograph has white cage and mudguard. Do not use their colors as the reconstruction target or claim the target's SKU is confirmed. Sources are research references; publication rights have not been established.

## Existing generated model

An existing blue/white TN model matching the overall target appearance is visible in the user's Meshy workspace:
https://www.meshy.ai/workspace?model-tab=image-to-3d&sidebar=print

Observed mesh: 1,022,642 triangles, 536,579 vertices. Export settings offer GLB, but Download opens 'Subscribe to download'. No subscription or purchase was made. `meshy-export-block.png` records the blocker.

The reference recording shows another approximately 963k triangle state. Neither count is suitable as an unoptimized homepage asset.

## Integration once GLB export is available

1. Export the textured GLB through Meshy's supported download flow.
2. Inspect its silhouette, hidden side, tongue, heel badge, lace geometry, air cavities and outsole against references. AI reconstruction may contain inaccurate details.
3. Reduce geometry to the existing project budgets in docs/ASSETS.md; preserve the cage and sole silhouette. Bake normals if needed. Downsample textures deliberately.
4. Export a self-contained GLB with embedded textures, Y up and centered geometry. Current src/scene.mjs supports uncompressed GLB; compression requires explicit decoder support.
5. Inspect whether component separation is possible. A fused generated shell does not provide authentic exploded components. Do not rename arbitrary chunks as real engineering parts.
6. Use the existing configurable model URL in the cinematic hero for local review, then validate visual quality, performance, reverse scrolling and fallback behavior.

No theme code, product catalog or live Shopify theme was changed during intake.
