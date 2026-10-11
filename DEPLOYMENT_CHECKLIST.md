# VeytronaTech — deployment preparation and acceptance gates

October 9, 2026. Local Phase 6 is implemented. **Public launch is not authorized or fully accepted.** This checklist prepares a release; it does not deploy, change DNS or connect live email.

## Completed implementation

- [x] Six scenes/five deterministic reversible transitions, persistent canvas, lazy preparation, chrome/bloom/morph lifecycle repairs and existing quality/DPR caps retained.
- [x] 28 offline-generated recordings, exact typed manifest validation, stable dialogue IDs and full offered scenario coverage.
- [x] HTMLAudioElement Play/Pause/Resume/Stop/Replay/volume, accurate event-driven speaking/transcript state, interruption/error handling and owned-resource cleanup.
- [x] Optional actual sound-level analyser, reduced-motion static waveform, no microphone/telephony/live AI; explicitly selected browser-speech fallback.
- [x] Manifest lazy load, one next-line preload, content-hashed immutable MP3 cache policy and revalidated manifest.
- [x] Existing mobile navigation, native modal, service/Concept Demo portfolio, automation, inquiry draft fallback, security/SEO configuration preserved.
- [x] Offline reproduction scripts, pinned isolated Python requirements, model hashes, licenses and provenance documented; model/venv excluded from hosted assets.

## Verified local functionality

- [x] TypeScript; 69 automated tests including existing 3D/bloom/Strict Mode/inquiry tests and seven new recording/player/hook tests.
- [x] Production build on installed Next 15.5.27; root first-load JS 155 kB.
- [x] npm audit: zero reported Node vulnerabilities. Separate Python-tool-chain advisory audit remains pending.
- [x] 16 compiled general HTTP checks with sending disabled: API input/origin/body bounds, truthful draft, security headers, meaningful services, configured-domain behavior and icons.
- [x] 33 audio HTTP checks: all 28 byte hashes, MIME/cache policy, byte-range 206, ETag 304, missing 404 and no homepage audio preload.
- [x] Local production/development HTTP and bundle measurements saved; no GPU/paint/FPS claims.
- [x] Actual local CPU model generation completed; normalized compressed exports decoded and validated. No subjective listening sign-off.

## Manual browser and listening acceptance — required

Browser automation is blocked by the current session policy. The following are **pending**, not passed by source tests. Use real Chrome/Edge and Firefox desktop, plus Safari/iOS and Android where available. Test production for performance; repeat lifecycle/refresh tests in development Strict Mode.

| Viewport | Six scenes / five transitions | Text / overflow / touch / keyboard | Modal / portfolio / form | Audio / controls / interruption |
| --- | --- | --- | --- | --- |
| 390×844 | Pending | Pending | Pending | Pending |
| 430×932 | Pending | Pending | Pending | Pending |
| 768×1024 | Pending | Pending | Pending | Pending |
| 1440×900 | Pending | Pending | Pending | Pending |
| 1920×1080 | Pending | Pending | Pending | Pending |

### Local preparation and measurements

```powershell
# Keep real email sending disabled for all fictional tests.
$env:INQUIRY_DELIVERY_MODE='disabled'
npm run typecheck
npm test
npm run build
npm run start -- --port 3103 --hostname 127.0.0.1
# In another terminal, same project:
node --experimental-strip-types scripts/performance.mjs acceptance-production 3103
node scripts/phase5-http.mjs 3103 acceptance
node scripts/voice-http.mjs 3103
```

Open `http://localhost:3103/?profile=1`. For development use `npm run dev -- --port 3001 --hostname 127.0.0.1`. Do not run two processes sharing the same development output directory.

