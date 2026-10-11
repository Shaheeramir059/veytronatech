# VeytronaTech — Phase 6 cinematic Next.js application

This repository replaces the former static/Vite website with the complete Phase 6 application. The owner authorized the October 11, 2026 replacement on `main` and its possible automatic Vercel deployment. The old source remains on `backup/pre-cinematic-nextjs-2026-10-11`; do not modify that branch. The original local development project is separate and unchanged.

Use Node **24.x** and `npm ci`. Vercel configuration explicitly selects Next.js, `npm ci`, `npm run build`, `.next` output and no legacy HTML rewrites. See [REPLACEMENT_REPORT.md](REPLACEMENT_REPORT.md) for the replacement, validation and deployment limitations. Hosting root must be the repository root; dashboard access is needed to inspect inherited root/environment settings.

**Email sending is locked off for this release**, including if old hosting environment variables request Resend. `src/lib/inquiry-release.ts` must remain false until separate sending authorization and verified provider/durable abuse setup. The existing validated draft/mailto/copy fallback is preserved. `SITE_URL` still requires a verified owned HTTPS origin; no DNS changes are part of this replacement.

The remaining sections document implementation and historical local phase results. Earlier statements about no Git repository/no deployment authorization describe the original local prototype, not this replacement release. Browser, listening and GPU QA remain pending.

Standalone **concept/demo**, not a replacement for the live site. The six-stage cinematic journey includes service details, five concept studies, an offline-generated prerecorded receptionist simulation and validated inquiries. Server email delivery is implemented and mock-tested, but **disabled and unconfigured locally**; the current form prepares an email draft. There are no downloaded 3D assets, paid voice APIs, microphone/telephony features, analytics, real client claims or deployment. Public launch still requires browser/listening QA, a verified domain and hosted delivery/abuse configuration.

## Run on Windows (PowerShell) or macOS/Linux

```bash
cd veytronatech-3d
npm install
npm run dev
```

Open **http://localhost:3000** (or use `npm run dev -- --port 3001 --hostname 127.0.0.1` for the requested **http://localhost:3001** preview). Scroll down and back up; the camera and artwork follow your position. `npm run typecheck`, `npm test` and `npm run build` are the validation commands.

## What is implemented

- Six sections: hero, websites, AI automation, AI voice, 3D experiences, contact.
- Persistent 3D canvas; scene assets stay mounted between scroll stages.
- Procedural woven chrome hero with a V centerpiece; GPU morph targets unfold its six bands into floating website frames. Network nodes, voice waveform, portal, and final core retain their existing artwork.
- GSAP ScrollTrigger drives a mutable progress value; `useFrame` evaluates the same deterministic state in both directions.
- Semantic HTML titles, links and a `mailto` enquiry action.
- Mobile layout, DPR cap, WebGL/reduced-motion fallbacks, no paid fonts/assets.
- No dependency on client credentials or external API services.

## Known limitations / Phase 1 scope

- Phase 2's hero is custom procedural artwork with a chrome V centerpiece; it uses no downloaded models or textures. Visual approval remains pending.
- This is a technical proof of scroll/camera coordination, not a pixel-perfect recreation of the reference video.
- All five transitions use continuous scroll-driven morphs, shared fragments and camera choreography.
- The Google Fonts CSS import falls back to system fonts when offline.
- Node dependencies are installed and locked in `package-lock.json`. Current validation: TypeScript, production build and **74 tests** pass on October 11, 2026. Visual, GPU, playback and interactive accessibility acceptance remain pending.
- Public contact and delivery recipient are fixed to `veytronatech@gmail.com`; the obsolete `NEXT_PUBLIC_CONTACT_EMAIL` override is ignored.

## Architectural map

- `src/lib/scenes.ts` — one canonical scene data source, descriptions and anchors.
- `src/components/CinematicExperience.tsx` — UI, scroll tracking, navigation, WebGL detection.
- `src/components/World.tsx` — persistent 3D canvas, geometry, lighting, camera and animation.
- `src/app/globals.css` — visual language and responsive behaviour.

## Acceptance checks

1. `npm install` completes without dependency conflicts.
2. `npm run typecheck` and `npm run build` succeed.
3. Scroll from Scene 1 through Scene 6 and back without canvas unmounting or jumps.
4. Top navigation and on-page actions move to the right sections.
5. Contact CTA opens an email to `veytronatech@gmail.com`.
6. Check phone viewport, reduced-motion preference and browser with WebGL disabled.

**No changes should be made to the live VeytronaTech website until this demo is reviewed and explicitly approved.**

## Quick source-level checks (no npm install needed)

```bash
npm run test:smoke
```

Run `npm test` on Node.js 22.18+ or 24+ for the full current suite, including forward/backward scroll mapping, variable section heights, restored scroll positions, overscroll boundaries and audio/inquiry lifecycle checks.

