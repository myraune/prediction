"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { CATEGORIES, INITIAL_POOL_SIZE } from "@/lib/constants";

// ─── Types ──────────────────────────────────────────────

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: { name: string };
  publishedAt: string;
  urlToImage?: string;
}

interface MarketSuggestion {
  title: string;
  description: string;
  category: string;
  closesAt: string;
  reasoning: string;
}

// ─── News Fetching ──────────────────────────────────────

async function fetchFromNewsAPI(query: string): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(
      `https://newsapi.org/v2/top-headlines?` +
        new URLSearchParams({
          q: query,
          language: "en",
          pageSize: "10",
          apiKey,
        }),
      { next: { revalidate: 0 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.articles ?? [];
  } catch {
    return [];
  }
}

async function fetchFromGNews(query: string): Promise<NewsArticle[]> {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(
      `https://gnews.io/api/v4/top-headlines?` +
        new URLSearchParams({
          q: query,
          lang: "en",
          max: "10",
          token: apiKey,
        }),
      { next: { revalidate: 0 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.articles ?? []).map(
      (a: { title: string; description: string; url: string; source: { name: string }; publishedAt: string; image?: string }) => ({
        title: a.title,
        description: a.description,
        url: a.url,
        source: a.source,
        publishedAt: a.publishedAt,
        urlToImage: a.image,
      })
    );
  } catch {
    return [];
  }
}

// ─── AI Market Generation ───────────────────────────────

const CATEGORY_VALUES = CATEGORIES.map((c) => c.value);

function buildPrompt(articles: NewsArticle[]): string {
  const headlines = articles
    .map((a, i) => `${i + 1}. [${a.source.name}] ${a.title}\n   ${a.description ?? ""}`)
    .join("\n");

  return `You are a prediction market analyst. Based on these news headlines, suggest prediction market questions that would be interesting for traders to bet on.

NEWS HEADLINES:
${headlines}

For each viable market, respond with a JSON array of objects. Each object should have:
- "title": A clear YES/NO question (e.g., "Will X happen by Y date?")
- "description": 2-3 sentence resolution criteria explaining exactly when this resolves YES or NO
- "category": One of: ${CATEGORY_VALUES.join(", ")}
- "closesAt": ISO date string for when the market should close (use reasonable timeframes: days to months)
- "reasoning": Why this is an interesting prediction market (1 sentence)
- "sourceIndex": The article number (1-indexed) this is based on

Rules:
- Only suggest markets for events with genuine uncertainty
- Avoid duplicate or very similar questions
- Make titles concise but unambiguous
- Set closing dates that make sense for the event timeline
- Suggest 2-5 markets maximum
- Focus on events that will have a clear, verifiable outcome

Respond with ONLY the JSON array, no other text.`;
}

async function generateSuggestionsWithAI(articles: NewsArticle[]): Promise<{ suggestions: MarketSuggestion[]; articleMap: Map<number, NewsArticle> }> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const articleMap = new Map<number, NewsArticle>();
  articles.forEach((a, i) => articleMap.set(i + 1, a));

  if (!anthropicKey && !openaiKey) {
    // Fallback: generate basic suggestions from headlines without AI
    return { suggestions: generateFallbackSuggestions(articles), articleMap };
  }

  const prompt = buildPrompt(articles);

  try {
    let responseText = "";

    if (anthropicKey) {
      // Claude API
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2048,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
      const data = await res.json();
      responseText = data.content?.[0]?.text ?? "";
    } else if (openaiKey) {
      // OpenAI API
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          max_tokens: 2048,
          messages: [
            { role: "system", content: "You are a prediction market analyst. Respond only with valid JSON." },
            { role: "user", content: prompt },
          ],
        }),
      });
      if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
      const data = await res.json();
      responseText = data.choices?.[0]?.message?.content ?? "";
    }

    // Parse AI response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return { suggestions: generateFallbackSuggestions(articles), articleMap };

    const parsed = JSON.parse(jsonMatch[0]) as (MarketSuggestion & { sourceIndex?: number })[];
    return {
      suggestions: parsed.map((s) => ({
        title: s.title,
        description: s.description,
        category: (CATEGORY_VALUES as readonly string[]).includes(s.category) ? s.category : "ECONOMICS",
        closesAt: s.closesAt,
        reasoning: s.reasoning,
      })),
      articleMap,
    };
  } catch (err) {
    console.error("AI suggestion error:", err);
    return { suggestions: generateFallbackSuggestions(articles), articleMap };
  }
}

