# Local loading and scrolling optimization — October 8, 2026

## What was measured before editing

The existing production build and a separate development process were requested over local HTTP. Each sample set contains one first request after process start, then five warm requests. Raw results are in `performance/baseline-production.json` and `performance/baseline-development.json`. These are server/process timings, not cold browser navigations, paint timings, or client cache tests.

The production server already returned HTML quickly. The first development response was dominated by route compilation (2.9 seconds reported by Next.js). Branding, headline, and CTA were present in the returned HTML in every request. Actual paint could not be measured.

Six desktop ribbon geometries took 6.80 ms for the first CPU generation, and 0.78 ms median for repeated generation in Node.js. This is not evidence that ribbons are the dominant browser startup bottleneck. Their geometry, segment counts, normal morphs, and appearance were preserved rather than replaced with assets.

Source inspection confirmed additional work on the client startup path: a disposable WebGL probe context before the actual renderer; all later scene geometries mounted immediately; repeated PMREM/ribbon/composer allocations during Strict Mode effect replay; materials initially created without their reflection map; nonessential panel details mounted on the opening frame; and an external render-blocking font stylesheet imported from the main CSS. Scroll callbacks also queried section layout on every update.

The dominant GPU/first-visible-frame bottleneck cannot be conclusively identified without a browser trace. PMREM execution, shader stalls, texture uploads, actual pixel presentation, and scrolling frame times remain unmeasured. These suspected costs were addressed without reducing quality, and instrumentation was added for the next browser run.

## Implemented changes

- HTML remains independent of the dynamically imported World. The branded V fallback stays visible until the first 3D frame is submitted. A discreet status appears only after 700 ms if initialization is still pending. WebGL failure is handled by an error boundary, retaining HTML and the fallback.
- Removed the probe GPU context. The actual WebGL 2 context and renderer construction are timed separately. The correct mobile preset is chosen at initial mount, avoiding a desktop-first resource rebuild on phones.
- Extracted scenes 3–6 into `LaterArtifacts.tsx`, loaded through an actual dynamic import after the opening frame. Their original artwork remains intact. Scene 2 panel details also mount after the opening frame; restored deep positions request them immediately.
- Later scenes mount incrementally through bounded idle tasks, with a 250 ms starvation timeout and scroll-aware priority. They stay mounted after loading, preserving reverse navigation. Background `compileAsync` calls and 1×1 offscreen draws prepare shader programs and geometry uploads before normal visibility. Warm clones share geometry and materials, and one reusable render target is disposed on cleanup.
- Reference-counted ribbon, PMREM, and composer caches survive Strict Mode's synchronous cleanup/setup replay. The last owner schedules disposal in a microtask; a replayed owner cancels effective disposal by reacquiring the same resource. No precomputed assets were introduced because the CPU geometry benchmark did not justify them.
- Hero meshes wait for the final PMREM map, avoiding the initial no-environment shader variant. `compileAsync` prepares visible hero materials before first submission, using parallel shader compilation where available. The first render's CPU submission time is recorded separately, since this can still include postprocessing compilation and driver work.
- Composer targets are reused. Resize work only runs when size, DPR, or bloom scale changes, and redundant initial full-size resize calls are skipped. Existing bloom strength, radius, threshold, transparency handling, and reduced-resolution buffers are preserved; bloom is bypassed after the hero transition.
- Hidden later scenes skip their animation callbacks, including the 38 voice bars. Hidden tabs still pause the renderer. Scroll code caches section offsets on refresh and reuses one media query instead of repeatedly reading layout and constructing media queries.
- The same premium fonts load after hydration instead of blocking the main stylesheet. System-font text is immediately available; font completion refreshes section measurements. A brief fallback-font layout shift remains possible.
- Development output uses `.next-dev`, while production uses `.next`. An existing dev server had invalidated a benchmark production build through the previously shared directory. Separate output prevents that interference. The `VEYTRONA_DIST_DIR` override supports isolated benchmark runs.

All six scenes, their copy, navigation, branding, deterministic morph equations, keyboard focus, reduced-motion fallback, and DPR caps are preserved. No dependencies were added, nothing was deployed, and the live site was not modified.

## Final measurements

