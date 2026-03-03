import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE = "https://viking-market.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE}/markets`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/waitlist`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/how-it-works`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/leaderboard`, lastModified: new Date(), changeFrequency: "daily", priority: 0.5 },
    { url: `${BASE}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
  ];

  // Dynamic market pages
  let marketPages: MetadataRoute.Sitemap = [];
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const [markets, blogPosts] = await Promise.all([
      prisma.market.findMany({
        where: { status: { in: ["OPEN", "RESOLVED"] } },
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.blogPost.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
        orderBy: { publishedAt: "desc" },
      }),
    ]);

    marketPages = markets.map((m) => ({
      url: `${BASE}/markets/${m.id}`,
      lastModified: m.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));

    blogPages = blogPosts.map((p) => ({
      url: `${BASE}/blog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // DB unavailable — return static pages only
  }

  return [...staticPages, ...marketPages, ...blogPages];
}
