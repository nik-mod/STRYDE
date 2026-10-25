---
version: 1
slug: "sections-chapter-brand-liquid"
primary_target: "sections/chapter-brand.liquid"
related_targets: ["src/motion/chapters.mjs","src/journey-scene.mjs","src/journey-poses.mjs","assets/experience.css"]
---

# Brand studio replacement

Mode: Experience. The owner rejects the paired enlarged raster wall in chapter07 and asks for a more interesting ScrollTrigger section. Preserve the established ocean/ice/cobalt palette, local Archivo family, surrounding chapters and Shopify asset precedence.

THESIS: The real sneaker is revealed through changing light and perspective, rather than enlarged photographs.

FIRST VIEWPORT: One well-framed live3D sneaker in an ocean studio, with a compact heading and clear view/caption zone. No paired image wall, huge display paragraph, or product covering navigation. The whole-shoe fallback remains useful if WebGL or motion is unavailable.

SIGNATURE: A bounded GSAP scroll sequence inspects profile, upper and foundation with ±.62-radian pitch and zero roll. The camera holds a stable fit while a real light moves across the surface; the final foundation view holds. Labels describe actual visible surfaces. Reverse scroll, seeks, reloads and media changes resolve to the same authored state. Use the existing renderer/model cache/scheduler, with separate clipped chapter windows at boundaries.

CONSTRAINTS: No new libraries, extra WebGL contexts, invented product claims, replacement fonts or image-generation requirement. A selected merchant campaign image remains authoritative. Keep collection and chapter links functional, no-JS/reduced-motion content readable and phone stages free of collisions. No commit/push/deploy.

VERIFY: Quarter-scroll stops forward/reverse on1440×900,2556×1438,390×844 and375×667; incoming/outgoing boundaries; midpage reload; fallback/reduced motion; one renderer; no overflow/pageerrors; no empty pin intervals or blurry upscaled macro plates.
