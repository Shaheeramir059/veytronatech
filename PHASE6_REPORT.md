# Phase 6 — local implementation and readiness report

October 9, 2026 · VeytronaTech · Windows / Node 24.18 · No deployment

## Outcome

The primary receptionist now plays **28 actual locally generated recordings**, with stable dialogue IDs, five selectable scenarios, playback controls, volume, event-driven transcript highlighting and optional sound-level analysis. Browser speech is a deliberately selected fallback. The existing six-scene cinematic journey and business features remain in place.

**TypeScript, 69 tests, production build, 16 compiled general HTTP checks, 33 audio HTTP checks and npm audit pass.** No email, paid service, microphone, telephony, live AI, deployment, DNS or live-site change was made. Browser policy blocks visual/playback inspection, so human voice approval, mobile behavior and GPU/FPS/startup acceptance remain launch gates.

## Model evaluation, hardware and licensing

Chatterbox was evaluated first. Its [MIT license](https://github.com/resemble-ai/chatterbox/blob/master/LICENSE) permits commercial software use with notices. The [current package](https://github.com/resemble-ai/chatterbox/blob/master/pyproject.toml) pins PyTorch/torchaudio 2.6 for Python 3.11, and the [repository](https://github.com/resemble-ai/chatterbox) describes a Debian-tested stack. The machine initially had no PyTorch and no `nvcc` on PATH. [PyTorch 2.7](https://pytorch.org/blog/pytorch-2-7/) introduced Blackwell support; its release announcement is not proof of this Windows/RTX configuration. A newer driver does not resolve an untested pinned application stack automatically. Chatterbox was not installed, patched or inference-tested; GPU compatibility and its actual peak VRAM remain unverified.

For planning only, an original 500M-parameter model's FP32 parameters alone occupy about 2 GB; auxiliary models, activations and CUDA allocations add an unknown amount. A rough several-GB budget (approximately 3–6 GB, potentially more) is **an estimate, not a measured fit in 8 GB**. Newer Chatterbox variants may merit a separate evaluation; this phase did not need to force a large GPU stack into the environment.

Selected **Kokoro-82M v1.0 ONNX**, commercially usable [Apache-2.0 model weights](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/README.md), through [kokoro-onnx's MIT wrapper](https://github.com/thewh1teagle/kokoro-onnx/blob/main/LICENSE). One [model-provided female American English preset](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md), `af_heart`, is used throughout. No cloning sample or real person's identity was used. Full Apache/MIT license copies and upstream dataset provenance are in `scripts/voice/`; model commercial permission does not certify the subjective quality or copyright status of every output.

Actual hardware: RTX 5060, **8,151 MiB VRAM**, driver **610.88**. `nvidia-smi` initially reported driver CUDA capability 13.3; no installed toolkit was established. Global Python 3.11.9 was reused only to create `.voice-venv`. ONNX Runtime **1.30.0 CPUExecutionProvider** and kokoro-onnx **0.6.1** successfully generated every recording on Windows. No PyTorch, CUDA toolkit, GPU ONNX package, driver change or Node dependency was installed. Selected inference needs **zero CUDA VRAM** because it uses CPU; GPU inference was not tested. A hypothetical GPU path has roughly 328 MB of FP32 weights plus runtime/activation overhead, with peak unknown.

Evidence: `performance/phase6-hardware.json`, `phase6-generation.json`, `scripts/voice/models.lock.json`. Peak generator process RSS was **929,280,000 bytes (886.2 MiB)**, sampled every 50 ms, excluding separate FFmpeg subprocess memory. This is RAM, not a GPU measurement. The final export run took **115.228 seconds**, model initialization **1.003 seconds**, with four CPU inference threads. Generation is entirely offline after downloading the licensed model files; no inference service is involved.

## Dialogue, assets and quality checks

The old system had only reservation/check/availability/handoff responses. It lacked restaurant-information, guest-count, birthday, spoken summaries and closing branches. Source dialogue now lives in `src/lib/receptionist-dialogue.json`, separate from assets. Every receptionist response has a stable ID and exact text-to-recording match.

Five scenarios cover table requests, restaurant information, birthday requests, summaries and closing. Available 19:00/20:00, unavailable 18:30, parties of 2/4/6/8/12, large-party review, fifteen explicit guest/time summaries, a generic summary for other counts, and handoff are covered. Restaurant details are explicitly sample data; no booking is confirmed. Every generated utterance is reachable by the conversation tests.

| Verified export property | Result |
| --- | --- |
| Recording count | 28 MP3s |
| Total recording bytes | **2,527,376 bytes**, 2.53 MB / 2.41 MiB |
| Manifest | 14,245 bytes |
| Total speech duration | 313.379 seconds |
| Format | Mono, 24 kHz, 64 kbps MP3 |
| Voice / synthesis speed | af_heart / 0.95 |
| Measured integrated loudness | −18.93 to −18.43 LUFS |
| Highest decoded sample peak | −1.655 dBFS |
| Highest measured true peak | −1.64 dBTP |

Two-pass FFmpeg normalization targets −18 LUFS / −1.5 dBTP. Guarded silence trimming, short edge fades and end padding avoid abrupt hard cuts. Every compressed export is decoded, measured and checked before publication. The manifest includes ID, spoken text, branch, version, same-origin path, decoded duration, byte size and SHA-256. Filenames use the **encoded content hash**, preventing immutable cache collisions when inference/export bytes vary. Only verified recordings appear in the manifest; obsolete generated files are cleaned after a complete manifest is published.

Signal checks show no clipping and controlled loudness. **No human listening or real browser audio quality is claimed.** Pronunciation, softness, expression, cadence, sentence endings and consistency require owner listening on headphones and phone speakers. Tools can miss a mispronounced word, synthetic inflection or interior pause. The voice is generated, not a human receptionist.

Regeneration: follow `scripts/voice/README.md`, edit source dialogue, then run `.\.voice-venv\Scripts\python.exe scripts/voice/generate.py`. Dependency pins, release URLs and model checksums are saved. Reproduction means repeatable tooling/inputs; small inference changes across runs/tool versions are possible, and exported content hashes capture them. Models/cache occupy **353,719,767 bytes** plus the isolated venv and raw WAVs; none belong in the hosted artifact.

## Playback and UX

`RecordedVoiceOutput` owns one active HTMLAudioElement and at most one upcoming receptionist preload. The next response reuses its preload. Each line owns its element/listeners; abandoned source events and play-promise rejections cannot mutate a replacement. `playing`, `waiting`, `pause`, `ended`, `error` and `abort` drive actual state and script advancement. A twelve-second startup/buffering watchdog detects failure without guessing a speech duration. Pause/resume preserve native playback position; Stop/reset/unmount release the current/preloaded sources and invalidate callbacks. Decode failure, autoplay denial, missing/outdated recordings and interrupted playback report actionable errors rather than claiming speech succeeded.

The hook fetches only the manifest when VoiceDemo mounts, supports retry, aborts stale loads, and stops playback on navigation/page hiding. Modal close and studio-view changes unmount it, releasing media, listeners, RAF and AudioContext. The explicit fallback keeps the existing SpeechSynthesis lifecycle tests and identifies its browser-dependent quality/network voice behavior. It never starts automatically after a recording error.

The optional Web Audio analyser uses one reused sample buffer and a CSS variable for actual RMS levels, avoiding React updates every frame and adding no WebGL effect. It binds media only after AudioContext resumes successfully, preserving native playback if analysis is denied. Reduced motion freezes the bars; other playback state changes still highlight/announce the active response. The browser fallback uses a steady speaking indicator, not fake measured microphone activity. No microphone permission is requested.

Scenario/audio-source changes cancel both adapters; transcript controls remain available while assets load or fail. The UI adds a scenario selector, primary/fallback source selector and a volume slider with a 44-pixel control height. Existing Play/Pause/Resume/Stop/Replay, handoff, staff preview and Request a Demo actions remain. Some mobile OSes control HTMLAudioElement volume through system controls; this is noted in the interface. No unrelated copy, link, concept label or branding was changed.

## Cinematic and mobile review

Inspected the hero, World, deferred preparation, scroll/typography mappings, composer/resource ownership and studio lifecycle. **No new reproducible 3D defect was established by source/CPU checks**, so working camera, geometry, bloom and morph code was preserved. Tests still exercise all six stages and all five forward/reverse transformations, continuous boundaries, resource reuse/disposal, Strict Mode, resize quality changes, portal near-plane clearance and reduced-motion fallback. The measured CPU portal depth sweep retains 2.3532 world units minimum clearance with a 0.1 near plane.

Typography tests cover **390×844, 430×932, 768×1024, 1440×900, 1920×1080**, with representative measured-height inputs and slow/rapid progress changes. These are mathematical bounds, **not rendered viewport screenshots**. Mobile navigation, native dialog focus/close behavior, portfolio concepts, form structure and automation controls retain their existing implementations/tests. Responsive selects wrap; the new slider uses existing mobile layout. Actual font metrics, overflow, touch/keyboard interaction, transparency, intersections, lighting and listening on all five viewports remain unverified. No website screenshots were captured.

## Actual loading/performance evidence

Fresh local `npm run start` processes were benchmarked before and after; first request followed by five warm HTTP requests. Development was measured separately after restarting port 3001, retaining its disk compiler cache. These are local server responses, not browser navigation, paint or GPU timing.

| Measurement | Phase 6 baseline | Final |
| --- | ---: | ---: |
| Production first TTFB | 28.916 ms | 58.839 ms |
| Production first HTML chunk | 29.256 ms | 59.490 ms |
| Production warm median TTFB | 1.919 ms | 3.740 ms |
| Root HTML bytes | 15,946 | 15,946 |
| Build-reported root first-load JS | 155 kB | 155 kB |
| World dynamic gzip | 248,503 bytes | 248,503 bytes |
| Later artwork dynamic gzip | 4,806 bytes | 4,806 bytes |
| Lazy studio shell gzip | 6,107 bytes | 6,107 bytes |
| Lazy demos gzip | 5,829 bytes | 9,710 bytes |
| Styles gzip | 7,882 bytes | 7,929 bytes |

Final development first HTML chunk was **2,122.881 ms**, warm median TTFB **57.052 ms**; first route compilation is included. The much larger development modules/compilation are a measured contributor to development startup delay. Production HTTP timing varied upward; this is **not a demonstrated speed improvement**. The HTML/3D payloads remain byte-identical; added playback code/text costs about 3.9 KB gzip only in the lazy demo chunk. The homepage neither references nor preloads audio/manifest; default three-response playback uses 170,628 recording bytes, not all 2.53 MB.

CPU ribbon benchmark before/final: desktop six cold ribbons **6.816/11.055 ms**, warm median **0.784/1.533 ms**, cached leases **0.0020/0.0035 ms**; mobile cold **0.356/0.579 ms**, warm **0.324/0.570 ms**, cached **0.0014/0.0026 ms**. Source/bundles are unchanged; these isolated runs show variability and do not establish a new rendering improvement or GPU regression.

**Unmeasured:** JS execution/long tasks in a browser, Canvas mounting, actual context initialization, shader and PMREM GPU costs, first visible 3D frame, late-scene readiness, scroll FPS/frame intervals, GPU memory/utilization, and real modal-open latency. Existing `?profile=1` / `window.veytronaProfile()` instrumentation remains available. Its CPU submission/RAF intervals are not GPU timers or confirmed pixel presentation. The one-second content, three-second artwork and 60 FPS targets remain acceptance targets, not achieved claims.

## Inquiry, security, privacy and SEO

Re-audited shared strict validation, body limits, origin/Host checks, honeypot, bounded attempts, draft adapter, provider idempotency/uncertainty and durable gate. Compiled tests used **INQUIRY_DELIVERY_MODE=disabled** and fictional `test@example.com` input. The form continues preparing an honest draft addressed to **veytronatech@gmail.com**; no real email was sent. A provider receipt means acceptance, never guaranteed inbox delivery. No credentials, verified sender or durable service are available. `PRODUCTION_SETUP.md` documents all required server-only variables, atomic gate contract and separate authorized end-to-end test.

Security headers, denied camera/microphone/geolocation, no-store inquiry responses, input failures and server-only credential separation passed compiled checks. Source review found no browser storage or microphone integration. npm audit reports **zero current Node vulnerabilities**; it does not certify the entire application, external host or offline Python tool chain. The isolated Python dependencies are pinned but have not received a separate advisory audit. CSP remains the existing enforced object/base/frame/form restrictions with optional compatibility report-only policy; a full nonce-based script policy, host TLS/HSTS/proxy trust/edge throttling and provider privacy retention still need hosting/browser work. No protections were weakened.

Root branding/headline/CTA and meaningful `/services` business content are server-rendered. Title/description, semantic service heading, truthful structured data, SVG favicon, 180×180 PNG icon, 1200×630 social image and internal contact links passed checks. `SITE_URL` is unset: no canonical is invented, robots disallows indexing, sitemap has no fabricated locations and metadata stays noindex/nofollow. Set the verified owned HTTPS origin **before build**. No customer, award, review, statistic or contact address was fabricated; all five projects remain Concept Demo.

## Changed files and validation

- Playback: `src/lib/recorded-voice.ts`, `src/lib/use-recorded-voice.ts`, optional ID in `src/lib/voice-output.ts`.
- Conversation/UI: `src/lib/receptionist-dialogue.json`, `src/lib/demo-motion.ts`, `src/components/business/Demos.tsx`, `src/app/business.css`.
- Assets/config: `public/audio/receptionist/manifest.json` and 28 content-hashed MP3s; `next.config.ts` audio cache headers; `.gitignore` isolated environment/cache exclusions.
- Offline tools: `scripts/voice/download.py`, `generate.py`, `requirements.txt`, `models.lock.json`, guide, license/provenance document and Apache/MIT texts.
- Regression/evidence: `tests/recorded-voice.test.mjs`, `recorded-hook.test.mjs`, updated primary-mode assertion in `tests/phase5.test.mjs`, `scripts/voice-http.mjs`, optional report label in `scripts/phase5-http.mjs`, `performance/phase6-*` files.
- Documentation: this report, `DEPLOYMENT_CHECKLIST.md`, `README.md`, `PRODUCTION_SETUP.md`. Next may regenerate `next-env.d.ts` while switching development/production types; it was not manually rewritten.

The seven added tests cover real asset content hashes/measurements, all 180 scenario/guest/time/handoff combinations, event-driven playback/preload reuse, cancellation/stale callbacks, playback failures/watchdogs, manifest trust boundaries and the actual React hook's analysis/preferences/navigation/unmount/remount/retry lifecycle. Browser media is mocked in these tests; actual DOM media decoding/playback is not claimed. Existing 62 tests remain, including 3D/inquiry/SEO/fallback regressions.

Commands run: `npm run typecheck`, `npm test` (**69/69**), `npm run build` (success; 11 generated pages; root 51.9 kB / first-load 155 kB), `npm audit --json` (zero), `node scripts/phase5-http.mjs 3103 phase6` (**16**), `node scripts/voice-http.mjs 3103` (**33**), and before/final/development `scripts/performance.mjs` benchmarks. Final console test evidence is `performance/phase6-tests.txt`; JSON evidence covers audit, model generation, hardware, HTTP and performance. No Git repository exists here, so changes cannot be committed.

## Launch gates and exact next steps

1. Complete the manual matrix and listening checklist in **DEPLOYMENT_CHECKLIST.md**, including cold/warm/repeated refresh, all five transitions both directions, mobile/keyboard/modal/audio interruption and slow-network recovery. Browser control was blocked by session policy; no alternate browser/protocol was used.
2. Obtain owner approval of the synthetic voice, artwork, public copy, concept labels, recipient and privacy terms. Regenerate any mispronounced/unnatural lines before rebuilding.
3. Identify the intended hosting provider. Node/Next routes, static media, headers, byte ranges, HTTPS/proxy origins and CDN retention must be verified on that provider; no host compatibility is presumed.
4. Set verified domain/contact metadata before build. Sending remains disabled unless separately authorized with a verified sender, recipient, API credentials and fail-closed durable abuse gate. Do not test a real provider automatically.
5. Reproduce the documented local validation and archive a complete rollback release. **Deployment requires separate authorization**; no deployment/DNS action is part of Phase 6.

The development preview is available at **http://localhost:3001/**. Open Services → Voice demo or the studio Voice tab, select a scenario, then press Play Voice Demo. No audio should begin on modal open.
