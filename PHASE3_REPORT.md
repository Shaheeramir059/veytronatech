# Phase 3 — Continuous cinematic transformations

Implemented October 8, 2026 in the local prototype. All six sections, copy, navigation, branding, links and contact CTA remain. One R3F Canvas and the existing GSAP ScrollTrigger continue to drive the journey. No deployment, live-site change, external assets, new dependencies or paid services were involved.

## Choreography

| Pair | Implemented technique |
| --- | --- |
| 1 → 2 | Existing six-band sculpture-to-website morph equations, topology, chrome rim shader and camera path are preserved. The repaired Mesh geometry constructor and bloom ownership remain. |
| 2 → 3 | A prepared carrier begins with positions and normals copied exactly from the unfolded website bands. Website surfaces separate into 38 instanced tiles; depth offsets peel them toward automation connections. Six chrome strips reorganize into node surrounds, nine persistent tubes become the network links, and seven instanced nodes settle at the original network positions. The original wire shells and outer halo remain. |
| 3 → 4 | The same tubes bend from links into waveform arcs. A shared scroll-driven spiral rotates their vertices and normals together with node/fragment poses. Nodes become small audio elements, and the 38 surface fragments become the original radial bars. Chrome strips form layered circular rings; the original voice torus and center sphere provide destination detail. |
| 4 → 5 | Circular strips reshape into nested portal frames with the original five-layer spacing and dimensions. One moving entrance frame and a camera dolly provide passage through the portal. Desktop lateral camera travel uses off-axis projection to keep the artwork in its column; mobile stays centered. The original reflective floor and wire orb overlap the persistent frame assembly. |
| 5 → 6 | Portal strips fold into two chrome V arms and rear rims. Paths and fragments converge along the emblem edges, while the floor folds upward and the orb moves inward. The original octahedron remains as a smaller core behind the V; the original halo orientations/radii are represented by shared strips. The existing contact CTA stays unchanged. |

Each later interval holds its source at the anchor, transforms over normalized stage offsets **0.08–0.92**, and settles before the next anchor. Secondary details have overlapping support windows. They supplement a continuous carrier rather than replace it through whole-scene fades or scale swaps.

The hero hands off to matching carrier geometry over stage **1.02–1.08**, before the next deformation starts. This is gated by successful background shader preparation and offscreen upload. The source bands remain opaque beneath the prepared copy during this overlap, with depth writes disabled only during overlap to avoid coplanar fighting. The carrier explicitly shares the hero reflection map and 1.7 intensity. Background website details dissolve as their surface fragments take over.

## Resources, loading and rendering

- Six closed strips and nine open tubes each have four compatible position/normal targets. Their indices remain fixed. No octahedron, sphere or incompatible surface topology is forced into a morph. Fragment/node shapes use instancing and pose interpolation instead.
- Morph weights, instance poses, spiral uniforms, camera, secondary detail motion and typography are functions of scroll stage. Later artifacts and background stars no longer use elapsed-time movement. Forward/reverse scrolling samples identical states once resources are available.
- Later code remains dynamically imported after the hero's first submitted frame. Geometry preparation yields between six ribbon builds and five path-anchor builds: eleven idle slices with the existing bounded scheduler. All future carrier shapes are prepared together; secondary details retain incremental, scroll-aware loading.
- The carrier is published after complete construction. Reference-counted caches share pending preparation and survive cleanup/replay. A quality replacement keeps its previous package alive until new meshes commit; the last owner releases geometry and materials. Unmounted async consumers release completed leases.
- Cached geometry stays mounted throughout later scrolling. Instance matrices use persistent scratch storage, update only when scroll/readiness changes, and use dynamic buffers. Shader source/cache keys, geometry and materials stay stable on scroll; only weights, matrices and uniforms change.
- One persistent three-light rig follows the artwork, preserving the opening light positions/intensities and avoiding duplicate lights or light-count shader variants during handoffs. Preparation clones share geometry, materials and instance buffers, and receive the same environment and light count.
- Existing desktop/mobile DPR caps, hidden-tab suspension, bloom settings/fallback, reduced-motion static fallback, HTML loading independence, keyboard links and focus styles remain. Mobile later geometry also uses fewer subdivisions. Subtle copy backing protects later-section text during portal travel, and typography shifts respect reduced motion.

## Validation

`npm run typecheck`, **all 30 tests**, and `npm run build` pass. Seven new tests cover:

- All five transition pairs sampled forward and backward, including the original hero regression.
- Anchors and both edges of every transition window; finite, convex morph states and continuous pose matrices/camera offsets.
- Exact website handoff positions/normals, matching morph topology, finite attributes and conservative endpoint bounds for both presets.
- Shared idle preparation, concurrent ownership, replay reuse and single final disposal.
- The actual TSX later assembly in the installed R3F CPU reconciler: real Three morph upload logic, stable geometry/material identity, unchanged-frame upload suppression, reflection-map/intensity matching, shader-hook construction, quality replacement and cleanup.
- Actual perspective projection of desktop artwork during portal camera travel.

The existing bloom failure/fallback, morph initialization, geometry cache, scroll mapping, preload priority, mobile-budget and six-scene tests continue to pass. CPU reconciliation does not establish GPU shader correctness or visual quality. Strict Mode lease replay is explicitly simulated; the standalone reconciler's Provider prevents automatic initial effect replay at the nested StrictMode boundary.

## Measured results

Production was built and served with `npm run start -- --port 3102 --hostname 127.0.0.1`. Six local HTTP requests measured first-process and warm server responses. The temporary server was stopped; existing port 3001 processes were not stopped or reconfigured.

| Measurement | Previous optimization record | Phase 3 final |
| --- | ---: | ---: |
| First production HTTP TTFB | 35.42 ms | 36.42 ms |
| First HTML chunk | 35.75 ms | 36.80 ms |
| Warm TTFB, median of five | 1.97 ms | 2.32 ms |
| Next reported route first-load JS | 153 kB | 153 kB |
| Dynamic World group, gzip | 246,371 bytes | 247,830 bytes |
| Later artwork chunk, gzip | 1,679 bytes | 4,784 bytes |

Branding, headline and CTA were present in every returned HTML response. The World group grew by 1,459 gzip bytes, about 0.6%; additional transition code stays in the later chunk. Historical and current server samples are separate runs, with uncontrolled host/cache variation. They establish no loading speedup and are not browser navigation or paint timings.

The initial implementation measured **24.02 ms** of synchronous desktop carrier generation. That finding prompted idle slicing. The final Node benchmark measured a maximum individual CPU slice of **5.74 ms desktop / 1.54 ms mobile**, with total preparation CPU work of **29.81 / 9.62 ms**. Slicing distributes work rather than reducing total generation cost; these separate runs also have timing variation. Browser idle scheduling and driver stalls are not measured.

Final Node pose/matrix update medians were **0.0125 ms desktop / 0.0075 ms mobile**; p95 values were **0.0275 / 0.0124 ms**. Carrier geometry has **5,568 / 2,592 triangles** and **516,168 / 243,432 bytes** of indexed position/normal/morph data, excluding secondary artwork, instanced meshes and driver overhead. These are CPU/storage measurements, not FPS or GPU timings.

Raw evidence: [phase3-production.json](performance/phase3-production.json), [phase3-cpu.json](performance/phase3-cpu.json), and the initial [phase3-cpu-initial.json](performance/phase3-cpu-initial.json). Existing browser profiling remains available through `?profile=1` and `window.veytronaProfile()`, now including carrier preparation wall time.

## Remaining browser acceptance

Localhost browser inspection remains blocked by the session's browser security policy. No alternate browser workaround was used. No screenshots, GPU shader compilation, first-visible-frame timing, FPS, browser forward/reverse scrolling, portal near-plane behavior, text overlap, transparency sorting or mobile visual results are claimed.

Very fast anchor jumps, slow chunk downloads or slow GPUs can outrun background preparation. The source remains available during initial preparation, but a late handoff at a deep scroll position can still require visual review. Desktop/mobile resizing, actual development Strict Mode, reduced-motion interaction and full context-loss recovery also need browser acceptance. The implementation is complete; cinematic visual approval remains pending.

## Changed files

- `src/components/HeroExperience.tsx`: matching prepared handoff, shared environment and extracted unchanged chrome shader.
- `src/components/World.tsx`: persistent carrier placement, shared lights, deterministic stars and portal camera.
- `src/components/LaterArtifacts.tsx`: persistent morph/instance assembly and retained destination details.
- `src/components/DeferredScenes.tsx`: carrier readiness, quality-aware warming and shared instance buffers/environment/lights.
- `src/components/CinematicExperience.tsx`, `src/app/globals.css`: later typography choreography and text backing, with unchanged copy/navigation.
- `src/lib/transition-motion.ts`, `src/lib/transition-geometry.ts`, `src/lib/chrome.ts`: pure choreography, cached compatible geometry and shared rim shader.
- `tsconfig.json`: allows explicit TS imports for the native Node source tests; `noEmit` and strict checking remain.
- `tests/transitions.test.mjs`, `tests/assembly-runtime.test.mjs`, `tests/helpers/component.mjs`: transition and actual component regressions.
- `scripts/phase3-cpu.mjs`, new performance JSON, `README.md`, this report: repeatable evidence and documentation.
