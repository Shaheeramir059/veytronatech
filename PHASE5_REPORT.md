# VeytronaTech — Phase 5 completion report

October 9, 2026, Asia/Karachi. Raw benchmark timestamps use UTC on October 8.

## 1. Executive summary

Implemented Phase 5 directly in the existing local Next.js project. The studio now has an audible browser receptionist demo, configurable server email delivery with truthful fallback states, refined concept previews, mobile navigation, crawlable services and SEO/security configuration. TypeScript, 62 automated tests, the production build, 16 compiled HTTP/asset checks and the dependency audit pass.

All six cinematic scenes and five reversible transformations remain. The working geometry, camera rail, GSAP mappings, persistent canvas, resource leases, lazy scene preparation, DPR presets and bloom/morph repairs were preserved. No live website, DNS or deployment changed; no email was sent and no paid service was activated. **Implementation is complete locally; public launch readiness remains conditional on the manual and hosted verification below.**

## 2. Features implemented

- Audible Interactive Demo — Simulated Conversation, with user-triggered receptionist speech, transcript and actual speaking highlight.
- Play, Pause, Resume, Stop, Replay, browser voice selection, asynchronous voice discovery and bounded speed controls.
- Booking, unavailable slot, large party and host handoff scripts; manual transcript works independently of audio.
- Server-only email adapter, strict shared validation, explicit opt-in, durable guard contract, stable retry keys and email-client fallback.
- Mobile menu, sticky modal Close access, safe-area/keyboard viewport configuration, readable labels and refined buttons/panels.
- Five honest Concept Demo studies with distinct code-native preview details, consistent numbering and verified **local** technology descriptions.
- Server-rendered `/services`, descriptive metadata, truthful Organization data, SVG favicon, PNG application/social images, configurable canonical, robots and sitemap.
- Security headers, private/server bundle boundary checks, studio lazy-load profiling and documented production/manual gates.

## 3. Audible demo behavior and technique

`BrowserVoiceOutput` is a reusable, event-driven output adapter, separate from the restaurant script and React hook. It queues one receptionist utterance at a time. Customer lines appear without synthesized customer speech. `onstart`, `onpause`, `onresume`, `onend` and `onerror` update playback and transcript state; there is no estimated speech-duration animation. The waveform animates only in the speaking state and its CSS animation is static under reduced motion.

Cancellation tokens and detached handlers prevent cancelled utterances from advancing a replacement conversation. Owned speech is cancelled on scenario/reset/settings changes, modal unmount, page hide, visibility loss and navigation events. The hook subscribes/unsubscribes `voiceschanged` and navigation listeners, with cleanup/remount exercised in a CPU React reconciler. Locally installed English voices are preferred; available browser network voices are labeled. No external voice download is assumed, no microphone is requested, and there are no voice API keys or recurring voice server costs.

Pause/resume use actual events or browser pause acknowledgement. When a browser does not acknowledge control, it cancels the response and explicitly offers a user-triggered restart. A five-second startup watchdog reports missing start events; it does not estimate speech length or advance playback. Unsupported APIs, voice property errors and synthesis failures preserve a readable transcript and honest error message. Real sound, voice quality and individual browser behavior still require listening tests.

## 4. Inquiry delivery readiness and limits

The new `/api/inquiry/submit` route retains the original Zod fields, same-origin/Host checks, honeypot, MIME guard, streamed 24 KiB ceiling, no-store responses and per-process attempt limit. `/api/inquiry/prepare` remains compatible and draft-only. The form now distinguishes genuine provider acceptance from fallback and unknown outcomes; it disables duplicate accepted submission, keeps fields stable while pending, preserves a retry UUID for unchanged input and cancels client work on unmount.

The Resend adapter sends plain text to the public configured recipient, uses a verified sender and visitor reply-to, rejects redirects, times out and checks the provider receipt. **Accepted means provider acceptance, not inbox delivery.** Rejected and ambiguous results preserve a draft without fake success; timeout/5xx messaging warns against duplicate email. Credentials, provider data and inquiry text are not logged or sent to browser bundles.

