export function siteOrigin(value: string | undefined = process.env.SITE_URL) {
  if (!value) return undefined;
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password && url.pathname === "/" && !url.search && !url.hash ? url.origin : undefined; } catch { return undefined; }
}
export const SITE_DESCRIPTION = "VeytronaTech designs distinctive websites, interactive 3D experiences, AI automation and voice workflows with clear paths to human review.";
