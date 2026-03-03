import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Analysis, news, and guides about prediction markets and Norwegian current events on Viking Market.",
  alternates: {
    languages: {
      "nb-NO": "https://viking-market.com/blog",
      "x-default": "https://viking-market.com/blog",
    },
  },
  openGraph: {
    title: "Blog — Viking Market",
    description:
      "Analysis, news, and guides about prediction markets and Norwegian current events.",
  },
};

const categoryLabels: Record<string, string> = {
  ANALYSIS: "Analysis",
  NEWS: "News",
  GUIDE: "Guide",
};

export default async function BlogListingPage() {
  let posts: Awaited<ReturnType<typeof prisma.blogPost.findMany>> = [];
  try {
    posts = await prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
    });
  } catch {
    // DB unavailable
  }

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Blog</h1>
        <p className="text-muted-foreground mt-1">
          Analysis and insights on the events behind our prediction markets.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center space-y-3">
          <p className="text-muted-foreground">No posts published yet.</p>
          <p className="text-sm text-muted-foreground">
            Check back soon — we&apos;re writing about the stories behind our
            markets.
          </p>
          <Link href="/markets">
            <Button variant="outline" className="mt-2">
              Browse Markets
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="block rounded-xl border bg-card p-5 hover:border-[var(--color-viking)]/30 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  {categoryLabels[post.category] ?? post.category}
                </Badge>
                {post.publishedAt && (
                  <span className="text-xs text-muted-foreground">
                    {post.publishedAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>
              <h2 className="font-semibold">{post.title}</h2>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {post.excerpt}
              </p>
              <span className="text-xs text-[var(--color-viking)] font-medium mt-2 inline-block">
                Read more &rarr;
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* Bottom CTA */}
      <div className="rounded-xl border border-[var(--color-viking)]/30 bg-[var(--color-viking)]/5 p-6 text-center space-y-3">
        <h2 className="text-lg font-semibold">
          Trade on the events you read about
        </h2>
        <p className="text-sm text-muted-foreground">
          Every article links to a prediction market. Put your analysis to work.
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
  );
}