Phase 2 adds five checks (12 total) for deterministic reverse transitions, easing boundaries, overscroll endpoints, actual ribbon geometry topology/bounds, and mobile quality limits. See [PHASE2_REPORT.md](PHASE2_REPORT.md) for implementation details and verification limits.

Loading optimization adds two lifecycle/preload checks (14 total). Development output now uses `.next-dev`, separate from production `.next`. Run `npm run build` followed by `npm run start` when judging load performance. See [PERFORMANCE_REPORT.md](PERFORMANCE_REPORT.md) for measured before/after server and CPU results, staged loading details, and browser limitations. The opening quality settings are unchanged. Browser diagnostics are available with `?profile=1` through `window.veytronaProfile()`.

The runtime repair initializes ribbon morph state through the Mesh constructor and hardens bloom ownership, sizing, disposal and reported direct-render fallback. All 23 tests, TypeScript and the production build pass. See [RUNTIME_REPAIR_REPORT.md](RUNTIME_REPAIR_REPORT.md) for the reproduced full stack, nine added regression tests, changed files and browser limitations.

Phase 3 adds continuous website → network → waveform → portal → chrome V transformations through one persistent morph/instance assembly. Later geometry is prepared in idle slices after the opening hero frame. All 30 tests, TypeScript and the production build pass. See [PHASE3_REPORT.md](PHASE3_REPORT.md) for techniques, changed files, measured CPU/server/bundle results and pending browser visual acceptance. Run `node --experimental-strip-types scripts/phase3-cpu.mjs` for the CPU benchmark; this does not measure GPU performance.

Phase 3.1 protects complete copy blocks in a measured reading slot, fits long headings after font/viewport refresh, refines later camera arcs, and repairs portal near-plane clearance and translucent depth writes. Reduced motion and oversized copy retain normal document flow; keyboard focus brings each CTA to its section. All 34 tests, TypeScript and production build pass. See [PHASE31_REPORT.md](PHASE31_REPORT.md) for source/CPU evidence, production HTTP timings and the remaining desktop/mobile browser QA. Browser performance and visual acceptance remain unverified.

Phase 4 adds three service views, five explicitly labeled Concept Demo case studies, a configurable lead workflow and restaurant voice simulation, and an inquiry form with shared client/server Zod validation. The form prepares a draft for `veytronatech@gmail.com`; the visitor chooses **Open email application** and sends it themselves. No successful delivery is simulated. All 45 tests, TypeScript and production build pass; seven additional compiled production API HTTP checks pass. See [PHASE4_REPORT.md](PHASE4_REPORT.md) for features, changed files, measured bundle/server results and pending browser acceptance.

Run the requested local preview with `npm run dev -- --port 3001 --hostname 127.0.0.1`. Open the hero's **Discuss Your Project** action, navigation **Services / Work**, or the new action on each scene. These open a native modal above the journey; the canvas remains mounted and pauses after its first hero frame while the modal is open. Close/Escape returns to the journey.

Services and portfolio content live in `src/lib/business-data.ts`. Real assets can be added under `public/` and configured through optional `thumbnail`, `video` (with poster/captions), and `demoUrl` fields. Use verified content and permissions before changing a concept into a client project. No real project URLs or videos are currently configured.

Inquiry preparation is `POST /api/inquiry/prepare`. It accepts same-origin JSON, validates fields, rejects the honeypot, limits streamed bodies to 24 KiB, and limits draft attempts to 30/minute per process. This is a local, bounded abuse control, not distributed production rate limiting. `src/lib/inquiry-server.ts` contains the email-client adapter and future provider interface; no provider is connected. The API logs/stores no inquiry content and returns `Cache-Control: no-store`.

To reproduce production evidence, start `npm run start -- --port 3102 --hostname 127.0.0.1` after building, then run `node --experimental-strip-types scripts/performance.mjs phase4-production 3102` and `node scripts/phase4-api.mjs 3102`. These measure/check HTTP, bundles and API responses, not browser rendering, mail application launch or GPU performance.

## Local hardening — October 8, 2026

- Scroll progress follows actual section positions, including when minimum section height exceeds the viewport. Refresh initializes progress after anchor navigation or scroll restoration.
- The progress bar updates through a ref, and the persistent World is memoized to avoid rebuilding its React tree during scrolling. Strict Mode cleanup cancels the scheduled refresh.
- Mobile artwork has a dedicated lower viewport region, with a dark copy backing, responsive geometry scale, and a 1.5 DPR cap. These layout changes still require visual confirmation.
- WebGL detection requires WebGL 2, as required by the installed Three.js renderer. Reduced motion and unavailable WebGL retain the branded static fallback. Keyboard links have explicit focus outlines and the skip-link destination is focusable.
- A scoped PostCSS 8 patch override fixes the dependency audit findings without upgrading Next.js to a new major version. Installation reports zero vulnerabilities.
- This directory has no Git repository; the lockfile is saved but could not be committed.

