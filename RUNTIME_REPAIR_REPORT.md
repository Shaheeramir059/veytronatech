# Cinematic hero runtime repair — October 8, 2026

The local project is repaired without removing bloom, changing artwork or reverting staged loading. No live site, deployment, dependencies, quality presets, GSAP mappings or scene definitions were changed.

## Exact cause and evidence

The undefined value was **`mesh.morphTargetInfluences`**, called `objectInfluences` inside the installed Three.js `WebGLMorphtargets.update()`. At `node_modules/three/src/renderers/webgl/WebGLMorphtargets.js:140`, Three loops over `objectInfluences.length`.

Before the repair, Ribbon rendered an empty `<mesh>` and attached its cached morph geometry afterward through `<primitive attach="geometry">`. Three initializes morph influences in the Mesh constructor through `updateMorphTargets()`. R3F's subsequent geometry attachment does not perform that initialization. The geometry had valid morph attributes, but its mesh had undefined influences. Ribbon's optional guard skipped its animation update; RenderPass still submitted that mesh to Three's renderer and crashed.

This is supported by two executed reproductions:

- An actual installed R3F reconciler mounts the old primitive tree: its mesh has the expected geometry and undefined influences, and the real installed morph uploader throws the reported `.length` error.
- A real EffectComposer/RenderPass invokes that uploader and reproduces the full exception path. The complete stack is saved in [performance/runtime-crash-stack.txt](performance/runtime-crash-stack.txt). Run `node --experimental-strip-types scripts/reproduce-morph-crash.mjs` to regenerate it.

The stack is a **CPU reproduction**, not a captured browser stack. Its relevant frames are `WebGLMorphtargets.update → CPU renderer → RenderPass.render → EffectComposer.render`. The exception did not originate from an undefined composer pass array or bloom mip array.

## Repair and ownership audit

- Ribbon now constructs `<mesh args={[geometry]}>`. Morph influences exist before rendering or compilation, and R3F reconstructs the mesh correctly when a quality change replaces geometry. Geometry remains owned by the existing reference-counted cache; the material remains a React child. Ribbon topology, normals, chrome shader and animation formulas are unchanged.
- Bloom is isolated in `src/lib/bloom-pipeline.ts`. Its cache uses **renderer, scene and camera identities** because RenderPass retains both scene and camera. The previous renderer-only cache could retain stale bindings after reuse. This was a separate lifecycle risk, not the reproduced `.length` cause.
- Initialization creates RenderPass, UnrealBloomPass and OutputPass, configures composer DPR/targets and reduced bloom dimensions, and only then publishes a ready lease. HeroBloom acquires it in a layout effect before its frame subscription can render it. Size validation rejects invalid dimensions; existing desktop/mobile scale and bloom parameters remain intact.
- Leases have idempotent release and deferred final disposal. A synchronous Strict Mode cleanup/setup replay reacquires the same live resources before the microtask disposes them. The last owner disposes once; failed or disposed entries cannot be reused. Failed initialization releases partial allocations.
- All pass resources and composer buffers/copy pass are released. The installed r178 UnrealBloomPass disposal omits `materialHighPassFilter`; the owner now explicitly disposes that material too.
- A pass exception quarantines and evicts its pipeline, reports the full error to the console and bounded diagnostics in `window.veytronaProfile()`, and restores framebuffer, clear, viewport and scissor state before `gl.render(scene, camera)`. HeroBloom releases its failed lease. There is no per-frame error retry loop. Resize, remount or context restoration permits a fresh pipeline attempt; bloom remains enabled on healthy pipelines.
- Shader preparation completion checks a lifecycle generation, preventing a pending Strict Mode/unmounted generation from modifying a newer one. The existing ribbon and PMREM leases were inspected; their final-owner microtask disposal is retained.
- Compatibility was checked locally: `three@0.178.0`, deduplicated for `@react-three/fiber@9.8.1`. All composer passes come from that same installed Three.js package. No separate postprocessing library or version mismatch was found.

## Validation

- `npm run typecheck`: passed.
- `npm test`: **23 passed, 0 failed**; nine additional regression tests cover the crash and repair.
- `npm run build`: passed, including Next.js type validation and static page generation. First-load route JavaScript remains 153 kB, with heavyweight 3D dynamically loaded as before.
- CPU tests execute the real composer passes/morph upload code across forward/reverse transition boundaries, desktop/mobile/1×1 resizing, five ownership refresh/replay cycles, concurrent owners, stale scene/camera separation, invalid initialization, injected pass failure, direct fallback and fresh retry.
- Actual R3F reconciliation tests cover the broken attachment contract and the repaired mesh contract, a StrictMode-wrapped tree, mounted desktop/mobile/desktop geometry replacement, and explicit unmount/remount. This standalone CPU root does not automatically replay initial layout effects because its Provider is above the StrictMode boundary; synchronous Strict Mode setup/cleanup/setup is exercised separately by lease tests. Existing six-scene, scroll mapping, geometry bounds, quality, cache and preload tests also pass.

**Browser limitation:** this session's browser security policy prevented localhost inspection. Actual browser refreshes, GPU shader compilation, framebuffer output, visual forward/reverse scrolling, resize interaction and screenshots were not verified. CPU tests do not establish GPU visual correctness or frame performance. Full WebGL context-loss recovery, including regenerated PMREM content, was not validated. Existing accessibility and reduced-motion behavior was preserved in source and still needs browser acceptance.

## Files changed

- `src/components/HeroExperience.tsx`: constructor fix, initialized bloom ownership, sizing, fallback and stale async guards.
- `src/lib/bloom-pipeline.ts`: scoped resource cache, initialization, rendering, state restoration and disposal.
- `src/lib/profile.ts`: bounded failure diagnostics with full stacks.
- `tests/bloom-runtime.test.mjs`, `tests/ribbon-mount.test.mjs`, `tests/helpers/renderer.mjs`: CPU composer and real R3F regressions.
- `scripts/reproduce-morph-crash.mjs`, `performance/runtime-crash-stack.txt`: reproducible pre-fix evidence.
- `README.md`, this report: repair and validation documentation.
