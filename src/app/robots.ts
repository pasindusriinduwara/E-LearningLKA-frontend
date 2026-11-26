import type { MetadataRoute } from "next";
import { getPublicSiteOrigin } from "@/lib/site";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/dashboard",
        "/classes",
        "/schedule",
        "/materials",
        "/assessments",
        "/enrollment",
        "/settings",
        "/teacher",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
      ],
    },
    sitemap: `${getPublicSiteOrigin()}/sitemap.xml`,
  };
}
