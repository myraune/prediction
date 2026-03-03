"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[æ]/g, "ae")
    .replace(/[ø]/g, "o")
    .replace(/[å]/g, "a")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createBlogPost(data: {
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  metaTitleNo?: string;
  metaDescNo?: string;
  category?: string;
  linkedMarketId?: string;
  published?: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  // Check admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") return { error: "Unauthorized" };

  const slug = data.slug || slugify(data.title);

  // Check slug uniqueness
  const existing = await prisma.blogPost.findUnique({ where: { slug } });
  if (existing) return { error: "A post with this slug already exists" };

  try {
    const post = await prisma.blogPost.create({
      data: {
        slug,
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        metaTitleNo: data.metaTitleNo || null,
        metaDescNo: data.metaDescNo || null,
        category: data.category || "ANALYSIS",
        linkedMarketId: data.linkedMarketId || null,
        published: data.published ?? false,
        publishedAt: data.published ? new Date() : null,
      },
    });
    return { success: true, id: post.id, slug: post.slug };
  } catch {
    return { error: "Failed to create post" };
  }
}

export async function updateBlogPost(
  id: string,
  data: {
    title?: string;
    slug?: string;
    excerpt?: string;
    content?: string;
    metaTitleNo?: string;
    metaDescNo?: string;
    category?: string;
    linkedMarketId?: string;
    published?: boolean;
  }
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") return { error: "Unauthorized" };

  try {
    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) return { error: "Post not found" };

    // If publishing for the first time, set publishedAt
    const isNewlyPublished = data.published && !existing.published;

    await prisma.blogPost.update({
      where: { id },
      data: {
        ...data,
        metaTitleNo: data.metaTitleNo ?? undefined,
        metaDescNo: data.metaDescNo ?? undefined,
        linkedMarketId: data.linkedMarketId ?? undefined,
        publishedAt: isNewlyPublished ? new Date() : undefined,
      },
    });
    return { success: true };
  } catch {
    return { error: "Failed to update post" };
  }
}

/**
 * Generate a blog draft from a market — AI-powered if API key available, template otherwise.
 * Creates an unpublished draft linked to the market.
 */
export async function generateBlogDraft(marketId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") return { error: "Unauthorized" };

  const market = await prisma.market.findUnique({ where: { id: marketId } });
  if (!market) return { error: "Market not found" };

  // Check for existing draft
  const existingDraft = await prisma.blogPost.findFirst({
    where: { linkedMarketId: marketId },
  });
  if (existingDraft) {
    return { error: "A blog post already exists for this market", existingId: existingDraft.id };
  }

  const slug = slugify(market.title);
  let title = market.title;
  let excerpt = market.description.slice(0, 160);
  let content = "";
  let metaTitleNo = "";
  let metaDescNo = "";

  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (anthropicKey) {
    try {
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
          messages: [{
            role: "user",
            content: `You are a blog writer for Viking Market, a Norwegian prediction market. Write a blog post about this market:

Title: ${market.title}
Description: ${market.description}
Category: ${market.category}
Closes: ${market.closesAt.toISOString()}

Requirements:
1. Write an engaging English blog post (300-500 words) in markdown format
2. Include background context, key arguments for YES and NO, and what to watch for
3. Reference the prediction market at the end
4. Keep the tone analytical but accessible

Also generate:
- A Norwegian SEO title (under 60 chars, include "Viking Market" at the end after a dash)
- A Norwegian SEO meta description (under 155 chars)
- A short English excerpt (under 160 chars)

Respond as JSON:
{
  "title": "English blog title (can be different from market title)",
  "excerpt": "Short English excerpt...",
  "content": "## Markdown content here...",
  "metaTitleNo": "Norsk SEO-tittel — Viking Market",
  "metaDescNo": "Norsk meta-beskrivelse for Google-resultater..."
}

Respond with ONLY the JSON, no other text.`,
          }],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.content?.[0]?.text ?? "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          title = parsed.title || title;
          excerpt = parsed.excerpt || excerpt;
          content = parsed.content || "";
          metaTitleNo = parsed.metaTitleNo || "";
          metaDescNo = parsed.metaDescNo || "";
        }
      }
    } catch {
      // Fall through to template
    }
  }

  // Template fallback if AI didn't produce content
  if (!content) {
    content = `## ${market.title}\n\n${market.description}\n\n### Background\n\n*Add context about this topic here...*\n\n### Arguments for YES\n\n- Point 1\n- Point 2\n\n### Arguments for NO\n\n- Point 1\n- Point 2\n\n### What to Watch\n\n*Key dates or events that could move this market...*\n\n---\n\nTrade on this market at Viking Market. Buy YES or NO shares and put your prediction to the test.`;
  }

  try {
    // Ensure slug is unique
    let finalSlug = slug;
    const existing = await prisma.blogPost.findUnique({ where: { slug: finalSlug } });
    if (existing) {
      finalSlug = `${slug}-${Date.now().toString(36)}`;
    }

    const post = await prisma.blogPost.create({
      data: {
        slug: finalSlug,
        title,
        excerpt,
        content,
        metaTitleNo: metaTitleNo || null,
        metaDescNo: metaDescNo || null,
        category: "ANALYSIS",
        linkedMarketId: marketId,
        published: false,
      },
    });
    return { success: true, id: post.id, slug: post.slug };
  } catch {
    return { error: "Failed to create blog draft" };
  }
}

export async function deleteBlogPost(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") return { error: "Unauthorized" };

  try {
    await prisma.blogPost.delete({ where: { id } });
    return { success: true };
  } catch {
    return { error: "Failed to delete post" };
  }
}
