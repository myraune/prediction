"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { CATEGORIES, INITIAL_POOL_SIZE } from "@/lib/constants";
import { fetchNorwegianNews, type NewsArticle } from "@/lib/norwegian-feeds";

// ─── Types ──────────────────────────────────────────────

interface MarketSuggestion {
  title: string;
  description: string;
  category: string;
  closesAt: string;
  reasoning: string;
}

// ─── AI Market Generation ───────────────────────────────

const CATEGORY_VALUES = CATEGORIES.map((c) => c.value);

function buildPrompt(articles: NewsArticle[]): string {
  const headlines = articles
    .map((a, i) => `${i + 1}. [${a.source.name}] ${a.title}\n   ${a.description ?? ""}`)
    .join("\n");

  return `You are a prediction market analyst specializing in Norwegian and Nordic affairs.

The following news headlines are from major Norwegian outlets (NRK, VG, E24, Dagbladet, Aftenposten, DN). They are in Norwegian.

NEWS HEADLINES:
${headlines}

Based on these headlines, suggest prediction market questions that traders would find interesting. The markets should be written in ENGLISH but relate to Norwegian events, politics, economy, sports, and culture.

For each market, respond with a JSON array of objects:
- "title": A clear YES/NO question in English (e.g., "Will Norway's central bank raise interest rates before July 2026?")
- "description": 2-3 sentence resolution criteria in English explaining exactly when this resolves YES or NO
- "category": One of: ${CATEGORY_VALUES.join(", ")}
- "closesAt": ISO date string for when the market should close (use reasonable timeframes: days to months)
- "reasoning": Why this is an interesting prediction market (1 sentence, in English)
- "sourceIndex": The article number (1-indexed) this is based on

Context for better suggestions:
- Norwegian politics: Storting (parliament), current government coalition, key parties (Ap, Høyre, FrP, SV, Sp, MDG)
- Norwegian economy: Oil fund (NBIM/Oljefondet), Norges Bank interest rates, NOK/krone exchange rate, oil/gas sector, salmon exports
- Norwegian sports: Eliteserien (football), Tippeligaen, biathlon, cross-country skiing, handball, chess (Magnus Carlsen)
- Norwegian culture: NRK programming, Eurovision, book prizes, film

Rules:
- Only suggest markets for events with genuine uncertainty
- Avoid duplicate or very similar questions
- Make titles concise but unambiguous
- Set closing dates that make sense for the event timeline
- Suggest 3-6 markets maximum
- Focus on events that will have a clear, verifiable outcome
- Prefer Norway-specific angles over generic international stories

Respond with ONLY the JSON array, no other text.`;
}

