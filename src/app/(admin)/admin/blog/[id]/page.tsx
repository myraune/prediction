"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateBlogPost, deleteBlogPost } from "@/actions/blog";
import { toast } from "sonner";

interface PostData {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  metaTitleNo: string | null;
  metaDescNo: string | null;
  category: string;
  linkedMarketId: string | null;
  published: boolean;
}

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/blog/${params.id}`)
      .then((r) => r.json())
      .then(setPost)
      .catch(() => toast.error("Failed to load post"));
  }, [params.id]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const result = await updateBlogPost(params.id as string, {
      title: fd.get("title") as string,
      slug: fd.get("slug") as string,
      excerpt: fd.get("excerpt") as string,
      content: fd.get("content") as string,
      metaTitleNo: (fd.get("metaTitleNo") as string) || undefined,
      metaDescNo: (fd.get("metaDescNo") as string) || undefined,
      category: fd.get("category") as string,
      linkedMarketId: (fd.get("linkedMarketId") as string) || undefined,
      published: fd.get("published") === "on",
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Post updated");
    }
    setLoading(false);
  }

  async function onDelete() {
    if (!confirm("Delete this post permanently?")) return;
    setDeleting(true);
    const result = await deleteBlogPost(params.id as string);
    if (result.error) {
      toast.error(result.error);
      setDeleting(false);
    } else {
      toast.success("Post deleted");
      router.push("/admin/blog");
    }
  }

  if (!post) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Edit Post</h1>
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          disabled={deleting}
        >
          {deleting ? "Deleting..." : "Delete"}
        </Button>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Content (English — visible on page)
            </h2>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                defaultValue={post.title}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <Input
                id="slug"
                name="slug"
                defaultValue={post.slug}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Input
                id="excerpt"
                name="excerpt"
                defaultValue={post.excerpt}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content (Markdown)</Label>
              <Textarea
                id="content"
                name="content"
                defaultValue={post.content}
                required
                rows={16}
                className="font-mono text-sm"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-sm font-semibold text-[var(--color-viking)] uppercase tracking-wide">
              🇳🇴 Norwegian SEO (invisible on page)
            </h2>
            <div className="space-y-2">
              <Label htmlFor="metaTitleNo">Norwegian Meta Title</Label>
              <Input
                id="metaTitleNo"
                name="metaTitleNo"
                defaultValue={post.metaTitleNo ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metaDescNo">Norwegian Meta Description</Label>
              <Textarea
                id="metaDescNo"
                name="metaDescNo"
                defaultValue={post.metaDescNo ?? ""}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Settings
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select name="category" defaultValue={post.category}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ANALYSIS">Analysis</SelectItem>
                    <SelectItem value="NEWS">News</SelectItem>
                    <SelectItem value="GUIDE">Guide</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedMarketId">Linked Market ID</Label>
                <Input
                  id="linkedMarketId"
                  name="linkedMarketId"
                  defaultValue={post.linkedMarketId ?? ""}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="published"
                name="published"
                defaultChecked={post.published}
                className="rounded"
              />
              <Label htmlFor="published">Published</Label>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}
