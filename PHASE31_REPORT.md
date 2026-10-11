# Phase 3.1 — Cinematic polish and visual QA

Implemented locally on October 8, 2026. All six sections, wording, links, navigation, VeytronaTech branding and contact CTA are retained. No deployment or live-site changes. No new dependencies, geometry, textures, render targets, lighting or postprocessing passes.

## Findings and changes

The previous controller translated only the heading by up to 18px while its section scrolled normally underneath a fixed 94px desktop header and footer. It had no viewport reading bounds. This explains how partially visible headings can reach those overlays. The .99 heading line height also offered little room for glyphs, and unconditionally nowrap headings had no width fitting after the deferred font swap. Browser footage was described by the user; new footage could not be inspected in this session.

The controller now moves the entire existing copy block into a measured reading slot. Desktop protects the top 112px and bottom 86px; mobile protects the top 100px and bottom 76px. A subtle 32px scroll-driven drift accompanies the handoff. Copy stays fully opaque within 0.24 of its own scene anchor, then eases out by 0.5; the next block eases in symmetrically. Complete headings stay inside the slot while visible, with no simultaneous reading blocks occupying it. The deliberate midpoint handoff gives the persistent transforming artwork a brief text-free beat; 3D remains present. Headings, descriptions and CTAs no longer move independently or collide with each other.

All measurements are refreshed after viewport/font changes; reads and writes are batched and no bounding rectangles are read in the scroll callback. Long lines fit their existing column using measured width, and line height is 1.08. Desktop copy is bounded to min(610px,44vw); mobile keeps its upper copy region and existing lower artwork region. Sections can grow for oversized content rather than pushing the heading above their top. Reduced motion or a copy block taller than the protected viewport uses normal document flow, with no copy fading or transformation. Semantic content/tab order remain intact. Focusing a later CTA by keyboard scrolls to its measured section anchor; event listeners, transforms and inline styles are removed on cleanup.

## Camera and visual continuity

| Pair | Refinement |
| --- | --- |
| 1 → 2 | Original hero motion, geometry, lighting, bloom and camera equations remain. The elevation exit blends continuously into the later rail. |
| 2 → 3 | A shallow 0.32-unit dolly, 0.10 lateral arc and 0.06 elevation crest follow fragment separation. Website/network endpoint artwork is unchanged. |
| 3 → 4 | A 0.48-unit dolly and opposite 0.12 lateral arc accompany contraction. Spiral rotation is reduced from 0.90 to 0.62 radians, with the camera elevation coordinated to the same transition envelope. |
| 4 → 5 | Existing 2.4-unit portal dolly and aperture alignment remain. The entrance-strip flight peaks at 6.4 units instead of 9, preserving depth travel while preventing the strip from reaching the camera. |
| 5 → 6 | The existing return dolly is accompanied by a shallow 0.16 lateral arc and 0.04 elevation crest as the portal folds into the V. Final sculpture pose and CTA are preserved. |

All arcs use the existing quintic scroll transition envelope; there is no elapsed-time integration. Generalized off-axis projection compensates lateral/dolly motion to retain the desktop artwork column. Mobile stays horizontally centered. Camera position and velocity continuity are tested at anchors/window boundaries, including the first-to-second regression. Existing carrier geometry, cached resources, morph initialization, preparation readiness, scene preload deadlines, hidden-tab suspension, quality presets, DPR caps and bloom ownership are untouched.

The old nine-unit strip flight has a concrete geometric defect: a CPU sweep of the actual interpolated entrance geometry, through the current camera transform, gives a minimum depth of **−0.2467 world units**, crossing behind the camera. With the repaired flight the minimum is **2.3532 units**, safely ahead of the 0.1 near plane. The sweep samples both desktop and mobile across stages 3–4. This is geometry evidence, not a browser screenshot or GPU observation.

Translucent fragments, voice torus/sphere, portal floor/orb and final wire detail no longer write occluding depth. Carrier chrome and nodes disable depth writes during their initial partial-opacity handoff and restore them when effectively opaque. Depth testing remains enabled; chrome still occludes glow at settled states. The folding floor renders both sides. No shader source changes, cache-key changes or material recreation occur on scroll. Actual transparency sorting and visual brightness still require GPU inspection.

