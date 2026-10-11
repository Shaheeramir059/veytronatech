# Final contact and privacy update

October 11, 2026 · Existing local VeytronaTech Next.js project only

## Personal-information audit and changes

No known owner name, personal phone number, telephone contact link or WhatsApp contact link was found in current website content or public assets. **No existing personal biography/number was removed**, because none was present in these surfaces. No founder, address, phone, team member or credential was invented.

Checked homepage/contact/footer/navigation, services/portfolio data, layout SEO/Open Graph metadata, JSON-LD, public SVG/audio manifest/28 recordings, embedded MP3 tags, compiled client chunks/maps and prerendered HTML/RSC/body/meta artifacts. There are no PDF/Word brochures or other public downloadable documents in `public/`. Rendered social-image and application-icon PNGs were inspected directly: agency branding and V logo only. This was image-file inspection, not website browser screenshots. Audio source text and exact recorded hashes are validated; no new subjective listening is claimed.

The scan covered **129 files** with **zero findings**. It searches the known owner first name, Pakistani phone-shaped literals and personal contact-link patterns; an undisclosed exact phone number or unknown name variant cannot be inferred. Two initial raw `tel:` matches were React's `tel:!0` supported-input-type entries, not public telephone links. Framework code was preserved. Private development reports/cache/server traces were intentionally excluded from deletion or identity rewriting.

The real privacy improvement is removing the **public contact override**: `src/lib/contact.ts` now always exports **veytronatech@gmail.com**. A deployment's `NEXT_PUBLIC_CONTACT_EMAIL` can no longer substitute a personal address. All existing scene/service/form/metadata consumers share this agency constant. The server provider's optional recipient override was also removed, fixing its destination to the same agency inbox. Email draft/template greeting remains **Hello VeytronaTech** with no owner signature or phone. Client-supplied names/reply emails are still collected as explicitly requested inquiry fields; they are not owner identity references.

Evidence: `performance/contact-privacy-scan.json`, `contact-privacy-social.png`, `contact-privacy-icon.png`. Repeat with `node --experimental-strip-types scripts/contact-privacy-audit.mjs` after every production build. FFprobe must be available for embedded recording-tag checks.

## Automatic delivery implementation

The form already uses **POST /api/inquiry/submit**; it does not require launching an email application when website delivery is configured. This update reuses the Phase 5 system and does not introduce another form or contact service.

The existing shared strict Zod schema validates browser/server inputs. The Node-only Resend adapter sends a plain-text inquiry to **veytronatech@gmail.com**, from the verified agency-domain address, using the visitor's address only as `reply_to`. API credentials remain server-only. An unchanged request reuses its UUID provider idempotency key; pending/accepted submission controls prevent ordinary duplicate clicks. No automatic retries or inquiry database was added.

