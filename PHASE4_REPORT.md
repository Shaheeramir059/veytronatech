# Phase 4 — Interactive portfolio and client conversion

Implemented October 9, 2026 (Asia/Karachi) in the existing local project. No deployment, live-site modification, paid services, credentials, database or fabricated client work. The Phase 3.1 baseline passed TypeScript and all 34 tests before implementation. All six canonical scenes, copy, original anchor/email links, sculpture, morph targets, lighting, bloom repair, geometry caches, deferred preparation and quality presets remain.

## Features and views

### Interactive services

Three service detail views cover Website Development, AI Automation and AI Voice Agents. Each has a concrete value proposition, requested offerings, three to five benefits, a relevant visual/demo and a service-specific inquiry CTA. Website details include desktop/mobile layout controls; automation and voice details link into their interactive demos. The inquiry is preselected for the relevant service and request type.

### Concept portfolio

Five category entries are prepared in centralized typed data:

| Name | Category | Content |
| --- | --- | --- |
| Beyond Ordinary | Luxury immersive 3D website | The actual local six-scene prototype, with verified Next.js/TypeScript/R3F/Three.js/GSAP technology details. |
| A clearer first impression | Business website | Responsive HTML/CSS layout study. |
| From inquiry to next action | AI automation dashboard | Configurable workflow simulation. |
| A helpful first conversation | AI voice receptionist | Scripted restaurant request/handoff simulation. |
| Shape the atmosphere | Interactive web experience | Shape/palette configurator built in HTML/CSS. |

All are explicitly **Concept Demo**, including the local prototype. No clients, testimonials, customer logos, business results or completed integrations are invented. Category filtering leads to detailed case studies describing challenge, approach and explorable capabilities. Interactive previews are rendered only within the selected case. Production technologies are left unverified for the other concepts, rather than implying integrations.

Code-native thumbnails need no downloaded assets. Optional real image thumbnails, video/poster/captions and configured HTTPS/relative live-demo URLs are supported by the data model and components. Images use reserved dimensions/lazy loading; videos use controls and `preload="none"` with no autoplay. No real image/video/demo URL is configured. The cinematic entry has an actual return link into this local prototype, preserving its canvas.

### Automation demo

The workflow shows Lead Received → AI Qualification → CRM Update → Personalized Follow-up → Staff Notification. Visitors choose service interest and timing, run/replay the sequence, pause, advance manually and inspect individual steps. Timing changes the suggested route and draft follow-up. Connections animate during playback; reduced motion uses manual advancement and static connections. Timers stop on completion, preference changes or unmount.

Every output is sample/draft content. No CRM record, email or notification is created. A pure reducer/output model separates the workflow from rendering and provides a future connector boundary without external dependencies.

### Restaurant voice demo

Visitors choose guests and a sample time, advance through a scripted conversation, inspect the request information and staff summary, or explicitly show a human handoff. Sample unavailability/large-party choices produce a review/alternatives branch. Reset/replay retains the selected configuration. A lightweight CSS waveform supports the conversation, with reduced-motion styling.

The view is labeled **Interactive Demo**, scripted simulation and no phone connection. Reservations stay **Not confirmed**; summaries are previews only. No microphone, audio capture, speech model, telephony or real reservation system is used. The pure state/conversation model is separate from UI, so a future voice-session implementation can replace the simulation without changing the existing 3D architecture.

### Inquiry and conversion

The hero now has a primary Discuss Your Project button; each scene has an appropriate studio/demo/inquiry action. Navigation adds Services and Work while retaining existing links and Let's talk access to the final contact section. The final emblem/contact scene retains its original email link alongside the form action. New service/case/demo CTAs preserve context when opening the inquiry.

The inquiry collects full name, email, optional company, service, description and optional budget. Shared Zod validation runs in the client and local server route. The UI provides field errors, a linked/focusable summary, loading/error states, request cancellation/timeout, and a prepared-draft view.

Workflow:

1. Validate fields in the browser.
2. Submit JSON to the same-origin local preparation endpoint for server validation.
3. Display **Draft ready · Not sent** with the prepared email.
4. The visitor selects **Open email application**, reviews it, and sends manually.

The recipient is derived from the existing scene configuration: **veytronatech@gmail.com**. Subject/body use URI encoding; user text cannot introduce another recipient through query parameters. A copy-draft control and selectable draft text provide alternatives if the email handler or clipboard is unavailable. A direct email link is always available within the form. The website never reports successful delivery.

