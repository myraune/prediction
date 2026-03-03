import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/portfolio", "/profile"],
      },
    ],
    sitemap: "https://viking-market.com/sitemap.xml",
  };
}
