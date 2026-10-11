# Codex handoff — Prototype 01 hardening

> Historical prototype instructions below. On October 11, 2026 the owner explicitly authorized replacing GitHub `main` with Phase 6 and acknowledged automatic Vercel deployment. This repository is now that replacement. Preserve `backup/pre-cinematic-nextjs-2026-10-11`. Current release configuration and acceptance limits are in REPLACEMENT_REPORT.md. No DNS changes, purchases or real email sending are authorized. The original local folder remains separate and unchanged.

You are working **only** in the standalone `veytronatech-3d` project. Do not modify the existing live VeytronaTech repo/site, DNS, hosting or outreach systems.

1. Inspect existing architecture before editing. Install dependencies using `npm install` and commit the resulting lockfile. Review `npm audit` and avoid unsafe force upgrades.
2. Run `npm run typecheck` and `npm run build`; fix actual errors without downgrading architecture or disabling TypeScript checks.
3. Launch the project locally and inspect it in the browser at desktop (~1440×900) and mobile (~390×844). Capture screenshots for all six stages. Verify every scene is rendered and navigable.
4. Confirm both forward/back scroll work with no scene re-mount. On desktop, 3D object should sit to the right of copy; on mobile, it should not obscure text. Check React strict mode.
5. Check accessibility including keyboard nav, readable contrast, reduced-motion mode, and WebGL-unavailable fallback.
6. Fix performance and console warnings, including any re-render or animation defects. Aim for sensible mobile GPU load; do not add expensive shaders or postprocessing until measured.
7. Report what works, what was fixed and actual test results. Keep Phase 2 visual enhancements as separate proposals. Do not deploy or use credentials without explicit permission.

**Next design milestone:** Custom branded chrome/ice-blue core mesh (Blender/GLB), smoother object-to-object transitions, improved typography, motion design directly inspired by the user-supplied 3D scroll reference, then production SEO and conversion optimization. Do not use copyrighted artwork from the reference.