Sending requires explicit `INQUIRY_DELIVERY_MODE=resend`, server credentials and a configured HTTPS durable abuse gate. Without them, the site prepares a draft. A host-owned gate receives a salted sender digest and enforces atomic sender/global limits; the client fails closed before provider invocation if the gate fails. **That durable service is not provisioned or verified.** No credentials were used, and mocks are the only provider evidence. See [setup and contract](PRODUCTION_SETUP.md). Resend's [current send API](https://resend.com/docs/api-reference/emails/send-email), [idempotency documentation](https://resend.com/docs/dashboard/emails/idempotency-keys) and [pricing](https://resend.com/pricing) informed the adapter; no account or free-tier entitlement is assumed.

## 5. Visual and portfolio refinements

Added restrained surface borders, button corners, inset highlights, active speech contrast, readable status tags/kickers, safe long-text wrapping, grid min-width protection and consistent studio spacing. Important small labels received lighter colors. Representative solid-background contrast calculations were 8.62:1 for story detail, 7.99:1 for footer text, 10.88:1 for panel introduction, 8.31:1 for demo notes and 10.61:1 for status text. These are source color-pair checks, **not a complete visual/WCAG audit over animated artwork**.

Portfolio previews add small panels, automation nodes, chrome strips or a static voice-bar detail according to the study. No new canvas, downloaded asset or shader was added. All five entries retain Concept Demo labels, case challenges/approaches, relevant local previews and service-specific inquiry actions. Verified technology statements describe only code present in this repository; no external AI/CRM/telephony integration or client outcome is claimed. Future screenshots, captions, videos and URLs remain optional configuration fields.

The code-native social PNG was inspected locally and its dimensions validated; no website browser screenshot was captured. Actual section composition and polish across viewports remain subject to visual acceptance.

## 6. Mobile improvements

At widths up to 960px, a touch-friendly menu exposes every primary destination and studio view. It supports expanded/control ARIA, Escape, outside dismissal, tab-leave dismissal and focus restoration before opening a dialog. Hidden navigation is removed from the focus path. All original desktop navigation and scene targets remain, with an additional service guide link.

The modal retains full-width `100dvh` mobile layout, adds safe-area padding and sticky Close access. Grid children and long text avoid intrinsic-width overflow; voice controls wrap and form controls keep 16px mobile text. Viewport metadata requests content resizing for the virtual keyboard where supported, allows zoom and sets the brand theme color. Existing mobile 3D quality remains active with the original DPR/geometry limits.

Reading-boundary CPU checks now cover **390×844, 430×932, 768×1024, 1440×900 and 1920×1080**, forward/reverse and slow/rapid stage increments. These use representative measured-height inputs; they do not replace browser font layout, touch, device keyboard or GPU tests.

## 7. Performance evidence

Profiled the existing production build before changing 3D architecture. Nothing measured justified rebuilding the working artwork or introducing another postprocessing/resource path. Heavy code remains dynamically imported; business/demo/form features load after opening the studio, and the canvas still pauses after readiness behind that modal. Added `studio-code-load` and `studio-shell-ready` measurements to the existing browser instrumentation. A ready studio shell does not imply an individual demo chunk is ready.

The local benchmark used a fresh production process for one first request, then five warm requests. Development was measured separately after restarting its process, using its existing disk cache and compilation. These are **local HTTP and Node CPU/file-size measurements**, not browser navigation, parsing, paint or rendering.

| Measurement | Before production | Final production |
|---|---:|---:|
| First-request TTFB | 26.62 ms | 32.15 ms |
| First HTML chunk | 26.96 ms | 32.49 ms |
| Warm median TTFB (5 samples) | 1.55 ms | 1.82 ms |
| HTML bytes | 12,276 | 15,946 |
| Next reported first-load JS | 154 kB | 155 kB |
| World dynamic group, gzip | 248,503 bytes | 248,503 bytes |
| Later-artifact group, gzip | 4,806 bytes | 4,806 bytes |
| Lazy studio shell, gzip | 5,747 bytes | 6,107 bytes |
| Lazy demos, gzip | 3,455 bytes | 5,829 bytes |
| Lazy form/shared Zod group, gzip | 27,257 bytes | 28,116 bytes |
| Production CSS, gzip | 6,838 bytes (Phase 4) | 7,882 bytes |
| Six desktop ribbons, cold Node CPU | 6.706 ms | 6.720 ms |
| Six desktop ribbons, warm CPU median | 0.742 ms | 0.728 ms |
| Six cached desktop leases, median | 0.002 ms | 0.002 ms |

