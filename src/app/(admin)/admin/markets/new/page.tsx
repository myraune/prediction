"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES } from "@/lib/constants";
import { createMarket } from "@/actions/markets";
import { toast } from "sonner";

export default function CreateMarketPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await createMarket({
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      category: formData.get("category") as string,
      closesAt: formData.get("closesAt") as string,
      featured: formData.get("featured") === "on",
      imageUrl: (formData.get("imageUrl") as string) || undefined,
      resolutionSources: (formData.get("resolutionSources") as string) || undefined,
      disputePeriodHours: parseInt(formData.get("disputePeriodHours") as string) || 24,
    });

    if (result.error) {
      toast.error(result.error);
      setLoading(false);
    } else {
      toast.success("Market created successfully");
      router.push("/admin/markets");
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Market</h1>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="Will [event] happen by [date]?"
                required
                minLength={10}
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Detailed resolution criteria..."
                required
                minLength={20}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select name="category" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL (optional)</Label>
              <Input
                id="imageUrl"
                name="imageUrl"
                type="url"
                placeholder="https://images.unsplash.com/..."
              />
              <p className="text-xs text-muted-foreground">Thumbnail shown on market cards. Use a landscape image URL.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="closesAt">Closes At</Label>
              <Input id="closesAt" name="closesAt" type="datetime-local" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resolutionSources">Resolution Sources (optional)</Label>
              <Textarea
                id="resolutionSources"
                name="resolutionSources"
                placeholder="e.g. Official FIFA results, NFF standings, SSB statistics..."
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Describe how this market will be resolved — data sources, official criteria, etc.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="disputePeriodHours">Dispute Period (hours)</Label>
              <Input
                id="disputePeriodHours"
                name="disputePeriodHours"
                type="number"
                min={1}
                max={168}
                defaultValue={24}
                className="w-32"
              />
              <p className="text-xs text-muted-foreground">
                How long users can dispute a proposed resolution. Default: 24h.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="featured" name="featured" className="rounded" />
              <Label htmlFor="featured">Featured on landing page</Label>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Market"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