The UI reports processing, provider acceptance, rejection and uncertain acceptance separately. A valid provider receipt is required for acceptance; it never means confirmed inbox delivery. Timeouts/5xx/malformed receipts preserve uncertainty, and the mailto/copy-draft fallback remains accessible. Privacy disclosure, form labels, validation/error focus and existing responsive layout are unchanged. [Resend idempotency keys](https://resend.com/docs/dashboard/emails/idempotency-keys) last **24 hours**, not forever; browser request keys are session-local, so new sessions/edited submissions are not permanent cross-session deduplication.

New safety gate: `INQUIRY_VERIFIED_SENDER_DOMAIN` must match the domain of `INQUIRY_FROM`, and Gmail sender domains are rejected. Missing acknowledgement, mismatched domain, incomplete credentials/gate settings or non-resend mode return the honest draft adapter. This is **owner/operator acknowledgement**, not automatic DNS/provider verification. Set it only after confirming verified sending in the provider dashboard; Resend independently enforces actual verification. No provider credential/account/domain is presumed or queried in this session.

## Provider suitability and domain requirements

Checked current primary documentation on October 11, 2026. Resend's [free account limits](https://resend.com/docs/knowledge-base/account-quotas-and-limits) are **100 transactional emails/day and 3,000/month**, including received messages if inbound is enabled. Its [pricing](https://resend.com/pricing) includes a free plan. This can suit a low-volume agency inquiry form, subject to the owner's actual account quotas; no entitlement, subscription or account was created.

[Resend requires an owned verified sending domain](https://resend.com/docs/dashboard/domains/introduction). `veytronatech@gmail.com` is the **recipient**, not a sender domain the agency can verify. Use a domain/subdomain the owner already controls; none was supplied here. Do not use the visitor's mailbox as `from` or rely on the provider's test domain for arbitrary live recipients.

After separate authorization for account/DNS setup, the owner should add the chosen domain in Resend and copy the **exact records shown** in its Records tab. [Current domain guidance](https://resend.com/docs/dashboard/domains/manage-domains) includes DKIM/SPF and may generate CNAME-based SPF verification for newer domains; do not invent fixed TXT/MX/CNAME values from an old example. Configure DMARC deliberately without disrupting existing email. Wait for verified sending status before setting the matching acknowledgement. No DNS changes were made here.

## Durable rate limiting and security

Existing safeguards remain: same-origin/Host validation, cross-site rejection, JSON-only input, honeypot rejection, strict schema, 24 KiB body ceiling, at most 4,096 chunks, per-route/process 30 attempts/minute, no-store responses, ten-second provider deadline, UUID idempotency and no secrets/customer payload in logs. New code cancels a stalled body read after **five seconds**, releases its reader and returns no-store **HTTP 408**, without calling the adapter.

Before every send the existing HTTPS bearer-authenticated durable guard receives only an HMAC-SHA256 of the normalized sender address and this contract:

```json
{"key":"<salted sender digest>","limit":3,"windowSeconds":3600,"globalLimit":30,"globalWindowSeconds":60}
```

Only a successful JSON `{"allowed":true}` permits sending. Denial, malformed response, network failure or three-second timeout fails closed before Resend. Salts/tokens/keys are server-only. The guard must atomically enforce both counters and expiry across every site instance; HMAC keys are pseudonymous and need a TTL/retention policy. Store counters/digests, not inquiry contents.

**Hosting has not been selected and no durable backend/endpoint is configured.** Therefore live sending remains disabled. Exact service/storage selection cannot be certified without the hosting environment. For serverless/multiple Node instances, use an approved shared Redis/transactional SQL/host-native atomic store behind the existing guard endpoint; do not use process memory or an ephemeral filesystem. A single Node host can use a durable transactional store, but it still needs backup/atomicity/expiry verification. Never treat the application's extra in-process counter as the production guard.

The host-owned endpoint must authenticate the bearer token, accept only valid 64-character digests, enforce fixed server-side policy, atomically check/update sender and global windows, return `allowed:false` on failure and expire pseudonymous records. Test concurrent requests from multiple app instances, boundary expiry and store outages. Add host/edge connection throttling, transport/header timeouts and a global daily/monthly budget below the provider allowance, considering any other apps sharing the account. These are hosting setup requirements, not provisioned infrastructure. No paid CAPTCHA/service was activated.

## Exact setup before actual delivery

1. Identify the intended Next.js host and approved durable store/guard owner. Preserve same-origin HTTPS/Host behavior through its trusted proxy; verify Node runtime, limits, secret storage and outbound access.
2. Obtain separate owner authorization for provider/domain/abuse-service setup. Verify the owned sender domain and agency recipient. No purchase or DNS work is included in this update.
3. Create a restricted sending API key and configure these **server-only** values in host secret storage. Keep mode disabled during setup. The placeholders below are documentation, not configured credentials:

```dotenv
INQUIRY_DELIVERY_MODE=disabled
RESEND_API_KEY=<restricted private Resend sending key>
INQUIRY_FROM=inquiries@<owned verified sending domain>
INQUIRY_VERIFIED_SENDER_DOMAIN=<exact same verified sending domain>
INQUIRY_ABUSE_URL=https://<owner-controlled host>/limit
INQUIRY_ABUSE_TOKEN=<private bearer token>
INQUIRY_ABUSE_SALT=<independent random secret of at least 32 characters>
```

4. Provision and test the guard against its atomic shared store as described above and in **PRODUCTION_SETUP.md**. No keys may use a `NEXT_PUBLIC_` prefix. Leave tracking disabled unless separately approved; review provider retention/processing terms and existing disclosure.
5. Run local TypeScript/tests/build/privacy scan with sending disabled and fictional inquiries. Verify missing/invalid gate/domain settings stay draft-only, provider/guard failures are truthful, and no secrets appear in browser chunks. Existing tests mock every provider transport.
6. **Only after separate authorization to enable sending**, change mode to `resend` and restart/release the server so its module-initialized adapter uses the new environment. Test an explicitly authorized inquiry to an owned inbox; inspect provider acceptance and actual inbox/spam delivery separately. Never use real sends in automated tests. If verification or guard readiness is missing, keep mode disabled and the mailto fallback.
7. Any deployment or DNS change requires separate authorization. This work did neither.

## Validation and preservation

- `npm run typecheck`: passed.
- `npm test`: **74/74 passed** (69 existing + 5 privacy/domain/gate/body-timeout regressions). Inquiry data is fictional; provider and durable guard transports are mocked.
- `npm run build`: passed; 11 generated pages; root first-load JavaScript remains **155 kB**.
- `npm audit --json`: **zero reported vulnerabilities** in installed Node dependencies. No dependency upgrades/purchases were required.
- Compiled local production server, explicitly disabled delivery: **16 general API/SEO/header/image checks passed**, plus **33 audio asset/cache/range checks passed**.
- Privacy scan: **129 files, zero matching findings**; embedded MP3 tags checked and generated social/icon PNGs viewed.

Six scenes, five transitions, responsive layout, portfolio, automation, Kokoro audio/player, bloom/morph caches and performance architecture were not changed. Existing math/resource/voice regression tests still pass. No new browser/visual/GPU/audio-listening results are claimed, and no live delivery/domain/host test was performed.

## Files modified

- `src/lib/contact.ts`: fixed agency contact.
- `src/lib/inquiry.ts`: removed obsolete configurable-contact validation.
- `src/lib/inquiry-delivery.ts`: fixed provider recipient and matching verified-sender-domain setup gate.
- `src/lib/inquiry-server.ts`: bounded/cancelled stalled request-body reads.
- `.env.example`: server-only setup field and removed active public contact override.
- `tests/contact-privacy.test.mjs`: five regressions.
- `tests/inquiry-delivery.test.mjs`: existing fully configured mock includes the new acknowledgement.
- `tests/project.test.mjs`: verifies contact has no deployment-variable override.
- `scripts/contact-privacy-audit.mjs`: repeatable source/asset/build audit.
- `PRODUCTION_SETUP.md`, `DEPLOYMENT_CHECKLIST.md`, `README.md`: current setup/contact guidance.
- `CONTACT_PRIVACY_REPORT.md`: this report.
- `performance/contact-privacy-*`: audit, compiled checks and inspected image evidence. Existing audio HTTP runner also refreshes its latest Phase 6 audio-check evidence; the report is copied under this update's label.

No personal development records were deleted. No Git repository exists in this directory; there was no commit, deployment, DNS change, subscription purchase, provider activation or real email. Remaining enablement blockers are owned/verified sender, credentials, hosted durable abuse controls, hosting verification and separate owner authorization.