| Local measurement | Before | Final after |
| --- | ---: | ---: |
| Production first-request TTFB | 35.40 ms | 35.42 ms |
| Production first HTML chunk | 35.75 ms | 35.75 ms |
| Production warm TTFB, median of 5 | 1.92 ms | 1.97 ms |
| Development first-request TTFB | 3198.59 ms | 1415.97 ms* |
| Development first HTML chunk | 3198.91 ms | 1416.18 ms* |
| Development warm TTFB, median of 5 | 45.13 ms | 47.88 ms |
| Desktop six ribbons, first CPU generation | 6.80 ms | 6.71 ms |
| Desktop six ribbons, warm generation median | 0.78 ms | 0.80 ms |
| Desktop six cached ribbon leases, median | Not implemented | 0.002 ms |
| Next.js reported route first-load JS | 152 kB | 153 kB |

*The final development run reused its disk compilation cache. An earlier after-run with a fresh isolated output directory took 4345 ms. The baseline used the original output directory. These different cache states prevent attributing the development first-request difference to the optimization. Both remain much slower than production during route compilation. Local production first-request trials varied between roughly 35 and 49 ms. No server response improvement is established.

The final dynamically loaded World dependency group is 921,480 raw bytes / 246,371 gzip bytes across five chunks. The four shared library chunks are unchanged from the baseline; the World application chunk grew modestly to support staging and diagnostics. Later artwork is now a separate 5,237-byte / 1,679-byte gzip chunk. The principal change is when resources are initialized, not a large reduction in Three.js download size. The development World chunk includes development code and source maps (9.73 MB raw / 2.17 MB gzip); it is not comparable to production minified bytes.

Cache-hit timing measures CPU lease acquisition only, not initial geometry generation, GPU uploads, or page load. The cache prevents repeated generation; it does not make the initial procedural geometry cheaper. There is no measured FPS or first-visible-3D speedup yet.

Final raw data: `performance/optimized-production.json` and `performance/optimized-development.json`. The profiling script excludes unrelated fallback chunks from production bundle summaries and records manifest-based dynamic import groups. Historical baseline files retain their original collected data.

## Browser milestones and follow-up profiling

Browser automation was blocked by the session's earlier localhost policy rejection. No alternate browser, raw browser protocol, or browser workaround was used. Consequently, Canvas mount, actual context duration, shader compilation duration, PMREM GPU execution, first visible 3D frame, browser cold/warm navigation, desktop/mobile appearance, and FPS were not measured here.

The local site now exposes `window.veytronaProfile()` for browser inspection. Open a production page with `?profile=1`, scroll forward and backward on desktop and mobile, then export that report from DevTools. It contains:

- Browser navigation and paint entries.
- World import, Canvas creation callback, context acquisition, and renderer construction marks.
- PMREM CPU submission duration, each ribbon CPU duration, composer initialization, async hero shader preparation wall time, and first frame CPU submission.
- First 3D submission timestamp and per-scene import/compile/prepared marks.
- The last 600 requestAnimationFrame intervals, aggregate draw calls/triangles, and geometry/texture counts, with median and p95 frame intervals.

The Canvas callback is a creation milestone, not proof of browser paint. PMREM CPU submission is not GPU execution time. First 3D submission is not confirmation that pixels were displayed. Frame intervals are browser animation cadence, not GPU timer queries. No instrumentation data was collected through a browser in this session.

For a real before/after visual benchmark, retain the baseline source separately, use the same browser/device/viewport/network settings, clear the client cache for cold runs, repeat warm runs, and capture browser performance traces and screenshots. Extremely fast anchor jumps, slow chunk transfers, drivers without parallel compilation, or slow GPUs can still outrun background preparation. HTML remains usable while artwork loads; seamless later-scene readiness under those conditions is not yet proven.

## Validation and changed files

TypeScript passed, all 14 tests passed, and the final production build passed. New tests verify geometry lease lifetime, replay reuse, single final disposal, and preload-priority boundaries. Existing animation, reversible-scroll, quality-budget, and six-scene tests pass.

Changed: `World.tsx`, `HeroExperience.tsx`, `CinematicExperience.tsx`, `globals.css`, `hero-geometry.ts`, and Next.js output configuration. Added: `LaterArtifacts.tsx`, `DeferredScenes.tsx`, `loading.ts`, `profile.ts`, `tests/loading.test.mjs`, `scripts/performance.mjs`, and benchmark JSON files. TypeScript includes the normal development and production generated types. README links this report.

A significant browser startup or scrolling improvement cannot yet be claimed. The measured server path is effectively unchanged; the implementation removes confirmed duplicate and nonessential startup work while preserving the existing visual budgets.
