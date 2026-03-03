import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getPrice } from "@/lib/amm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MarkdownBody } from "@/components/blog/markdown-body";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

const categoryLabels: Record<string, string> = {
  ANALYSIS: "Analysis",
  NEWS: "News",
  GUIDE: "Guide",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    select: {
      title: true,
      excerpt: true,
      metaTitleNo: true,
      metaDescNo: true,
    },
  });

  if (!post) return { title: "Post Not Found" };

  // Use Norwegian meta if available, otherwise English
  const title = post.metaTitleNo || post.title;
  const description = post.metaDescNo || post.excerpt;

  return {
    title: post.title, // Browser tab stays English
    description,
    alternates: {
      languages: {
        "nb-NO": `https://viking-market.com/blog/${slug}`,
        "x-default": `https://viking-market.com/blog/${slug}`,
      },
    },
    openGraph: {
      title, // Norwegian title in social shares / Google snippets
      description,
      type: "article",
      locale: "nb_NO",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    other: {
      // Additional Norwegian meta for search engines
      ...(post.metaTitleNo && { "og:locale:alternate": "en_US" }),
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const post = await prisma.blogPost.findUnique({
    where: { slug },
  });

  if (!post || !post.published) notFound();

  // Fetch linked market if available
  let linkedMarket: {
    id: string;
    title: string;
    poolYes: number;
    poolNo: number;
  } | null = null;
  if (post.linkedMarketId) {
    try {
      linkedMarket = await prisma.market.findUnique({
        where: { id: post.linkedMarketId },
        select: { id: true, title: true, poolYes: true, poolNo: true },
      });
    } catch {
      // non-critical
    }
  }

  const linkedPrice = linkedMarket
    ? getPrice({
        poolYes: linkedMarket.poolYes,
        poolNo: linkedMarket.poolNo,
      })
    : null;

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://viking-market.com" },
          { name: "Blog", url: "https://viking-market.com/blog" },
          {
            name: post.title,
            url: `https://viking-market.com/blog/${post.slug}`,
          },
        ]}
      />

      {/* Norwegian-language JSON-LD for search engines (not visible on page) */}
      {post.metaTitleNo && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: post.metaTitleNo,
              description: post.metaDescNo || post.excerpt,
              url: `https://viking-market.com/blog/${post.slug}`,
              inLanguage: "nb",
              datePublished: post.publishedAt?.toISOString(),
              dateModified: post.updatedAt.toISOString(),
              author: {
                "@type": "Organization",
                name: "Viking Market",
              },
              publisher: {
                "@type": "Organization",
                name: "Viking Market",
                logo: {
                  "@type": "ImageObject",
                  url: "https://viking-market.com/icon-3.svg",
                },
              },
            }),
          }}
        />
      )}

      <div className="max-w-3xl mx-auto py-8 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Link
              href="/blog"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              &larr; Blog
            </Link>
            <span className="text-xs text-muted-foreground">/</span>
            <Badge variant="outline" className="text-xs">
              {categoryLabels[post.category] ?? post.category}
            </Badge>
            {post.publishedAt && (
              <span className="text-xs text-muted-foreground">
                {post.publishedAt.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{post.title}</h1>
          <p className="text-muted-foreground mt-2">{post.excerpt}</p>
        </div>

        {/* Linked Market Card */}
        {linkedMarket && linkedPrice && (
          <Link
            href={`/markets/${linkedMarket.id}`}
            className="block rounded-xl border border-[var(--color-viking)]/20 bg-[var(--color-viking)]/5 p-4 hover:border-[var(--color-viking)]/40 transition-colors"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              Related Market
            </p>
            <p className="font-medium text-sm">{linkedMarket.title}</p>
            <div className="flex items-center gap-4 mt-2 text-sm">
              <span>
                <span className="font-semibold text-[var(--color-yes)]">
                  YES {Math.round(linkedPrice.yes * 100)}¢
                </span>
              </span>
              <span>
                <span className="font-semibold text-[var(--color-no)]">
                  NO {Math.round(linkedPrice.no * 100)}¢
                </span>
              </span>
              <span className="text-xs text-[var(--color-viking)] font-medium ml-auto">
                Trade this market &rarr;
              </span>
            </div>
          </Link>
        )}

        {/* Article Body */}
        <article className="rounded-xl border bg-card p-6">
          <MarkdownBody content={post.content} />
        </article>

        {/* Bottom CTA */}
        <div className="rounded-xl border border-[var(--color-viking)]/30 bg-[var(--color-viking)]/5 p-6 text-center space-y-3">
          <h2 className="text-lg font-semibold">
            Think you know the outcome?
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Join Viking Market and trade on real-world events. Put your
            predictions to the test.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/waitlist">
              <Button className="bg-[var(--color-viking)] hover:bg-[var(--color-viking)]/90 text-white">
                Join Waitlist
              </Button>
            </Link>
            <Link href="/markets">
              <Button variant="outline">Browse Markets</Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
