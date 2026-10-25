# TN models in the existing homepage chapters

The extra bottom spotlight section was removed at the owner's request. The homepage keeps its original eight chapters and original design. The hero and main intro product retain the original blue/white shoe; the intro triptych also shows the Drift and a white/cyan TN.

Chapter 02 now presents the white/black Air Max Plus Drift, using the existing anatomy layout. Its heading, five descriptions, metadata, profile/upper/outsole fallbacks and notes match the new model. Chapter 03 keeps the existing three material panels and navigation: blue Air Max Plus for Color, white/black Drift for Structure and Foundation, each with matching images, inset, text and specs. Chapter 06 now presents the third supplied deep blue/navy Air Max Plus in the existing feature layout.

The existing journey renderer now caches both models and selects one from the active visual window. Each model keeps its native base yaw and framing points. The Drift is requested shortly before its first chapter, and both models share one canvas, lighting, camera and scheduler. Unavailable assets fall back to the matching images.

The previous two-model pass completed build, 80 tests and theme validation. Regression coverage confirms the original opening stays blue, the new shoe appears in chapter 02 and the two relevant chapter 03 panels, and the extra section is absent. Camera fitting was sampled across the actual Drift hull at phone, square and desktop ratios. Chrome confirmed chapter 02 uses the live Drift; chapter 03's three controls select the correct blue/white model and captions in both directions, with only one canvas and no console errors. A 390px phone preview showed the new model and metadata without horizontal overflow and the Drift material panel with matching text.

The updated transition keeps the shoe opaque. A continuous heel turn aligns both models in the same position and silhouette envelope, and complementary surface clipping changes the subject during that matched view. One camera and one canvas remain in use; there is no alpha fade between shoes. Captions reveal in sequence without overlapping titles.

Local preview: http://localhost:9292/. Chapter 02: /#chapter-deconstruction. Chapter 03: /#chapter-materials. No commit, push or deployment was requested.


## Third-model extension

Chapter 06 keeps one opaque, camera-aligned silhouette during the blue-to-navy turn. Its desktop composition pins only when the entire section fits in the viewport; flowing layouts follow the actual visible model frame. The original intro is unchanged. Deep blue/navy and Drift delivery meshes each use 180,000 triangles with the original texture maps, materials and node transforms. Their measured simplification errors are below 0.001. Original source files are preserved.
