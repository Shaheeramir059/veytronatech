# Phase 6 repository replacement — October 11, 2026

The owner explicitly authorized replacing `Shaheeramir059/veytronatech` on `main`, including possible automatic Vercel deployment. Work was performed in a separate temporary clone. `D:\Veytrona Tech\veytronatech-3d` was not changed or removed.

## Replacement scope

The original `main` and protected-by-instruction backup both pointed to `1249ed9a96caf36ea5eee12b44ded9df18b5db43`. No operation changes `backup/pre-cinematic-nextjs-2026-10-11`. The replacement retains Git history and uses an ordinary fast-forward push, never a force push.

Removed the previous root HTML pages, static assets, nested Vite application/configuration, admin UI, contact/admin server functions, authentication/database helpers, SQL schemas, static SEO/email build scripts, `.htaccess`, and old Vercel rewrites. No old architecture is merged into Next.js.

Copied complete Phase 6 `src`, `public`, tests, validation/offline generation scripts, package/lock/configuration files and phase/setup/privacy/licensing documentation. All 28 MP3s and the exact matching manifest are included. The only historical performance file retained is `performance/phase6-generation.json`, required by the existing asset regression test; it contains reproducibility/audio measurements, not local logs or inquiry content. Other historical report measurements remain historical; raw local logs/evidence are not part of this release.

75 existing source/public files were checked byte-for-byte against the original local project. Only the submit API route intentionally differs, to enforce the release sending lock; a new small server release configuration is added. All cinematic components, GSAP mappings, deterministic transitions, bloom/morph ownership, lazy loading, quality/DPR presets, business views, portfolio, automation demo, inquiry UI and prerecorded voice player remain unchanged.

## Vercel and email configuration

`vercel.json` explicitly sets `framework: nextjs`, `installCommand: npm ci`, `buildCommand: npm run build`, `devCommand: npm run dev`, `outputDirectory: .next`, and empty rewrites. These override the old repository's static build/output/routing. `next.config.ts` forces `.next` on Vercel rather than accepting a stale custom dist-dir variable. Node 24.x is specified in both package and lockfile. See [Vercel file configuration](https://vercel.com/docs/project-configuration/vercel-json).

Repository configuration cannot inspect or reset the dashboard's Root Directory, ignored-build setting, project linkage or inherited environment. If deployment reports missing source, confirm repository root in dashboard; if skipped, review ignored-build settings. No direct Vercel deploy, DNS change or provider subscription is performed.

`src/lib/inquiry-release.ts` sets `INQUIRY_RELEASE_SENDING_ENABLED=false`. The submit endpoint overrides any inherited delivery opt-in with `disabled`. Existing server validation, spam controls, truthful states and email-draft/mailto/copy fallback remain intact. Automated tests use fictional data and mock transports, never real emails. Future real sending requires separate authorization, a reviewed flag change, verified owned sender domain, server-only Resend credentials and the configured durable atomic abuse gate described in PRODUCTION_SETUP.md. The public recipient remains fixed to `veytronatech@gmail.com`.

`.gitignore` and `.vercelignore` exclude credentials, build/install output, Python environment/cache/model files, raw WAVs and local logs. No deployment credentials are committed. `SITE_URL` remains operator-controlled for a verified owned HTTPS origin; without one indexing stays disabled. No domain or DNS ownership is inferred from a repository name.

## Validation

- Clean `npm ci`: passed, 48 packages installed.
- TypeScript: passed.
- Automated suite: 76/76 passed, including 74 existing tests and two release/configuration regressions.
- Dependency audit: zero reported vulnerabilities.
- Existing voice regression: all 28 assets match dialogue, manifest bytes, SHA-256 and content-hashed filenames; generation signal evidence is retained. Listening is not established by these tests.

- Production build: passed on Next 15.5.27 with Vercel mode enabled; all 11 static page generation steps completed, both inquiry routes remain dynamic, homepage first-load JS 155 kB.
- Compiled production HTTP: 16 general/API/security/metadata checks and 33 media checks passed on local port 3104. All 28 recordings served identical hashes, audio/mpeg, immutable caching; range 206, ETag 304, manifest revalidation and genuine missing-file 404 passed.
- Privacy audit: 130 public source/assets/generated surfaces checked, plus MP3 embedded metadata and fictional email template; zero known owner-name/phone/contact-link findings. Undisclosed unknown identity variants cannot be inferred.
- Git staging audit: 135 required release files, 28 MP3s; no forbidden build/cache/environment/model/raw-WAV/log files. Secret-pattern scan found no matches. Diff whitespace check passed.

The complete replacement is committed together. Commit SHA, push confirmation, unchanged remote backup and any visible deployment outcome are reported in the completion message after the push, rather than predicting deployment success in this file.

## Remaining acceptance limits

Source/resource and automated checks preserve the six scenes and business functionality, but do not establish browser visual acceptance, audible quality, mobile interactions, GPU frame performance or first presented pixels. Those remain the manual checks in DEPLOYMENT_CHECKLIST.md. Public deployment status and live-site replacement are only confirmed if actual commit-specific hosting evidence is visible; successful Git push alone is not proof of deployment.