## Delivery, privacy and abuse boundaries

`POST /api/inquiry/prepare` enforces JSON type, Zod field limits/allowed options, a honeypot, original Host/Origin matching, cross-site rejection, a 24 KiB streamed body limit and a fixed-window 30-attempt/minute process limit. Responses use no-store caching and generic failure messages; no inquiry content is logged, saved or sent. The limiter stores only time/count, without personal data.

The production integration check found that installed Next.js normalizes loopback URLs to localhost. A comparison against the normalized request URL incorrectly rejected valid 127.0.0.1 requests. The repaired check compares browser Origin with the original HTTP Host and rejects mismatches; it does not trust forwarded-host headers. A regression uses the actual installed `NextRequest` normalization.

`InquiryAdapter` prepares the current email-client action. A separate typed `EmailDeliveryProvider` defines a future server-only provider receipt contract; no implementation is connected. Provider acceptance is distinct from delivery. Future hosted delivery must establish a real provider/configuration and matching UI semantics before any delivery claim.

The current rate control is process-local/global, resets with process restarts and is not a distributed/per-client production spam solution. Reverse-proxy origin behavior needs hosting-specific verification. Mail-client opening and very long mailto draft handling depend on the visitor's application; copying the complete draft is the provided fallback. No email application was launched during testing and no email was sent.

## Integration, performance and accessibility

Studio views open only through explicit actions, as a native modal portaled outside the cinematic shell. Native modal semantics provide background inertness, keyboard containment and Escape handling; close restores focus to the opener. Return-to-journey links avoid restoring focus to a different scene and use existing anchors. Cases reset panel scroll and focus on their heading. Form errors focus their summary and link directly to fields. Controls have visible focus styles, selected states, live status text, labels and mobile targets. Mobile form controls use 16px text to avoid input-focus zoom.

Modal scrolling does not extend the journey document or add scroll stages. The World is not conditionally removed or keyed to a view: its existing Canvas switches to `frameloop="never"` while an open studio panel covers it, only after the hero's initial frame. Closing resumes it with the existing geometry and state. Deferred preparation/caches, bloom ownership, DPR and reduced-motion/WebGL fallback remain. A local content error boundary protects the journey from a failed lazy panel chunk.

Studio content, demos and inquiry/Zod code are split into on-demand chunks. New demonstrations use HTML/CSS and add no WebGL canvases, shaders, lights or GPU resources. Modal styles are in the initial stylesheet so actions/panels have their styles available when opened; total production CSS is 24,091 raw / 6,838 gzip bytes. No previous CSS measurement was recorded for a direct delta.

| Measurement | Phase 3.1 historical record | Phase 4 |
| --- | ---: | ---: |
| Next first-load JS | 153 kB | 154 kB |
| Route JS | 50.1 kB | 51.4 kB |
| World dynamic group, gzip | 248,489 bytes | 248,503 bytes |
| Later artwork chunk, gzip | 4,806 bytes | 4,806 bytes |
| First-process production HTTP TTFB | 41.84 ms | 31.94 ms |
| First HTML chunk | 42.58 ms | 32.27 ms |
| Warm HTTP TTFB, median of five | 2.12 ms | 1.81 ms |
| Returned HTML | 10,886 bytes | 12,276 bytes |

The new on-demand studio chunk is 5,747 gzip bytes, demos 3,455, and inquiry/form/Zod group 27,257. These are manifest-group sizes, not browser downloaded-byte measurements. Branding, headline and existing CTA were present in every server HTML response. The initial JavaScript increase is about 1 kB by Next's rounded report; the 3D group grew by 14 gzip bytes and later artwork is unchanged.

Production was built and served using `npm run start` on temporary port 3102. Measurements are six local HTTP samples from a fresh process, then warm requests. The temporary process was stopped; development preview is running at port 3001. Historical/current runs have uncontrolled host/cache variation: **no browser loading/FPS improvement is claimed**. Development reload/compilation, actual Canvas startup, shader/PMREM time, first visible pixels and scroll frame performance were not measured in a browser.

Evidence: `performance/phase4-production.json`, `performance/phase4-api.json`, `performance/phase4-assets.json`. Reproduce the compiled endpoint/CSS checks with `node scripts/phase4-api.mjs 3102` while the production server is running. Existing `?profile=1` and `window.veytronaProfile()` remain available; their frame intervals/CPU submissions do not establish GPU timer duration or confirmed presentation.