- [ ] Cold browser navigation: fresh cache/profile; record FCP/LCP, actual first HTML/text presentation, JS long tasks, Canvas/context, geometry, PMREM, shader warmup, first visible artwork and late-scene readiness. Repeat at least three times; ordinary reloads establish warm behavior. Test deep-link reload/scroll restoration and repeated refresh.
- [ ] Export `JSON.stringify(window.veytronaProfile?.(),null,2)` after startup, full down/up scroll, and opening/closing studio views. Its CPU submission/RAF intervals do not establish GPU time or first presented pixels. Use browser Performance/Rendering/GPU tools for actual frame time/resource behavior. Record device/browser/DPR and cold/warm methodology.
- [ ] Targets (~1s content, ≤3s first artwork, 60 FPS capable desktop) require measurements, not assumptions. Test mobile without removing the 3D experience or raising DPR caps.
- [ ] Capture real screenshots at each scene anchor at all five viewports, including contact and open Voice/inquiry panels. Check font loading, 200% text zoom, orientation/resize, safe-area and horizontal overflow.

### Cinematic and business interaction

- [ ] Hero chrome V, floating website, automation network, voice arcs, portal/immersive artwork and final emblem/contact are present. Scroll each adjacent boundary slowly and rapidly forward/reverse; verify identical paths, no jumps, empty frames, clipping flashes, depth/transparency or lighting spikes.
- [ ] Desktop copy stays readable left of artwork; mobile art stays in its region. Confirm heading entry/exit, keyboard focus scrolling and final contact CTA prominence. Enable reduced motion and disable WebGL: semantic branding/services/contact stay usable.
- [ ] Menu open/close/outside/Escape, hidden-link focus exclusion, skip link and each section anchor work. Native studio dialog traps focus, sticky Close remains visible with virtual keyboard, Escape closes and restores opener, and repeated open/close leaves one canvas without freezes.
- [ ] Inspect all service panels, five Concept Demo case studies, filters and available local previews. Optional absent media/URLs must not appear as invented client work. Automation Start/Replay/Pause/Next/Inspect and configuration work, with reduced-motion manual stepping.
- [ ] Form validation/error focus/summary, keyboard autocomplete, sticky close and touch targets work. With sending disabled, submit fictional valid data, inspect/copy a draft, request the mail application and **do not send**. Test offline/timeout recovery without false acceptance.

### Human listening and audio lifecycle

- [ ] Listen to **all 28 MP3s**, using `public/audio/receptionist/manifest.json` as the inventory. Approve warmth, confidence, consistent female timbre, pronunciation of numbers/times, natural pacing/pauses, no clipped words/harsh peaks, no excessive interior/edge silence and polite endings. Test both headphones and phone speakers. Signal validation is not voice-quality sign-off.
- [ ] In the Voice demo, run all five scenarios, offered guest counts/times, unavailable 18:30, large parties, birthday, every summary and handoff. Verify exactly the displayed AI response speaks and customer text stays silent. No booking is confirmed, real restaurant facts invented or call transferred.
- [ ] Play/Pause/Resume retain position; Stop/Replay work; volume/mute work or the mobile OS volume behavior is clear. Active highlighting starts on actual `playing`, pauses/stops on interruptions and advances only on `ended`.
- [ ] Waveform follows measured audio where analysis is supported; reduced motion is static. When analysis is unsupported/blocked, native audio remains audible with accurate state. No microphone permission prompt or fake listening state.
- [ ] While playing, change scenario/guests/time/source, reset, open another studio view, Request a Demo, close/Escape, navigate, hide page, then reopen. No overlapping/late sound or callbacks; preloaded files, AudioContext and RAF are released on unmount.
- [ ] Open/refresh the modal and confirm **no autoplay**. Simulate missing file/404, decode error, slow network, blocked autoplay/AudioContext and offline manifest. Error reports/retry and transcript remain useful; Browser voice fallback starts only after explicit selection/Play. Check fallback voice/rate/pause behavior separately.
- [ ] Network panel: opening Voice loads the manifest only; Play prepares current + immediately next response, not every scenario. Confirm mobile seeking/range behavior, repeat-play cache and no requests for venv/model weights.
- [ ] Screen reader: accessible select/range/button labels, concise playback status and no full transcript announcements over audio. Check focus order and reachable transcript without sound.

