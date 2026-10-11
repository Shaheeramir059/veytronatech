# Production configuration and launch gates — Phase 6

## October 11 repository replacement

The owner authorized replacing GitHub `main` and the resulting possible automatic Vercel deployment. `vercel.json` now selects Next.js and `.next`, overrides legacy build/install settings and removes old rewrites. Use Node 24.x at the repository root. An inherited dashboard Root Directory or ignored-build setting still needs dashboard inspection; file configuration cannot certify those settings. No DNS change or direct Vercel deployment command is included.

This release additionally locks `src/lib/inquiry-release.ts` to false. Even complete inherited delivery credentials cannot activate website sending. After separate owner authorization, sender verification and durable abuse validation, a reviewed release must change that flag to true as well as configure all server variables below. Until then the form prepares an honest email draft. No secrets belong in Git or `vercel.json`.

Prior launch status statements below record local phase work. Consult [REPLACEMENT_REPORT.md](REPLACEMENT_REPORT.md) for current replacement evidence. Browser/listening acceptance remains pending.

The local implementation is complete; **public launch is not approved or verified**. No website was deployed, no provider account was created, no email was sent, and no paid service was activated. The primary receptionist now uses offline-generated MP3 recordings; browser speech remains an explicit fallback. Neither needs a hosted voice server or site API key. See [PHASE6_REPORT.md](PHASE6_REPORT.md) and [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for current evidence and the required browser/listening gates; the earlier SpeechSynthesis-specific checklist below is historical fallback guidance.

## Prerecorded voice assets and hosting

Ship the entire `public/audio/receptionist/` folder with the application. Keep the manifest and recordings in the same release. Next headers make content-hashed MP3s immutable for a year and revalidate the manifest; local production checks verify audio/mpeg, byte-range 206, ETag 304 and genuine 404 responses. Preserve these headers and HTTPS same-origin media delivery through any future CDN/proxy. Retain previous content-hashed recordings during a future rollout for visitors with an older open demo. Exclude `.voice-venv` and `.voice-cache` from hosting; no Python/GPU/FFmpeg is needed at runtime. Reproduction and licensing: [offline guide](scripts/voice/README.md).

Hosting is **not specified or verified**. This is a Next server application with inquiry API routes, not a static-export-only site. Use a provider supporting the installed Next.js version, its Node runtime, headers and public assets; verify proxy/origin behavior, TLS, caching, streaming limits and the durable gate before opt-in. Local commands are `npm run build` and `npm run start -- --port 3103 --hostname 127.0.0.1`. Set verified domain/contact variables before building; keep `INQUIRY_DELIVERY_MODE=disabled` until separately authorized.

## Domain, contact and indexing

Copy `.env.example` deliberately. Set `SITE_URL` to the **verified HTTPS origin you own**, with no path, query, credentials or fragment. No domain is assumed. Until this is configured, metadata says `noindex, nofollow`, robots disallows crawling, sitemap is empty and canonical/social image URLs are omitted. Set it **before `npm run build`**, because metadata, robots, sitemap and services are static production artifacts.

The public and delivery contact is fixed to `veytronatech@gmail.com` in `src/lib/contact.ts`. It synchronizes the final-scene email link, drafts, provider recipient, services and structured data. The old `NEXT_PUBLIC_CONTACT_EMAIL` override is ignored, preventing a deployment from exposing a personal replacement. Do not invent a telephone, address, reviews or client outcomes.

The favicon is `/icon.svg`, the application icon is `/apple-icon`, and the code-native 1200×630 PNG social card is `/social-image`. These are generated locally, without downloaded imagery. Verify social preview caching against the actual domain after any future approved deployment.

## Server email adapter — explicitly disabled locally

`POST /api/inquiry/submit` validates the inquiry and chooses configured delivery or an email-client draft. The original `POST /api/inquiry/prepare` remains draft-only. Shared strict Zod validation, honeypot rejection, a 24 KiB streamed body ceiling, same-origin/Host checks, MIME restrictions and a process-wide 30 attempts/minute ceiling apply to both routes. Each route has its own local ceiling. No inquiry database, analytics or visitor-content log is added.

The Resend HTTP adapter uses a fixed configured recipient, a verified-domain sender, visitor `reply_to`, a plain-text body, a ten-second timeout, no redirects, and a stable UUID idempotency key. No SDK or recurring voice service was added. A valid provider response ID means **accepted for sending**, not inbox delivery. HTTP 4xx means rejected; 5xx, timeout, invalid receipts or network errors mean acceptance is unknown. No automatic retries occur. Retry the same unchanged payload with the same key; changing fields creates a new request. After acceptance, the submit button is disabled until a deliberate field edit. Closing the form does not recall an already accepted provider request.

Resend currently documents a free transactional tier of 3,000 emails/month, limited to 100/day. This is provider information, **not an entitlement, account or quota this project owns**. Check current terms, overage behavior and sender verification yourself before choosing a plan. No plan was purchased. Sources checked October 9, 2026: [pricing](https://resend.com/pricing), [send API](https://resend.com/docs/api-reference/emails/send-email), [24-hour idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys).

All these **server-only** values must be supplied deliberately before enabling sending:

- `INQUIRY_DELIVERY_MODE=resend` — explicit opt-in; default `disabled`.
- `RESEND_API_KEY` — restrict to email sending; never use a `NEXT_PUBLIC_` prefix.
- `INQUIRY_FROM` — bare email address on a provider-verified domain. The visitor address is never used as `from`.
- `INQUIRY_VERIFIED_SENDER_DOMAIN` — exact domain of `INQUIRY_FROM`, set only after verified sending status is established in Resend. This is an operator acknowledgement, not an automatic DNS lookup. Missing/mismatched values and Gmail sender domains keep sending disabled; Resend enforces actual verification.
- `INQUIRY_ABUSE_URL` — your trusted HTTPS durable limiter endpoint.
- `INQUIRY_ABUSE_TOKEN` — authorization for that endpoint.
- `INQUIRY_ABUSE_SALT` — independent random secret, at least 32 characters.

Credentials alone do not activate delivery. Incomplete configuration returns a draft; check configuration deliberately, rather than interpreting a draft as a sent inquiry. No real credentials were available or used. All provider/guard tests use mocked transports. Real provider acceptance, spam placement, inbox delivery, DNS sender verification, quotas and hosted connectivity remain unverified.

## Durable abuse gate contract

This project includes a provider-neutral HTTP adapter; **the hosted durable limiter itself is not provisioned**. Reuse an approved host-owned service or implement the endpoint against an atomic durable store. Do not point it at an arbitrary third-party URL. The bearer-authenticated POST contains only:

```json
{"key":"HMAC-SHA256 of normalized sender email","limit":3,"windowSeconds":3600,"globalLimit":30,"globalWindowSeconds":60}
```

The endpoint must atomically enforce both per-key and global limits across instances, expire keys, return JSON `{"allowed":true}` only when allowed, and fail closed otherwise. The application fails closed on timeout, errors and malformed responses **before invoking the email provider**. Every retry consumes a gate attempt. The HMAC does not contain inquiry text, but pseudonymous keys still require a retention policy. Verify parallel requests, multi-instance behavior, quotas and outages before opt-in. Rotating the salt resets sender identity; plan rotations deliberately.

The in-process limit is only an additional local bound, not durable public abuse protection. Email identities can be changed by attackers. The application now cancels stalled body reads after five seconds and returns no-store HTTP 408. Add verified host/edge global connection and request throttling, transport/header timeouts and cost/quota alerts before launch. Trust forwarded IP headers only after a host-specific proxy configuration is verified. If stronger bot proof is needed, add it deliberately; this phase does not assume a paid CAPTCHA or provision infrastructure.

## Security, privacy and CSP

Production HTTP checks confirmed nosniff, DENY framing, strict-origin referrers, and disabled microphone/camera/geolocation permissions. The enforced CSP currently restricts objects, base URLs, framing and form destinations; it does **not** claim to provide a full script/stylesheet policy. Browser chunks were scanned to confirm the delivery endpoint and private credential identifiers were absent. Provider responses, secrets and inquiry text are not logged.

`VEYTRONA_CSP_REPORT_ONLY=1` enables an optional compatibility policy for local/hosted manual inspection. It permits Next inline hydration and inline styles, Google Fonts, code-native data images and configured HTTPS portfolio media. It has no report collector: inspect browser console violations. Do not blindly enforce a restrictive script policy that breaks hydration/GSAP. A nonce/hash-based script policy and its Next caching implications require browser verification before launch. Development needs its own HMR policy. TLS/HSTS, proxy trust, transport protections and production logging/redaction must be verified on the future host.

The form discloses that configured sending forwards contents to an email provider that may retain them. The site itself does not store inquiry contents. Review the provider's retention/processing terms and publish any required privacy notice before public use. Do not share confidential information through the concept form.

## Manual browser acceptance — currently blocked

Browser automation was denied by this session's browser policy. No alternate browser or protocol was used. CPU reconciler tests and HTTP checks do not verify real audio, WebGL, pixel layout, assistive technology or mail application launch. A locally rendered social PNG was inspected as an image; it is not a screenshot of the website.

1. Run `npm run build`, then `npm run start -- --port 3102 --hostname 127.0.0.1` with `INQUIRY_DELIVERY_MODE=disabled`. Open `http://localhost:3102/?profile=1`. Use fresh browser cache for cold runs and ordinary reloads for warm runs. Keep local sending disabled for fictional test inquiries.
2. At **390×844, 430×932, 768×1024, 1440×900 and 1920×1080**, inspect all six anchors, all five transitions down and up, rapid scroll, slow scroll, refresh/deep-link restoration, resize and 200% text zoom. Confirm readable copy, right-side desktop artwork, mobile composition, no horizontal overflow or near-plane flashes and a usable final CTA. Capture actual screenshots at each anchor.
3. Export `window.veytronaProfile()` after opening, scrolling, and closing panels. Record navigation/paint entries, Canvas/context/setup marks, geometry, PMREM, shader warmup, first hero CPU submission, scene readiness, failures and median/p95 frame intervals. `studio-code-load` and `studio-shell-ready` measure the lazy studio shell; individual demo chunks may still be loading. These are CPU submission/RAF intervals, not GPU timing or guaranteed first visible pixels. Use browser Performance/Rendering tools to verify actual first 3D presentation, long tasks, scroll FPS and GPU workload. Targets of ~3 seconds and ~60 FPS remain unverified.
4. Open every service and all five concept studies, filters, desktop/mobile layout preview, shape/palette controls, and future-media fallbacks. Open/close the modal repeatedly; confirm no Canvas remount, background frames pause after readiness, focus restoration and no freezes. Check all existing scene links and contact mailto.
5. Run Automation Start/Replay/Pause/Next/Inspect and change sample interest/timing. Enable reduced motion: stepping stays manual and the 3D fallback/normal reading flow is usable.
6. In Voice demo, test Play/Pause/Resume/Stop/Replay, asynchronous voices, a local English voice, rate changes, unavailable 18:30, 12 guests and host handoff. Listen to confirm only AI responses speak, the active response is highlighted and waveform movement follows actual speaking. Some browsers restart a response when pause/resume events are unreliable; the UI reports this explicitly. Check unsupported synthesis and failed/absent voices: full transcript remains usable. No sound may start on modal open, scenario change or reload.
7. While audio speaks, change scenario/voice/rate, reset, switch tabs, close/Escape, navigate and hide the page. Confirm cancellation without duplicate utterances. Repeat development mount/unmount/reload on port 3001. Test Chrome/Edge, Firefox and Safari/iOS where available; voice availability and audio quality are browser/OS dependent.
8. Use keyboard only for skip link, mobile menu, studio tabs, modal trap/Escape, form controls/error summary and voice controls. Confirm hidden menus have no focusable links and modal close restores the opener. Test a screen reader: state announcements should be concise and whole transcript should not be announced over spoken audio.
9. On a real phone, open its virtual keyboard in the form and voice settings, scroll to each field, and verify safe-area/viewport resizing, touch targets and sticky Close access. Browser-specific keyboard behavior is unverified by CSS alone.
10. Submit invalid fields, honeypot, repeated requests and a valid fictional inquiry with sending disabled. Review/copy/select the draft and launch the email application; do not send the fictional data. Check offline/timeout messaging preserves uncertainty and unmount cancels client work. Only after explicit owner approval and verified hosted configuration, run an authorized real send to an owned inbox, capture provider acceptance and inspect final delivery/spam separately.

Before launch: approve the artwork/audio/keyboard/mobile QA; verify the owned canonical domain; verify hosted sender/recipient, durable abuse gate and limits; establish privacy and host protections; and obtain separate deployment authorization. No live site changes are included here.