## Validation and measurements

`npm run typecheck`, `npm test` (**34/34**) and `npm run build` pass. Four added tests cover:

- Six copy blocks with modeled dimensions at 1440×900 and 390×844, slow/rapid sampled progress, forward/reverse equality, viewport bounds and collision-free handoffs.
- Reduced motion, oversized/zoomed copy and font-width fitting.
- Camera position/velocity continuity at anchors and transition edges, with unchanged hero equations.
- Near-plane clearance using actual morphed portal vertices in Three.js.

The existing actual TSX/R3F assembly test additionally checks depth-write policy during the handoff and on translucent fragments. It continues to check stable materials/geometry, reverse instance states, unchanged-frame upload suppression, quality replacement and cleanup. Existing bloom, Strict Mode lease replay, morph initialization, preparation and six-scene tests continue to pass. These CPU tests do not render GLSL or prove browser layout/GPU behavior.

A fresh production process was started using `npm run start -- --port 3102 --hostname 127.0.0.1`, measured with six local HTTP requests, then stopped. The development preview at port 3001 was retained.

| Measurement | Historical Phase 3 | Phase 3.1 |
| --- | ---: | ---: |
| First-process HTTP TTFB | 36.42 ms | 41.84 ms |
| First HTML chunk | 36.80 ms | 42.58 ms |
| Warm HTTP TTFB, median of five | 2.32 ms | 2.12 ms |
| Next reported first-load JS | 153 kB | 153 kB |
| Dynamic World group, gzip | 247,830 bytes | 248,489 bytes |
| Later artwork chunk, gzip | 4,784 bytes | 4,806 bytes |

Branding, headline and CTA are in every HTML response. The World dynamic group grew by 659 gzip bytes, about 0.27%; the later chunk grew by 22. Existing morph geometry storage and subdivisions are unchanged. These separate server runs have uncontrolled host/cache variation and establish **no browser loading or FPS improvement**. Raw current results are in [phase31-production.json](performance/phase31-production.json), with prior evidence in [phase3-production.json](performance/phase3-production.json). Development cold reload was not re-benchmarked; it must not be inferred from production HTTP timing.

## Browser limitations and remaining acceptance

Session browser policy blocks localhost inspection. No alternate browser/protocol workaround was used. No screenshots or actual browser scroll tests are claimed. Canvas mount, WebGL context creation, shader/PMREM duration, first pixel presentation, frame intervals and scene readiness could not be collected from the existing instrumentation. The existing `?profile=1` / `window.veytronaProfile()` remains available for that QA; its frame intervals are CPU/requestAnimationFrame evidence, not GPU timer queries.

Still required at desktop 1440×900 and mobile 390×844:

1. Cold/warm development and production reload traces; first visible artwork and delayed-font stability.
2. All five transitions slowly and rapidly, forward and backward; verify reading-slot handoffs, long headings, copy backing, portal perspective and final CTA prominence.
3. Transparency sorting, mesh intersections, reflection/brightness consistency and mobile artwork composition on real WebGL.
4. Scroll frame-interval distributions, draw/triangle counts, scene-prepared marks and console diagnostics, including rapid anchor jumps outrunning background readiness.
5. Resize/zoom, keyboard tab/anchor navigation, reduced motion, WebGL fallback and development Strict Mode behavior.

## Files changed

- `src/components/CinematicExperience.tsx` — complete-copy choreography, cached refresh measurements, font fitting and keyboard focus handling.
- `src/app/globals.css` — readable line boxes, bounded desktop copy column, whole-copy transforms and expandable normal-flow sections.
- `src/lib/typography-motion.ts` — pure reading-slot, handoff, width-fit and reduced-motion/oversize rules.
- `src/lib/transition-motion.ts` — later camera arcs, continuous elevation exit, generalized projection compensation, restrained spiral and safe portal flight.
- `src/components/World.tsx` — camera elevation rail integration.
- `src/components/LaterArtifacts.tsx` — translucent depth-write policy and double-sided folding floor.
- `tests/polish.test.mjs`, `tests/assembly-runtime.test.mjs` — new boundary/clearance/continuity and depth regressions.
- `performance/phase31-production.json`, `README.md`, this report — measurements, outcomes and remaining QA.