async function generateSuggestionsWithAI(articles: NewsArticle[]): Promise<{ suggestions: MarketSuggestion[]; articleMap: Map<number, NewsArticle> }> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const articleMap = new Map<number, NewsArticle>();
  articles.forEach((a, i) => articleMap.set(i + 1, a));

  if (!anthropicKey && !openaiKey) {
    return { suggestions: generateFallbackSuggestions(articles), articleMap };
  }

  const prompt = buildPrompt(articles);

  try {
    let responseText = "";

    if (anthropicKey) {
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
            { role: "system", content: "You are a prediction market analyst specializing in Norwegian affairs. Respond only with valid JSON." },
            { role: "user", content: prompt },
          ],
        }),
      });
      if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
      const data = await res.json();
      responseText = data.choices?.[0]?.message?.content ?? "";
    }

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
  const suggestions: MarketSuggestion[] = [];
  const now = new Date();

  for (const article of articles.slice(0, 5)) {
    if (!article.title || article.title.length < 15) continue;

    const titleLower = article.title.toLowerCase();
    let category = "ECONOMICS";

    // Norwegian + English keyword matching
    if (/storting|regjering|valg|statsminister|parti|politikk|trump|biden|election|parliament|vote|president/.test(titleLower)) category = "POLITICS";
    else if (/bitcoin|crypto|ethereum|krypto|solana|defi|nft/.test(titleLower)) category = "CRYPTO";
    else if (/ai\b|tech|google|apple|microsoft|nvidia|openai|spacex|robot|teknologi|forskning/.test(titleLower)) category = "TECH_SCIENCE";
    else if (/fotball|håndball|ski|eliteserien|champions|sport|vm\b|em\b|olympi|carlsen|sjakk|biathlon/.test(titleLower)) category = "SPORTS";
    else if (/klima|utslipp|miljø|temperatur|climate|karbon|grønn/.test(titleLower)) category = "CLIMATE";
    else if (/film|serie|netflix|musikk|konsert|eurovision|spellemannprisen|tv\b|underholdning/.test(titleLower)) category = "ENTERTAINMENT";
    else if (/oljefond|oljeprisen|børs|krone|rente|inflasjon|norges bank|nbim|aksje|fond/.test(titleLower)) category = "FINANCIALS";
    else if (/equinor|telenor|dnb|yara|hydro|selskap|fusjon|oppkjøp|konsern/.test(titleLower)) category = "COMPANIES";
    else if (/kultur|bok|kunst|teater|museum|pris|utmerkelse/.test(titleLower)) category = "CULTURE";

    const closesAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    suggestions.push({
      title: `Will "${article.title.slice(0, 80)}" come true by ${closesAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}?`,
      description: `Based on the Norwegian news headline: "${article.title}". This market resolves YES if the event described comes to pass by the closing date. Source: ${article.source.name}.`,
      category,
      closesAt: closesAt.toISOString(),
      reasoning: `Generated from trending headline by ${article.source.name}.`,
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
  const source = options?.source || "norwegian";
  let articlesFound = 0;
  let suggestedCount = 0;
  let errorMsg: string | undefined;

  try {
    // Step 1: Fetch news
    let articles: NewsArticle[] = [];

    if (source === "norwegian") {
      articles = await fetchNorwegianNews();
    } else if (source === "gnews") {
      articles = await fetchFromGNews(options?.query || "Norway");
    } else {
      articles = await fetchFromNewsAPI(options?.query || "Norway");
    }

    articles = articles.filter(
      (a) => a.title && a.title !== "[Removed]" && a.description
    );
    articlesFound = articles.length;

    if (articles.length === 0) {
      errorMsg = "No articles found from Norwegian feeds.";

      // Fallback to demo data
      const demoArticles = getDemoArticles();
      articles = demoArticles;
      articlesFound = demoArticles.length;
      errorMsg = "Using demo data (Norwegian feeds returned no articles)";
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

// ─── Legacy API Fetchers (kept as fallback) ─────────────

async function fetchFromNewsAPI(query: string): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch(
      `https://newsapi.org/v2/top-headlines?` +
        new URLSearchParams({ q: query, language: "en", pageSize: "10", apiKey }),
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
        new URLSearchParams({ q: query, lang: "en", max: "10", token: apiKey }),
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

// ─── Demo Data (Norwegian headlines) ────────────────────

function getDemoArticles(): NewsArticle[] {
  return [
    {
      title: "Norges Bank holder renten uendret på 4,5 prosent",
      description: "Sentralbanken velger å holde styringsrenten uendret, men signaliserer mulig kutt senere i år dersom inflasjonen fortsetter å falle.",
      url: "https://e24.no/norges-bank-rente",
      source: { name: "E24" },
      publishedAt: new Date().toISOString(),
    },
    {
      title: "Oljefondet passerer 20 000 milliarder kroner",
      description: "Statens pensjonsfond utland satte ny rekord etter sterke aksjemarkeder og svakere krone.",
      url: "https://nrk.no/oljefondet-rekord",
      source: { name: "NRK" },
      publishedAt: new Date().toISOString(),
    },
    {
      title: "Bodø/Glimt videre i Champions League etter dramatisk kamp",
      description: "Bodø/Glimt slo det tyske laget 3-2 sammenlagt og går videre til åttedelsfinalen i Champions League.",
      url: "https://vg.no/glimt-cl",
      source: { name: "VG" },
      publishedAt: new Date().toISOString(),
    },
    {
      title: "Regjeringen foreslår nye klimatiltak for oljeindustrien",
      description: "Statsminister Jonas Gahr Støre presenterte en plan for å kutte utslipp fra olje- og gasssektoren med 40 prosent innen 2030.",
      url: "https://nrk.no/klima-olje",
      source: { name: "NRK" },
      publishedAt: new Date().toISOString(),
    },
    {
      title: "Equinor melder om rekordhøy fornybar-produksjon",
      description: "Equinor rapporterer at fornybar energi nå utgjør 15 prosent av selskapets totale energiproduksjon, opp fra 9 prosent i fjor.",
      url: "https://dn.no/equinor-fornybar",
      source: { name: "Dagens Næringsliv" },
      publishedAt: new Date().toISOString(),
    },
    {
      title: "Høyre tar ledelsen på ny meningsmåling",
      description: "Erna Solbergs parti ligger nå 5 prosentpoeng foran Arbeiderpartiet i den siste meningsmålingen fra Kantar.",
      url: "https://dagbladet.no/hoyre-maling",
      source: { name: "Dagbladet" },
      publishedAt: new Date().toISOString(),
    },
    {
      title: "Magnus Carlsen trekker seg fra VM-kamp igjen",
      description: "Verdens beste sjakkspiller bekreftet at han ikke vil forsvare VM-tittelen, og peker i stedet på nye turneringsformater.",
      url: "https://vg.no/carlsen-vm",
      source: { name: "VG" },
      publishedAt: new Date().toISOString(),
    },
    {
      title: "Strømprisene i Sør-Norge tredoblet på én uke",
      description: "Tørt og kaldt vær kombinert med lite vind har sendt strømprisene til over 3 kroner per kilowattime i sørlige deler av landet.",
      url: "https://e24.no/strompris",
      source: { name: "E24" },
      publishedAt: new Date().toISOString(),
    },
  ];
}
