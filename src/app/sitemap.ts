import type { MetadataRoute } from "next";
import { getPublicSiteOrigin } from "@/lib/site";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getPublicSiteOrigin();
  return [
    { url: `${origin}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${origin}/developer`, changeFrequency: "monthly", priority: 0.6 },
  ];
}