## Validation

- `npm run typecheck`: pass.
- `npm test`: **45/45 pass**, including all 34 Phase 3.1 tests.
- `npm run build`: pass; static homepage and dynamic preparation endpoint generated.
- Installed Zod and updated lockfile; npm installation audit reported zero vulnerabilities.
- **Seven compiled production HTTP API checks pass**: valid draft only (200), invalid field (422), honeypot (400), cross-origin (403), oversized body (413), non-JSON (415), malformed JSON (400). All return no-store caching.

Eleven added automated tests cover service/navigation targets, five honest portfolio categories and URL safety, workflow progression/pause/replay/routing, voice draft/unavailable/handoff/reset states, Zod validation, Unicode/query-safe mailto generation, the actual route, NextRequest loopback handling, bounded body/origin/honeypot enforcement, rate resets/provider failure, and actual React-rendered initial form/demo/preview markup. Existing morph, bloom, resource replay, reverse scroll, camera/typography boundary and quality tests still pass.

Model tests and server-rendered markup checks do not simulate actual browser clicks/focus/native dialogs or GPU output. No screenshots or browser console traces are claimed.

## Remaining assets and browser QA

Real client names/content, approved screenshots, videos/captions, deployed demo URLs and verifiable project technology/outcomes are still needed before replacing concept labels. No supplied assets were available for these. Add actual files under `public/`, set the optional typed thumbnail/video/demo fields, and supply verification/credits rather than inventing content.

Localhost browser inspection remains blocked by the session's browser policy; no alternate browser/protocol workaround was used. Still verify at **1440×900** and **390×844**:

1. Six scenes and all five transitions forward/backward, with new copy/CTA heights, reduced motion and WebGL fallback.
2. Open/close every panel, Escape, tab containment/focus return, return-to-journey anchors and Canvas persistence/resume.
3. Service selectors, all portfolio filters/cases/back controls, viewport/shape/palette previews.
4. Workflow timing, pause/replay/manual controls; voice availability/handoff/reset; preference changes mid-play.
5. Form client/server errors, network failure/timeout, draft editing, actual mailto launch/copy behavior and mobile keyboard layout.
6. Startup/scroll profiling, readiness marks, console diagnostics and responsive visual hierarchy on real WebGL.

## Files changed

| Files | Purpose |
| --- | --- |
| `src/components/CinematicExperience.tsx` | Navigation and six scene entry actions, preserving original links. |
| `src/components/World.tsx` | Pause/resume rendering behind an explicit modal without removing Canvas. |
| `src/components/BusinessDialog.tsx` | Native modal, focus/scroll ownership, lazy loading and isolated error fallback. |
| `src/components/BusinessExperience.tsx` | Services, filters, cases, optional media and inquiry routing. |
| `src/components/business/Previews.tsx` | Code-native thumbnails, responsive layout and spatial controls. |
| `src/components/business/Demos.tsx` | Workflow/voice UI, timer cleanup and reduced-motion behavior. |
| `src/components/business/InquiryForm.tsx` | Accessible validation, request states, draft/mailto/copy controls. |
| `src/lib/business-data.ts`, `business-navigation.ts` | Typed services/projects and entry routes. |
| `src/lib/demo-motion.ts` | Pure simulation states, transitions and outputs. |
| `src/lib/inquiry.ts`, `inquiry-server.ts` | Shared Zod/email configuration, encoded drafts, server guards and adapter contracts. |
| `src/app/api/inquiry/prepare/route.ts` | Actual server validation/preparation endpoint. |
| `src/app/business.css`, `src/app/layout.tsx` | Integrated visual system and responsive/accessibility styling. |
| `package.json`, `package-lock.json` | Zod dependency. |
| `tests/business.test.mjs`, `scripts/phase4-api.mjs` | New regressions and repeatable compiled HTTP/CSS evidence. |
| Three Phase 4 performance JSON files, `README.md`, this report | Measurements, usage and outstanding acceptance. |

## Readiness for Phase 5

The requested local Phase 4 features are implemented and pass source, automated and compiled API validation. This is ready for browser acceptance and real content insertion. Visual approval, native browser interactions/mail handlers and real GPU performance remain pending. A future production-delivery phase should connect an explicitly selected real provider, verify its receipts/UI states and hosted abuse/origin configuration. No Phase 5 work or deployment has begun.
