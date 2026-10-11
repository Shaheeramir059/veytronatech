# Phase 2 — Cinematic Hero Experience

Implemented locally on October 8, 2026. All six narrative sections, their copy, anchor navigation, branding, GSAP section mapping, and contact link are retained. Scenes 3–6 retain their existing artwork. Nothing was deployed and the live website was not modified.

## Artwork and choreography

Six intersecting, twisted metal ribbons surround a chrome V and a small knot core. A generated PMREM studio environment supplies reflections; three local lights and a small Fresnel rim shader add restrained cyan highlights. Seeded particles supply depth without time-dependent hero motion or external assets.

The same six ribbon meshes use GPU position and normal morph targets to unfold into three double-framed website panels. Panel contents expand into place while the core retreats. One persistent assembly travels alongside the camera over the first stage spacing. Camera position, morph weights, tilt, panel reveal, bloom, and first-two-scene heading offsets derive directly from scroll position. The quintic easing function has flat endpoint tangents, and reverse scrolling retraces the same hero poses without elapsed-time dependencies. Later scenes keep their original ambient animation and scale transitions.

## Quality and lifecycle

| Budget | Desktop | Mobile (≤760px) |
| --- | --- | --- |
| Ribbon segments | 160 | 72 |
| Hero particles | 110 | 36 |
| Maximum DPR | 1.5 | 1.15 |
| Bloom input scale | 50% | 30% |

The base scene remains at its clamped DPR; only bloom buffers use reduced resolution. Bloom strength is 0.17, threshold 1.1, and radius 0.28. It fades to zero by Scene 2; later stages bypass the composer. Bloom alpha derives from light energy to retain the transparent canvas backdrop. Visual tuning of these values is provisional until browser QA.

Hero morphs run on the GPU without rebuilding vertex buffers per frame. The World remains memoized; progress updates use refs. Hidden documents pause the frame loop. Hero update callbacks skip work once its assembly is invisible. Effects dispose ribbon buffers, generated environment textures, and composer targets/passes; event listeners and GSAP triggers retain cleanup. Reduced-motion users receive the static branded fallback and no animated WebGL canvas; keyboard focus and skip navigation remain available.

## Changed files

- `src/components/HeroExperience.tsx`: sculpture, website panels, procedural environment, rim shader, bloom, and cleanup.
- `src/lib/hero-geometry.ts`: ribbon and website-frame morph topology with conservative bounds.
- `src/lib/hero-motion.ts`: pure scroll choreography and quality budgets.
- `src/components/World.tsx`: integrate the shared hero/websites assembly, deterministic camera travel, presets, and hidden-tab pause.
- `src/components/CinematicExperience.tsx`: scroll-coordinated heading offsets for the first two scenes.
- `src/app/globals.css`: scoped hero/website typography sizing and reduced-motion override.
- `tests/hero-motion.test.mjs`: five animation, geometry, and budget tests.
- `README.md` and this report: Phase 2 status and limitations.

No dependencies were added.

## Validation and limitations

- TypeScript: passed.
- Automated tests: 12 passed, 0 failed, including the four original smoke checks.
- Production build: passed.
- Browser QA: blocked by an earlier browser security policy rejection for localhost in this session. No alternate browser surface was used to bypass that rejection.
- Desktop/mobile screenshots, GPU shader compilation, runtime console, measured frame rate/memory, visual text clearance, and forward/reverse browser interaction remain unverified. Source and numerical tests do not substitute for these checks.
- The folder has no Git repository, so no commit was created.

The bloom and reflective material settings are implemented but have not been visually approved. Test the local preview at desktop 1440×900 and mobile 390×844, including restored anchors, forward/reverse scroll through all six stages, reduced motion, keyboard navigation, and WebGL-unavailable fallback before accepting the visual milestone.