function generateFallbackSuggestions(articles: NewsArticle[]): MarketSuggestion[] {
  // Simple rule-based fallback when no AI API keys are available
  const suggestions: MarketSuggestion[] = [];
  const now = new Date();

  for (const article of articles.slice(0, 5)) {
    if (!article.title || article.title.length < 15) continue;

    // Guess category from keywords
    const titleLower = article.title.toLowerCase();
    let category = "ECONOMICS";
    if (/trump|biden|election|congress|parliament|vote|president|political/.test(titleLower)) category = "POLITICS";
    else if (/bitcoin|crypto|ethereum|solana|defi|nft/.test(titleLower)) category = "CRYPTO";
    else if (/ai|tech|google|apple|microsoft|nvidia|openai|spacex|robot/.test(titleLower)) category = "TECH_SCIENCE";
    else if (/sport|football|soccer|nba|tennis|champion|league|olympic/.test(titleLower)) category = "SPORTS";
    else if (/climate|temperature|carbon|warming|green|emission/.test(titleLower)) category = "CLIMATE";
    else if (/netflix|movie|music|celebrity|award|oscar|grammy/.test(titleLower)) category = "ENTERTAINMENT";
    else if (/stock|s&p|dow|market|fed|rate|inflation|gdp/.test(titleLower)) category = "FINANCIALS";
    else if (/tesla|amazon|meta|company|ceo|merger|acquisition/.test(titleLower)) category = "COMPANIES";

    // Set closing date 30 days from now
    const closesAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    suggestions.push({
      title: `Will "${article.title.slice(0, 80)}" come true by ${closesAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}?`,
      description: `Based on the news headline: "${article.title}". This market resolves YES if the event described comes to pass by the closing date. Source: ${article.source.name}.`,
      category,
      closesAt: closesAt.toISOString(),
      reasoning: `Generated from trending news headline by ${article.source.name}.`,
    });
  }

  return suggestions;
}

// ─── Server Actions ─────────────────────────────────────

export async function runNewsPipeline(options?: { query?: string; source?: string }) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") return { error: "Not authorized" };

  const startTime = Date.now();
  const query = options?.query || "world news";
  const source = options?.source || "newsapi";
  let articlesFound = 0;
  let suggestedCount = 0;
  let errorMsg: string | undefined;

  try {
    // Step 1: Fetch news
    let articles: NewsArticle[] = [];
    if (source === "gnews") {
      articles = await fetchFromGNews(query);
    } else {
      articles = await fetchFromNewsAPI(query);
    }

    // Filter out articles with [Removed] title (NewsAPI paywall)
    articles = articles.filter(
      (a) => a.title && a.title !== "[Removed]" && a.description
    );
    articlesFound = articles.length;

    if (articles.length === 0) {
      errorMsg = "No articles found. Check API keys in environment variables.";

      // If no API keys at all, generate demo suggestions
      const hasApiKeys = !!(process.env.NEWS_API_KEY || process.env.GNEWS_API_KEY);
      if (!hasApiKeys) {
        // Generate demo data from curated headlines
        const demoArticles = getDemoArticles();
        articles = demoArticles;
        articlesFound = demoArticles.length;
        errorMsg = "Using demo data (no NEWS_API_KEY or GNEWS_API_KEY configured)";
      }
    }

    if (articles.length === 0) {
      await prisma.pipelineRun.create({
        data: { source, articlesFound: 0, suggested: 0, errors: errorMsg, duration: Date.now() - startTime },
      });
      return { error: errorMsg, articlesFound: 0, suggested: 0 };
    }

    // Step 2: Generate market suggestions
    const { suggestions } = await generateSuggestionsWithAI(articles);
    suggestedCount = suggestions.length;

    // Step 3: Store suggestions for admin review
    for (const suggestion of suggestions) {
      // Find the article that inspired this suggestion
      const matchingArticle = articles.find(
        (a) => suggestion.reasoning?.includes(a.source.name) || suggestion.title.toLowerCase().includes(a.title.toLowerCase().slice(0, 20))
      );

      await prisma.suggestedMarket.create({
        data: {
          title: suggestion.title,
          description: suggestion.description,
          category: suggestion.category,
          closesAt: new Date(suggestion.closesAt),
          sourceHeadline: matchingArticle?.title ?? articles[0]!.title,
          sourceUrl: matchingArticle?.url ?? articles[0]!.url,
          sourceName: matchingArticle?.source.name ?? articles[0]!.source.name,
          imageUrl: matchingArticle?.urlToImage ?? null,
          aiReasoning: suggestion.reasoning,
          status: "PENDING",
        },
      });
    }

    // Step 4: Log the pipeline run
    await prisma.pipelineRun.create({
      data: {
        source,
        articlesFound,
        suggested: suggestedCount,
        errors: errorMsg,
        duration: Date.now() - startTime,
      },
    });

    revalidatePath("/admin/news-pipeline");
    return { success: true, articlesFound, suggested: suggestedCount, error: errorMsg };
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : "Pipeline failed";
    await prisma.pipelineRun.create({
      data: {
        source,
        articlesFound,
        suggested: suggestedCount,
        errors: errMessage,
        duration: Date.now() - startTime,
      },
    });
    return { error: errMessage, articlesFound, suggested: suggestedCount };
  }
}

