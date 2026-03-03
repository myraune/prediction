import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

export default async function AdminBlogPage() {
  let posts: Awaited<ReturnType<typeof prisma.blogPost.findMany>> = [];
  try {
    posts = await prisma.blogPost.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch {
    // DB unavailable
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Blog Posts</h1>
          <p className="text-muted-foreground mt-1">
            {posts.length} post{posts.length !== 1 && "s"}
          </p>
        </div>
        <Link href="/admin/blog/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Post
          </Button>
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">No blog posts yet.</p>
          <Link href="/admin/blog/new">
            <Button className="mt-4">Create your first post</Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border bg-card divide-y">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/admin/blog/${post.id}`}
              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">
                    {post.title}
                  </span>
                  <Badge
                    variant={post.published ? "default" : "secondary"}
                    className="shrink-0"
                  >
                    {post.published ? "Published" : "Draft"}
                  </Badge>
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {post.category}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  /blog/{post.slug}
                  {post.metaTitleNo && (
                    <span className="ml-2 text-[var(--color-viking)]">
                      🇳🇴 NO meta
                    </span>
                  )}
                </p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0 ml-4">
                {post.createdAt.toLocaleDateString("nb-NO")}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
