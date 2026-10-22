# Visual recovery implementation

The measured baseline lives in `.work/recovery/`: a frozen theme, actual ScrollTrigger records and screenshots at 0/25/50/75/100%. Root owns the before/after issue matrix and five-device visual decisions. These notes describe implementation, not proof that a visual issue is resolved.

The existing Archivo, blue/cyan/ocean palette, Shopify section settings, native product forms and image precedence remain. No new imagery, dependencies or model assets were introduced. The installed frontend, Impeccable, GSAP, photo-composition and Three.js lifecycle/accessibility guidance informed the changes.

## Composition contracts

- Hero has a protected readable type zone beside the model, with stacked type above the product on phones. Both words stay whole at every scrub state. Copy and commerce remain stable. The canonical intro takeover/reverse contract remains.
- Anatomy groups its heading, introduction and observations in one aligned column beside a profile view. The negative image offset is removed. Its image sequence holds the first profile through the incoming handoff before advancing to the heel and sole.
- On desktop/tablet, the bundled TN's existing renderer/canvas bridges Hero release into that profile frame. A temporary neutral overlay preserves one canvas while the viewport rectangle and rig orientation move toward the existing profile shot; a short dissolve acknowledges the different render lighting. The bridge is disabled for merchant models and stacked phone layouts. It restores parent, sibling, canvas styles and target opacity on reverse, context loss and teardown. No second camera journey or renderer is claimed for phone/image fallbacks.
- Materials uses moderate source-specific crops that retain recognizable cage, upper and tread landmarks. A single panel mask owns both the subject image and its caption. The outgoing caption fades when the new wipe starts; the incoming caption appears after the new landmark establishes. Reverse restores the former caption. Caption spacing is directly tied to the frame.
- Technology uses a wide, low product adjacent to its information. The whole-section wipe is removed to avoid conflicting masks and empty dark approach states.
- Collection uses a larger diagonal opening, a right-aligned heel with a lower left caption, and a narrower top view with a lower right caption. Three views remain three views of one study. Pins are shorter; the final view stays visible.
- Featured uses a tighter image/name/story/action grouping. Only known model fallback imagery receives additional scale; merchant images remain separately handled.
- Brand aligns its type with the image edge and uses one explicitly defined crop baseline for the motion controller. Arbitrary negative text offsets are removed.
- Finale uses a much larger anchored product, an entire readable title and controls introduced at the sequence's resolution. The legacy laptop width cap is overridden intentionally. Phones use a clamped reachable end so late commerce can appear before the page ends. No shoebox, glow or particles were added.

## Diagnostic boundary

`body[data-local-preview]` plus `?inspect=1` enables hidden `[data-scroll-trigger-record]` outputs. They read existing trigger start/end/progress/pin/active/chapter/identity through the shared scheduler. They do not create triggers, canvases, globals or another ticker. Pagehide removes the reader and DOM; persisted pageshow recreates them. Live Shopify output and ordinary previews do not mount diagnostics.

## Validation boundary

The existing build, test, structure and Theme Check commands have passed during integration. Browser captures and final counts belong in the final verification record after the last visual iteration. Existing merchandise, missing-image, localization, lifecycle and real-GSAP intro takeover regressions remain authoritative. Automated checks do not establish visual quality.
