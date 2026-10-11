import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/site-config";
export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteOrigin();
  return origin ? ["/","/services"].map(path => ({url:`${origin}${path}`,changeFrequency:"monthly",priority:path === "/" ? 1 : .8})) : [];
}