## Real provider credentials and delivery — disabled until separately authorized

- [ ] Owner verifies `veytronatech@gmail.com` recipient and chooses a provider/account with approved terms/quota. No account or verified sender is presumed.
- [ ] Configure a verified-domain `INQUIRY_FROM`, matching `INQUIRY_VERIFIED_SENDER_DOMAIN` acknowledgement, restricted server-only `RESEND_API_KEY`, trusted HTTPS `INQUIRY_ABUSE_URL`, `INQUIRY_ABUSE_TOKEN` and independent ≥32-character `INQUIRY_ABUSE_SALT` in host secret storage. Set the acknowledgement only after confirming verified sending in Resend. Never use public prefixes or commit secrets.
- [ ] Implement/verify the durable gate's atomic per-sender and global bounds, TTL, parallel/multi-instance behavior and fail-closed outages. Add host edge limits, body-read timeout and cost/quota alerts. A process limiter alone is insufficient public protection.
- [ ] Review privacy retention/disclosure, logging redaction and provider processing. Confirm idempotent retries, rejection/timeout uncertainty, acceptance receipt and duplicate protection.
- [ ] Only after **explicit owner authorization**, opt into `INQUIRY_DELIVERY_MODE=resend` and perform an authorized send to an owned inbox. Verify provider acceptance separately from final inbox/spam delivery. No real sends are part of automated tests. Keep disabled/draft fallback if these gates are not satisfied.

## Hosting configuration — provider unspecified

- [ ] Choose a host that supports Next 15.5.27, compatible Node runtime (local verification: Node 24.18), dynamic inquiry routes, Next headers and public files. Static-export-only hosting cannot run these APIs. Verify the selected provider's current runtime/Next support; none has been selected or certified.
- [ ] Verify owned HTTPS `SITE_URL` **before build** and confirm the fixed agency contact `veytronatech@gmail.com`. The old `NEXT_PUBLIC_CONTACT_EMAIL` override is ignored. Without a domain the site deliberately stays noindex with empty sitemap/no canonical. Check deployed canonical/OG URL, robots, sitemap, icon/social assets and meaningful services after any separately approved rollout.
- [ ] Deploy an atomic release containing `.next`, required runtime dependencies/config and **public/** (or the provider's equivalent artifact); exclude `.voice-venv`, `.voice-cache`, local evidence and secrets. No runtime Python/GPU/FFmpeg is required. Verify provider-specific packaging rather than assuming `next start` layout works everywhere.
- [ ] Preserve audio/mpeg, Accept-Ranges/206, ETag/304, content-hashed one-year immutable files and revalidated manifest through the CDN. Keep older hashed files during rollouts for visitors with old open sessions; do not put model downloads on the CDN.
- [ ] Verify HTTPS origin/Host through trusted proxies, CSP/header behavior, transport/TLS/HSTS policy, request timeouts and error pages. The current CSP is partial; evaluate the report-only policy in browsers before any stronger enforcement. Add no permissive security bypass merely for testing.
- [ ] Archive immutable source/build/public files, manifests, lockfiles, checksums, configuration version and tested evidence. Preserve a known-good full release and written restoration procedure. Secret rotation/configuration recovery should be separate from source rollback. There is no Git repository in this local folder; establish an approved versioned release process before launch.

## Owner approval — required final gates

- [ ] Approve the generated voice/listening checklist, 3D/screenshots/browser performance, mobile accessibility and public concept/demo wording.
- [ ] Approve verified domain, recipient, hosting/privacy choices and any provider activation independently.
- [ ] Approve a rollback-ready release and **separately authorize deployment/DNS/live-site changes**. Phase 6 does not supply that authorization and does not modify the live website.

Results and exact changed files: [PHASE6_REPORT.md](PHASE6_REPORT.md). Detailed server gate contract/configuration: [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md). Generation/licensing: [scripts/voice/README.md](scripts/voice/README.md).