export async function reviewSuggestion(id: string, action: "approve" | "reject") {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") return { error: "Not authorized" };

  const suggestion = await prisma.suggestedMarket.findUnique({ where: { id } });
  if (!suggestion) return { error: "Suggestion not found" };
  if (suggestion.status !== "PENDING") return { error: "Already reviewed" };

  if (action === "reject") {
    await prisma.suggestedMarket.update({
      where: { id },
      data: { status: "REJECTED", reviewedAt: new Date() },
    });
    revalidatePath("/admin/news-pipeline");
    return { success: true };
  }

  // Approve: create the actual market
  const market = await prisma.market.create({
    data: {
      title: suggestion.title,
      description: suggestion.description,
      category: suggestion.category,
      closesAt: suggestion.closesAt,
      imageUrl: suggestion.imageUrl,
      createdById: session.user.id,
      poolYes: INITIAL_POOL_SIZE,
      poolNo: INITIAL_POOL_SIZE,
    },
  });

  await prisma.suggestedMarket.update({
    where: { id },
    data: {
      status: "PUBLISHED",
      reviewedAt: new Date(),
      publishedMarketId: market.id,
    },
  });

  revalidatePath("/admin/news-pipeline");
  revalidatePath("/markets");
  revalidatePath("/admin/markets");
  return { success: true, marketId: market.id };
}

export async function editAndPublishSuggestion(
  id: string,
  edits: {
    title: string;
    description: string;
    category: string;
    closesAt: string;
    featured?: boolean;
  }
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") return { error: "Not authorized" };

  const suggestion = await prisma.suggestedMarket.findUnique({ where: { id } });
  if (!suggestion) return { error: "Suggestion not found" };

  // Create market with admin edits
  const market = await prisma.market.create({
    data: {
      title: edits.title,
      description: edits.description,
      category: edits.category,
      closesAt: new Date(edits.closesAt),
      featured: edits.featured ?? false,
      imageUrl: suggestion.imageUrl,
      createdById: session.user.id,
      poolYes: INITIAL_POOL_SIZE,
      poolNo: INITIAL_POOL_SIZE,
    },
  });

  await prisma.suggestedMarket.update({
    where: { id },
    data: {
      status: "PUBLISHED",
      reviewedAt: new Date(),
      publishedMarketId: market.id,
    },
  });

  revalidatePath("/admin/news-pipeline");
  revalidatePath("/markets");
  revalidatePath("/admin/markets");
  return { success: true, marketId: market.id };
}