Development first-request TTFB was **1,831.83 ms**, first HTML chunk **1,832.12 ms**, and warm median TTFB **50.15 ms**. Development bundles contain compilation/debug overhead and must not be judged as production assets. Final disabled-submit API cold check took **19.05 ms**. Smaller repeated samples varied; no statistically established loading improvement is claimed.

Canvas mount, WebGL context creation, GPU shader/PMREM cost, first visible 3D frame, actual scroll intervals/FPS and modal frame stalls could not be measured because browser access was blocked. The ~3-second first artwork and ~60-FPS targets remain **unverified**. World/later bundle bytes and hashes are unchanged; no extra GPU work was introduced by the HTML polish. Raw evidence: [before](performance/phase5-before.json), [after](performance/phase5-after.json), [development](performance/phase5-development.json), [HTTP/assets](performance/phase5-http.json).

## 8. Accessibility

Preserved native modal focus trap, Escape close, scroll lock restoration, opener restoration, scene keyboard alignment, reduced-motion reading flow and WebGL fallback. New controls have visible focus, labels, native select semantics, disabled states and concise playback status. Current speech uses `aria-current`; the whole transcript is not a live region, avoiding duplicate screen-reader speech. The transcript remains manually usable without sound. Form field errors and focused summaries/receipt headings remain. No audio starts automatically. The service guide has one main heading, semantic articles and a skip link.

CPU/SSR tests verify state, cleanup and initial markup. Real keyboard tab order, assistive technology, dialog behavior on individual browsers, contrast over 3D and zoom/device behavior remain manual checks.

## 9. Security findings

Final `npm audit` reports **zero vulnerabilities** across the installed dependency graph. No Phase 5 dependencies were added. Private server identifiers and the Resend endpoint were absent from compiled browser chunks; credentials were not printed or used. Same-origin/MIME/body/honeypot controls pass compiled HTTP checks. HTTPS-only guard configuration, HMAC pseudonyms, fixed recipient, plain-text content, bounded provider calls and no response-content logging are implemented.

Added nosniff, DENY framing, restricted microphone/camera/geolocation permissions and strict-origin referrers. The enforced CSP covers objects/base/framing/forms; it is **not a full script injection policy**. An optional broader report-only compatibility policy is documented; browser compatibility and a stronger nonce/hash policy still require verification. Local rate limits are not a replacement for durable/edge protections. Host TLS/HSTS, proxy trust, quotas, privacy/provider retention, body-read/connection throttling and production redaction remain launch requirements.

## 10. Changed files

