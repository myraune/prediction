"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { createBlogPost } from "@/actions/blog";
import { toast } from "sonner";

export default function NewBlogPostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const result = await createBlogPost({
      title: fd.get("title") as string,
      slug: (fd.get("slug") as string) || undefined,
      excerpt: fd.get("excerpt") as string,
      content: fd.get("content") as string,
      metaTitleNo: (fd.get("metaTitleNo") as string) || undefined,
      metaDescNo: (fd.get("metaDescNo") as string) || undefined,
      category: (fd.get("category") as string) || "ANALYSIS",
      linkedMarketId: (fd.get("linkedMarketId") as string) || undefined,
      published: fd.get("published") === "on",
    });

    if (result.error) {
      toast.error(result.error);
      setLoading(false);
    } else {
      toast.success("Post created");
      router.push("/admin/blog");
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">New Blog Post</h1>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* English content */}
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
                placeholder="Will Høiby be convicted in 2026?"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">
                URL Slug{" "}
                <span className="text-muted-foreground font-normal">
                  (Norwegian for SEO — auto-generated if empty)
                </span>
              </Label>
              <Input
                id="slug"
                name="slug"
                placeholder="hoiby-rettssaken-2026"
              />
              <p className="text-xs text-muted-foreground">
                Use Norwegian words here. Google indexes the URL. Example:
                /blog/hoiby-rettssaken-2026
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Input
                id="excerpt"
                name="excerpt"
                placeholder="Short summary for blog listing cards..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content (Markdown)</Label>
              <Textarea
                id="content"
                name="content"
                placeholder="Write your analysis in markdown..."
                required
                rows={16}
                className="font-mono text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Norwegian SEO */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-sm font-semibold text-[var(--color-viking)] uppercase tracking-wide">
              🇳🇴 Norwegian SEO (invisible on page — shown in Google results)
            </h2>
            <p className="text-xs text-muted-foreground">
              These appear in Google search snippets for Norwegian queries. The
              page itself stays in English.
            </p>
            <div className="space-y-2">
              <Label htmlFor="metaTitleNo">Norwegian Meta Title</Label>
              <Input
                id="metaTitleNo"
                name="metaTitleNo"
                placeholder="Blir Marius Borg Høiby dømt i 2026? — Viking Market"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metaDescNo">Norwegian Meta Description</Label>
              <Textarea
                id="metaDescNo"
                name="metaDescNo"
                placeholder="Les vår analyse av Høiby-rettssaken og handel på utfallet i prediksjonsmarkedet..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Settings
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select name="category" defaultValue="ANALYSIS">
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
                <Label htmlFor="linkedMarketId">
                  Linked Market ID (optional)
                </Label>
                <Input
                  id="linkedMarketId"
                  name="linkedMarketId"
                  placeholder="paste market ID..."
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="published"
                name="published"
                className="rounded"
              />
              <Label htmlFor="published">Publish immediately</Label>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating..." : "Create Post"}
        </Button>
      </form>
    </div>
  );
}