Pending browser acceptance: desktop 1440×900 and mobile 390×844 screenshots of all six stages; forward/backward scrolling and canvas persistence; console warnings and GPU load; keyboard navigation, reduced motion, and WebGL-unavailable fallback. No browser results or screenshots are claimed.

The smoke tests check six unique scenes, valid scene links, scroll/camera wiring, and the email CTA. They do not replace browser testing.

## Phase 5 — audible demo and launch preparation

SpeechSynthesis speaks only the scripted receptionist after **Play Voice Demo**. Actual speech events drive transcript highlights and waveform state. Play/Pause/Resume/Stop/Replay, asynchronous browser voices, local-English preference and rate controls are implemented. Scenario/settings changes, modal unmount and navigation cancel speech. Unsupported audio retains the manual transcript. This is an **Audible Interactive Demo — Simulated Conversation**, with no live AI or booking.

The mobile menu exposes all studio views, typography/contrast and preview surfaces are refined, and `/services` provides meaningful server-rendered content without WebGL. Domain/contact metadata, icons, a local PNG social card, robots and sitemap are configurable; indexing stays disabled until a verified `SITE_URL` is set before building.

`POST /api/inquiry/submit` selects a disabled-by-default Resend adapter only after explicit configuration of credentials and a durable abuse gate. It reports acceptance, rejection or uncertainty accurately. Draft fallback remains available. No real email has been sent and no external service has been activated. Private delivery configuration is absent from browser chunks. No dependencies were added for Phase 5.

TypeScript, all **62 tests**, the production build, **16 compiled HTTP/asset checks** and the dependency audit pass (zero reported vulnerabilities). Existing six-scene motion, quality/DPR settings, morph/bloom repairs and deferred loading remain intact. Browser audio, pixel layout, assistive technology, GPU startup/FPS and hosted delivery are **unverified** because browser inspection was blocked by session policy.

See [PHASE5_REPORT.md](PHASE5_REPORT.md) for the full completion report and measurements, and [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md) for environment setup, durable gate contract, security limits and exact manual acceptance instructions. Raw evidence is in `performance/phase5-*.json`. To run the local compiled checks with sending disabled, start production on port 3102 and run `node scripts/phase5-http.mjs 3102`. The development preview remains at `http://localhost:3001/`. Earlier phase sections below/above are historical records, not current launch acceptance.

## Phase 6 — prerecorded natural voice and final local validation

The Voice demo now defaults to 28 real Kokoro `af_heart` recordings (2,527,376 bytes), with five sample scenarios, all offered guest/time options, handoff and a manual transcript. HTMLAudioElement events drive speaking/highlights; Play/Pause/Resume/Stop/Replay and volume are supported. An optional Web Audio analyser drives the waveform from actual sound; reduced motion keeps it static. Browser speech is an explicitly selected fallback. No sound starts on opening the demo. Recordings load lazily with one next-response preload, immutable content-hashed MP3 URLs and a revalidated manifest.

The separate Python/ONNX CPU generator is documented in [scripts/voice/README.md](scripts/voice/README.md); Python/model files are not needed for Node development, build or hosting. Do not ship `.voice-venv` or `.voice-cache`. Source dialogue is `src/lib/receptionist-dialogue.json`; verified assets are `public/audio/receptionist/`.

**69 tests**, TypeScript, production build, **16 general + 33 audio HTTP checks**, and `npm audit` (zero reported Node vulnerabilities) pass. Browser/subjective listening/GPU performance are still unverified. The initial HTML and 3D bundles remain unchanged. See [PHASE6_REPORT.md](PHASE6_REPORT.md) and [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for actual measurements, changed files and launch gates. Earlier phase results are historical. No deployment or live-site change was made.

## Final contact/privacy update — October 11, 2026

The public audit found no owner identity/phone links in current content or assets. Agency contact is now fixed across browser content, metadata, drafts and provider delivery, rather than overridable through a public deployment variable. The existing automatic Resend adapter adds an explicit matching verified-sender-domain setup gate; live sending remains disabled without credentials, owner-confirmed domain verification and the durable abuse service. Stalled request bodies now time out after five seconds. All **74 tests**, TypeScript, production build, **16 general + 33 audio HTTP checks**, a 129-file privacy scan and Node audit (zero vulnerabilities) pass. See [CONTACT_PRIVACY_REPORT.md](CONTACT_PRIVACY_REPORT.md) for evidence, modified files and exact provider/hosting setup. No deployment, DNS change or real email was performed.