| Files | Outcome |
|---|---|
| `src/lib/voice-output.ts`, `src/lib/use-voice-output.ts` (new) | Reusable SpeechSynthesis lifecycle and React/browser integration. |
| `src/components/business/Demos.tsx` | Audible receptionist controls, event-synchronized transcript, manual fallback and all sample scenarios. |
| `src/lib/inquiry-delivery.ts`, `src/app/api/inquiry/submit/route.ts` (new) | Server-only provider/durable-gate adapters and configurable submit route. |
| `src/lib/inquiry.ts`, `src/lib/inquiry-server.ts` | Shared result contracts, validated configurable recipient and adapter request context. |
| `src/lib/contact.ts` (new), `src/lib/scenes.ts` | One public email setting; final scene text/target unchanged by default. |
| `src/components/business/InquiryForm.tsx` | Acceptance/uncertainty/draft UI, retry keys, privacy disclosure and pending protection. |
| `src/components/MobileNavigation.tsx` (new), `src/components/CinematicExperience.tsx` | Accessible mobile navigation and crawlable service link. |
| `src/components/BusinessDialog.tsx`, `src/components/BusinessExperience.tsx` | Existing dialog retained; lazy shell profiling and stable study numbering. |
| `src/components/business/Previews.tsx`, `src/lib/business-data.ts`, `src/app/business.css` | Distinct code-native preview details, honest technology context, responsive/premium polish. |
| `src/lib/site-config.ts` (new), `src/app/layout.tsx`, `src/app/page.tsx` | Verified-origin configuration, metadata, viewport and truthful Organization data. |
| `src/app/services/page.tsx`, `src/app/robots.ts`, `src/app/sitemap.ts` (new) | Server-rendered services and indexing configuration. |
| `src/app/social-image/route.tsx`, `src/app/apple-icon.tsx`, `public/icon.svg` (new) | Local PNG share/application images and SVG favicon. |
| `next.config.ts`, `.env.example` | Security headers and explicit configuration documentation. |
| `tests/voice-output.test.mjs`, `tests/inquiry-delivery.test.mjs`, `tests/phase5.test.mjs` (new) | 17 added tests for speech, provider/gate, SEO and initial accessible HTML. |
| `tests/business.test.mjs`, `tests/project.test.mjs`, `tests/polish.test.mjs` | Update honest submission assertions; configurable email and five-viewport boundary regression coverage. |
| `scripts/phase5-http.mjs` (new) | 16 compiled local HTTP/asset/security checks with sending disabled. |
| `README.md`, `PRODUCTION_SETUP.md`, `PHASE5_REPORT.md`, `performance/phase5-*.json`, local PNG evidence | Current usage, full report, configuration/manual gates and raw measurements. |

`World.tsx`, `HeroExperience.tsx`, camera/transition geometry, motion equations and bloom ownership were not modified. No package/lockfile update was needed. This workspace is not a Git checkout; no commit was created.

## 11. Validation results

- `npm run typecheck`: passed.
- `npm test`: **62/62 passed** (45 baseline + 17 new).
- `npm run test:smoke`: **4/4 passed**, also included in the full suite.
- `npm run build`: passed; home reports **51.9 kB / 155 kB first-load JS**; services/icon/social/robots/sitemap prerendered, inquiry routes server-only.
- `npm audit --json`: **0 reported vulnerabilities**; [saved evidence](performance/phase5-audit.json).
- `node scripts/phase5-http.mjs 3102`: **16/16 passed** against compiled production with sending disabled.
- Existing real-Three CPU composer/morph/resource tests, all six scenes, all five deterministic reverse transitions, camera boundaries, idle preparation and repaired near-plane/depth behavior pass.
- New tests cover speech events, stale callbacks, error/watchdog, unreliable controls, async voices, unsupported API/settings, scenario scripts, lifecycle cleanup/remount, fixed-recipient provider shape, mock acceptance/rejection/uncertainty, private guard payload and fail-closed configuration.

No browser audio, real provider delivery, screenshot, keyboard-only interactive walkthrough or GPU performance is asserted by these checks.

## 12. Remaining manual/browser verification

Browser inspection was denied by session policy; no alternate control/protocol workaround was used. All five requested viewports, real forward/reverse scroll, refresh/repeated modal cycles, mobile keyboard/touch, reduced motion, screen readers, browser voice quality/cancellation and startup/FPS need acceptance. Exact steps and profiler interpretation are in [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md). The local social PNG was inspected only as an artifact.

## 13. Production configuration

Supply a verified `SITE_URL` and recipient before building. Verify a sender domain, restricted provider key, current plan/quota, HTTPS atomic durable gate, authentication/salt, host protections and privacy terms. Keep delivery disabled until authorized; mocks do not establish hosted operation. Confirm canonical, robots, sitemap and social previews after rebuilding with the owned domain. Test a separately authorized real inquiry and final inbox/spam placement. No deployment authorization is implied.

## 14. Launch blockers

1. Browser visual/audio/keyboard/mobile and measured GPU/startup acceptance are incomplete.
2. Production domain and hosted canonical/social metadata are not verified.
3. Provider credentials/sender verification, durable multi-instance abuse protection and actual delivery are not configured or verified.
4. Host security/privacy/quotas and any stronger CSP policy require review.
5. Public launch requires separate explicit approval. The existing live VeytronaTech website remains untouched.

The development preview is available at `http://localhost:3001/`. Temporary production benchmark servers have been stopped.
