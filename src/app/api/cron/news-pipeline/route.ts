import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CATEGORIES } from "@/lib/constants";
import { fetchNorwegianNews, type NewsArticle } from "@/lib/norwegian-feeds";

const CATEGORY_VALUES = CATEGORIES.map((c) => c.value);

// Vercel cron jobs call this endpoint
// Set up in vercel.json: { "crons": [{ "path": "/api/cron/news-pipeline", "schedule": "0 8 * * *" }] }

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    // Fetch from Norwegian RSS feeds
    let articles: NewsArticle[] = await fetchNorwegianNews();
    const source = "norwegian";

    // Filter valid articles
    articles = articles.filter(
      (a) => a.title && a.title.length >= 10 && a.description
    );

    if (articles.length === 0) {
      await prisma.pipelineRun.create({
        data: {
          source,
          articlesFound: 0,
          suggested: 0,
          errors: "No articles found from Norwegian feeds",
          duration: Date.now() - startTime,
        },
      });
      return NextResponse.json({ success: false, error: "No articles found" });
    }

    // Try AI generation if keys available
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    let suggestions: { title: string; description: string; category: string; closesAt: string; reasoning: string }[] = [];

    if (anthropicKey || openaiKey) {
      const headlines = articles
        .map((a, i) => `${i + 1}. [${a.source.name}] ${a.title}\n   ${a.description ?? ""}`)
        .join("\n");

      const prompt = `You are a prediction market analyst specializing in Norwegian and Nordic affairs.

The following headlines are from major Norwegian news outlets (NRK, VG, E24, Dagbladet, Aftenposten, DN). They are in Norwegian.

NEWS HEADLINES:
${headlines}

Suggest 3-6 prediction market questions in ENGLISH based on these Norwegian news stories.

Respond with a JSON array. Each object: { "title": "Will X happen by Y?", "description": "Resolution criteria...", "category": one of ${CATEGORY_VALUES.join(", ")}, "closesAt": "ISO date", "reasoning": "Why interesting" }

Context: Norwegian politics (Storting, Ap/Høyre/FrP/SV/Sp), economy (oil fund, Norges Bank rates, NOK, oil/gas), sports (Eliteserien, skiing, biathlon, Magnus Carlsen), culture (NRK, Eurovision).

Rules: Clear YES/NO questions in English, genuine uncertainty, verifiable outcomes, reasonable timeframes, Norway-focused. ONLY JSON array.`;

      try {
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
          if (res.ok) {
            const data = await res.json();
            const text = data.content?.[0]?.text ?? "";
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) suggestions = JSON.parse(jsonMatch[0]);
          }
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
          if (res.ok) {
            const data = await res.json();
            const text = data.choices?.[0]?.message?.content ?? "";
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) suggestions = JSON.parse(jsonMatch[0]);
          }
        }
      } catch (err) {
        console.error("AI generation failed in cron:", err);
      }
    }

    // Store suggestions
    let storedCount = 0;
    for (const s of suggestions) {
      const category = (CATEGORY_VALUES as readonly string[]).includes(s.category) ? s.category : "ECONOMICS";
      const matchingArticle = articles.find((a) =>
        s.title.toLowerCase().includes(a.title.toLowerCase().slice(0, 15))
      );

      await prisma.suggestedMarket.create({
        data: {
          title: s.title,
          description: s.description,
          category,
          closesAt: new Date(s.closesAt),
          sourceHeadline: matchingArticle?.title ?? articles[0]!.title,
          sourceUrl: matchingArticle?.url ?? articles[0]!.url,
          sourceName: matchingArticle?.source.name ?? articles[0]!.source.name,
          imageUrl: matchingArticle?.urlToImage ?? null,
          aiReasoning: s.reasoning,
          status: "PENDING",
        },
      });
      storedCount++;
    }

    await prisma.pipelineRun.create({
      data: {
        source,
        articlesFound: articles.length,
        suggested: storedCount,
        duration: Date.now() - startTime,
      },
    });

    return NextResponse.json({
      success: true,
      articlesFound: articles.length,
      suggested: storedCount,
      duration: Date.now() - startTime,
    });
  } catch (err) {
    await prisma.pipelineRun.create({
      data: {
        source: "cron",
        articlesFound: 0,
        suggested: 0,
        errors: err instanceof Error ? err.message : "Unknown error",
        duration: Date.now() - startTime,
      },
    });

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Pipeline failed" },
      { status: 500 }
    );
  }
}
