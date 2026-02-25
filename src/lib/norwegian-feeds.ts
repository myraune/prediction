import { XMLParser } from "fast-xml-parser";

// ─── Types ──────────────────────────────────────────────

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: { name: string };
  publishedAt: string;
  urlToImage?: string;
}

// ─── Feed Configuration ─────────────────────────────────

interface FeedConfig {
  url: string;
  name: string;
  /** Category hint for fallback when AI is unavailable */
  category?: string;
}

const NORWEGIAN_FEEDS: FeedConfig[] = [
  // General / breaking news
  { url: "https://www.nrk.no/toppsaker.rss", name: "NRK" },
  { url: "https://www.vg.no/rss/feed", name: "VG" },
  { url: "https://www.dagbladet.no/index?lab_viewport=rss", name: "Dagbladet" },
  { url: "https://www.aftenposten.no/rss", name: "Aftenposten" },
  // Business / finance
  { url: "https://e24.no/rss", name: "E24", category: "FINANCIALS" },
  { url: "https://services.dn.no/api/feed/rss/", name: "Dagens Næringsliv", category: "ECONOMICS" },
  // Sports
  { url: "https://www.nrk.no/sport/toppsaker.rss", name: "NRK Sport", category: "SPORTS" },
  // International (Norwegian perspective)
  { url: "https://www.nrk.no/urix/toppsaker.rss", name: "NRK Urix" },
];

// ─── RSS Parser ─────────────────────────────────────────

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "").replace(/&[^;]+;/g, " ").trim();
}

function extractArticles(xml: string, feedConfig: FeedConfig): NewsArticle[] {
  try {
    const parsed = parser.parse(xml);
    const channel = parsed?.rss?.channel;
    if (!channel) return [];

    const items = Array.isArray(channel.item) ? channel.item : channel.item ? [channel.item] : [];

    return items
      .map((item: Record<string, unknown>) => {
        const title = typeof item.title === "string" ? item.title.trim() : "";
        const description = typeof item.description === "string" ? stripHtml(item.description) : "";
        const link = typeof item.link === "string" ? item.link : "";
        const pubDate = typeof item.pubDate === "string" ? item.pubDate : "";

        // Try to extract image from various RSS extensions
        let imageUrl: string | undefined;
        const enclosure = item.enclosure as Record<string, string> | undefined;
        if (enclosure?.["@_url"]) {
          imageUrl = enclosure["@_url"];
        }
        const mediaContent = item["media:content"] as Record<string, string> | undefined;
        if (!imageUrl && mediaContent?.["@_url"]) {
          imageUrl = mediaContent["@_url"];
        }

        if (!title || title.length < 10) return null;

        return {
          title,
          description: description.slice(0, 300),
          url: link,
          source: { name: feedConfig.name },
          publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          urlToImage: imageUrl,
        } satisfies NewsArticle;
      })
      .filter((a: NewsArticle | null): a is NewsArticle => a !== null);
  } catch {
    return [];
  }
}

// ─── Deduplication ──────────────────────────────────────

function normalizeForDedup(title: string): string {
  return title.toLowerCase().replace(/[^a-zæøå0-9]/g, "").slice(0, 40);
}

function deduplicateArticles(articles: NewsArticle[]): NewsArticle[] {
  const seen = new Set<string>();
  return articles.filter((a) => {
    const key = normalizeForDedup(a.title);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Public API ─────────────────────────────────────────

export async function fetchNorwegianNews(): Promise<NewsArticle[]> {
  const results = await Promise.allSettled(
    NORWEGIAN_FEEDS.map(async (feed) => {
      const res = await fetch(feed.url, {
        next: { revalidate: 0 },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return [];
      const xml = await res.text();
      return extractArticles(xml, feed);
    })
  );

  const allArticles: NewsArticle[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      allArticles.push(...result.value);
    }
  }

  // Sort by publication date (newest first), deduplicate, limit
  const sorted = allArticles.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return deduplicateArticles(sorted).slice(0, 20);
}

/** Returns the list of configured feeds (for admin UI display) */
export function getNorwegianFeedList() {
  return NORWEGIAN_FEEDS.map((f) => ({ name: f.name, url: f.url }));
}