export async function deleteSuggestion(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") return { error: "Not authorized" };

  await prisma.suggestedMarket.delete({ where: { id } });
  revalidatePath("/admin/news-pipeline");
  return { success: true };
}

export async function getPipelineStats() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [pending, approved, rejected, published, recentRuns] = await Promise.all([
    prisma.suggestedMarket.count({ where: { status: "PENDING" } }),
    prisma.suggestedMarket.count({ where: { status: "APPROVED" } }),
    prisma.suggestedMarket.count({ where: { status: "REJECTED" } }),
    prisma.suggestedMarket.count({ where: { status: "PUBLISHED" } }),
    prisma.pipelineRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return { pending, approved, rejected, published, recentRuns };
}

// ─── Demo Data ──────────────────────────────────────────

function getDemoArticles(): NewsArticle[] {
  return [
    {
      title: "Federal Reserve signals potential rate cut in September amid cooling inflation",
      description: "Fed Chair indicates growing confidence that inflation is moving sustainably toward 2% target, opening the door for the first rate cut since 2020.",
      url: "https://example.com/fed-rate",
      source: { name: "Financial Times" },
      publishedAt: new Date().toISOString(),
      urlToImage: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800",
    },
    {
      title: "SpaceX Starship completes sixth test flight with successful booster catch",
      description: "SpaceX's massive Starship rocket completed its sixth integrated test flight, with the Super Heavy booster successfully caught by the launch tower's mechanical arms.",
      url: "https://example.com/spacex",
      source: { name: "Space News" },
      publishedAt: new Date().toISOString(),
      urlToImage: "https://images.unsplash.com/photo-1541185933-55f6a4d20ac4?w=800",
    },
    {
      title: "Bitcoin surges past $100,000 as institutional adoption accelerates",
      description: "Bitcoin crossed the $100,000 mark for the first time as major banks launch crypto trading desks and ETF inflows reach record levels.",
      url: "https://example.com/btc",
      source: { name: "CoinDesk" },
      publishedAt: new Date().toISOString(),
      urlToImage: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800",
    },
    {
      title: "EU passes landmark AI regulation with strict enforcement timeline",
      description: "The European Union formally adopted the AI Act, setting a 2-year compliance deadline for general-purpose AI systems and establishing new oversight bodies.",
      url: "https://example.com/eu-ai",
      source: { name: "Reuters" },
      publishedAt: new Date().toISOString(),
      urlToImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800",
    },
    {
      title: "Global temperatures reach new record high for 12th consecutive month",
      description: "World Meteorological Organization confirms that global mean temperatures exceeded 1.5°C above pre-industrial levels for a full year, raising alarm about climate targets.",
      url: "https://example.com/climate",
      source: { name: "BBC News" },
      publishedAt: new Date().toISOString(),
      urlToImage: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800",
    },
    {
      title: "OpenAI announces GPT-5 release date and new reasoning capabilities",
      description: "OpenAI CEO revealed plans to launch GPT-5 with significantly improved reasoning, multimodal understanding, and real-time web access in the coming months.",
      url: "https://example.com/gpt5",
      source: { name: "The Verge" },
      publishedAt: new Date().toISOString(),
      urlToImage: "https://images.unsplash.com/photo-1655720828018-edd2daec9349?w=800",
    },
    {
      title: "Norwegian oil fund posts record returns amid global market rally",
      description: "Norway's sovereign wealth fund, the world's largest, reported its highest quarterly returns in over a decade driven by tech stocks and fixed income gains.",
      url: "https://example.com/nbim",
      source: { name: "NRK" },
      publishedAt: new Date().toISOString(),
      urlToImage: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800",
    },
    {
      title: "Champions League draw sets up blockbuster quarter-final matchups",
      description: "The UEFA Champions League draw produced thrilling quarter-final ties, with Real Madrid facing Manchester City and Barcelona drawn against Bayern Munich.",
      url: "https://example.com/ucl",
      source: { name: "ESPN" },
      publishedAt: new Date().toISOString(),
      urlToImage: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800",
    },
  ];
}
