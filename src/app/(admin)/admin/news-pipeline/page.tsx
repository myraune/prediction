"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES } from "@/lib/constants";
import {
  runNewsPipeline,
  reviewSuggestion,
  editAndPublishSuggestion,
  deleteSuggestion,
  getPipelineStats,
} from "@/actions/news-pipeline";
import { toast } from "sonner";
import {
  Newspaper,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink,
  Bot,
  Loader2,
  RefreshCw,
  Pencil,
  Trash2,
  Rocket,
  History,
  AlertCircle,
} from "lucide-react";

interface SuggestedMarket {
  id: string;
  title: string;
  description: string;
  category: string;
  closesAt: string;
  imageUrl: string | null;
  sourceHeadline: string;
  sourceUrl: string | null;
  sourceName: string | null;
  aiReasoning: string | null;
  status: string;
  reviewedAt: string | null;
  publishedMarketId: string | null;
  createdAt: string;
}

interface PipelineRun {
  id: string;
  source: string;
  articlesFound: number;
  suggested: number;
  errors: string | null;
  duration: number;
  createdAt: string | Date;
}

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
  published: number;
  recentRuns: PipelineRun[];
}

export default function NewsPipelinePage() {
  const [suggestions, setSuggestions] = useState<SuggestedMarket[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("norwegian");

  const fetchData = useCallback(async () => {
    try {
      const [statsResult, suggestionsResult] = await Promise.all([
        getPipelineStats(),
        fetch("/api/admin/news-pipeline/suggestions").then((r) => r.json()),
      ]);
      if (statsResult) setStats(statsResult);
      if (suggestionsResult.suggestions) setSuggestions(suggestionsResult.suggestions);
    } catch {
      // Silently handle errors on initial load
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleRunPipeline() {
    setLoading(true);
    try {
      const result = await runNewsPipeline({ query, source });
      if (result.error && !result.suggested) {
        toast.error(result.error);
      } else {
        toast.success(
          `Found ${result.articlesFound} articles → ${result.suggested} market suggestions`
        );
        if (result.error) toast.info(result.error);
      }
      await fetchData();
    } catch {
      toast.error("Pipeline failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    const result = await reviewSuggestion(id, "approve");
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Market published!");
      await fetchData();
    }
  }

  async function handleReject(id: string) {
    const result = await reviewSuggestion(id, "reject");
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.info("Suggestion rejected");
      await fetchData();
    }
  }

  async function handleDelete(id: string) {
    const result = await deleteSuggestion(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.info("Suggestion deleted");
      await fetchData();
    }
  }

  async function handleEditPublish(id: string, form: HTMLFormElement) {
    const fd = new FormData(form);
    const result = await editAndPublishSuggestion(id, {
      title: fd.get("title") as string,
      description: fd.get("description") as string,
      category: fd.get("category") as string,
      closesAt: fd.get("closesAt") as string,
      featured: fd.get("featured") === "on",
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Edited market published!");
      setEditingId(null);
      await fetchData();
    }
  }

  const pendingSuggestions = suggestions.filter((s) => s.status === "PENDING");
  const reviewedSuggestions = suggestions.filter((s) => s.status !== "PENDING");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-[var(--color-brand)]" />
            News Pipeline
          </h1>
          <p className="text-muted-foreground mt-1">
            Fetch Norwegian news → AI generates market questions → You review & publish
          </p>
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-xl font-bold">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <Rocket className="h-4 w-4 text-[var(--color-yes)]" />
                <div>
                  <p className="text-xs text-muted-foreground">Published</p>
                  <p className="text-xl font-bold">{stats.published}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-[var(--color-no)]" />
                <div>
                  <p className="text-xs text-muted-foreground">Rejected</p>
                  <p className="text-xl font-bold">{stats.rejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Pipeline Runs</p>
                  <p className="text-xl font-bold">{stats.recentRuns.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pipeline trigger */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Run Pipeline
          </CardTitle>
          <CardDescription>
            Fetch Norwegian news from NRK, VG, E24, Dagbladet, Aftenposten, DN and generate market suggestions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Label htmlFor="query" className="text-xs mb-1 block">Search query (optional for RSS)</Label>
              <Input
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Only used for NewsAPI/GNews fallback..."
                disabled={source === "norwegian"}
              />
            </div>
            <div className="w-full sm:w-48">
              <Label htmlFor="source" className="text-xs mb-1 block">News source</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="norwegian">Norwegian RSS</SelectItem>
                  <SelectItem value="newsapi">NewsAPI.org</SelectItem>
                  <SelectItem value="gnews">GNews.io</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleRunPipeline} disabled={loading} className="gap-2">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Fetch & Generate
                  </>
                )}
              </Button>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>
              Norwegian RSS fetches from NRK, VG, E24, Dagbladet, Aftenposten, DN (no API key needed).
              Add <code className="bg-muted px-1 rounded">ANTHROPIC_API_KEY</code> or{" "}
              <code className="bg-muted px-1 rounded">OPENAI_API_KEY</code> for AI-generated market suggestions.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Pending suggestions */}
      {pendingSuggestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Pending Review ({pendingSuggestions.length})
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchData}
              className="gap-1"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>

          {pendingSuggestions.map((s) => (
            <Card key={s.id} className="border-l-4 border-l-amber-500">
              <CardContent className="pt-5">
                {editingId === s.id ? (
                  <EditForm
                    suggestion={s}
                    onPublish={(form) => handleEditPublish(s.id, form)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <SuggestionCard
                    suggestion={s}
                    onApprove={() => handleApprove(s.id)}
                    onReject={() => handleReject(s.id)}
                    onEdit={() => setEditingId(s.id)}
                    onDelete={() => handleDelete(s.id)}
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!fetching && pendingSuggestions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium">No pending suggestions</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Run the pipeline above to generate prediction market ideas from trending news
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recent history */}
      {reviewedSuggestions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            Review History
          </h2>
          <div className="space-y-2">
            {reviewedSuggestions.slice(0, 20).map((s) => (
              <Card key={s.id} className={`opacity-70 ${s.status === "PUBLISHED" ? "border-l-4 border-l-[var(--color-yes)]" : "border-l-4 border-l-[var(--color-no)]"}`}>
                <CardContent className="py-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.sourceName} · {new Date(s.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.status === "PUBLISHED" ? (
                      <span className="text-xs text-[var(--color-yes)] flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Published
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--color-no)] flex items-center gap-1">
                        <XCircle className="h-3.5 w-3.5" />
                        Rejected
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleDelete(s.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Pipeline run history */}
      {stats && stats.recentRuns.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            Pipeline Run Log
          </h2>
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-2 font-medium">Source</th>
                  <th className="text-left p-2 font-medium">Articles</th>
                  <th className="text-left p-2 font-medium">Suggested</th>
                  <th className="text-left p-2 font-medium">Duration</th>
                  <th className="text-left p-2 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentRuns.map((run) => (
                  <tr key={run.id} className="border-t">
                    <td className="p-2">{run.source}</td>
                    <td className="p-2">{run.articlesFound}</td>
                    <td className="p-2">{run.suggested}</td>
                    <td className="p-2">{(run.duration / 1000).toFixed(1)}s</td>
                    <td className="p-2 text-muted-foreground">
                      {new Date(run.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────

function SuggestionCard({
  suggestion,
  onApprove,
  onReject,
  onEdit,
  onDelete,
}: {
  suggestion: SuggestedMarket;
  onApprove: () => void;
  onReject: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const categoryLabel = CATEGORIES.find((c) => c.value === suggestion.category)?.label ?? suggestion.category;

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold leading-tight">{suggestion.title}</h3>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
            {suggestion.description}
          </p>
        </div>
        {suggestion.imageUrl && (
          <img
            src={suggestion.imageUrl}
            alt=""
            className="w-20 h-14 rounded object-cover shrink-0"
          />
        )}
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="bg-muted px-2 py-0.5 rounded-full font-medium">{categoryLabel}</span>
        <span>·</span>
        <span>Closes {new Date(suggestion.closesAt).toLocaleDateString()}</span>
        {suggestion.sourceName && (
          <>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Newspaper className="h-3 w-3" />
              {suggestion.sourceName}
            </span>
          </>
        )}
        {suggestion.sourceUrl && (
          <a
            href={suggestion.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-brand)] hover:underline flex items-center gap-0.5"
          >
            <ExternalLink className="h-3 w-3" />
            Source
          </a>
        )}
      </div>

      {/* AI reasoning */}
      {suggestion.aiReasoning && (
        <div className="bg-muted/50 rounded-md p-2.5 text-sm flex items-start gap-2">
          <Bot className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
          <span className="text-muted-foreground">{suggestion.aiReasoning}</span>
        </div>
      )}

      {/* Source headline */}
      <div className="bg-muted/30 rounded-md p-2.5 text-xs text-muted-foreground">
        <span className="font-medium">Source headline:</span> {suggestion.sourceHeadline}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <Button size="sm" onClick={onApprove} className="gap-1.5 bg-[var(--color-yes)] hover:bg-[var(--color-yes)]/90">
          <CheckCircle className="h-3.5 w-3.5" />
          Publish as-is
        </Button>
        <Button size="sm" variant="outline" onClick={onEdit} className="gap-1.5">
          <Pencil className="h-3.5 w-3.5" />
          Edit & Publish
        </Button>
        <Button size="sm" variant="outline" onClick={onReject} className="gap-1.5 text-[var(--color-no)] border-[var(--color-no)]/30 hover:bg-[var(--color-no)]/10">
          <XCircle className="h-3.5 w-3.5" />
          Reject
        </Button>
        <div className="flex-1" />
        <Button size="sm" variant="ghost" onClick={onDelete} className="text-muted-foreground h-8 w-8 p-0">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function EditForm({
  suggestion,
  onPublish,
  onCancel,
}: {
  suggestion: SuggestedMarket;
  onPublish: (form: HTMLFormElement) => void;
  onCancel: () => void;
}) {
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onPublish(e.currentTarget);
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="title" className="text-xs">Title</Label>
        <Input id="title" name="title" defaultValue={suggestion.title} required minLength={10} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description" className="text-xs">Description / Resolution Criteria</Label>
        <Textarea id="description" name="description" defaultValue={suggestion.description} required minLength={20} rows={3} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="category" className="text-xs">Category</Label>
          <Select name="category" defaultValue={suggestion.category}>
            <SelectTrigger>
              <SelectValue />
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
        <div className="space-y-1.5">
          <Label htmlFor="closesAt" className="text-xs">Closes At</Label>
          <Input
            id="closesAt"
            name="closesAt"
            type="datetime-local"
            defaultValue={new Date(suggestion.closesAt).toISOString().slice(0, 16)}
            required
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="featured" name="featured" className="rounded" />
        <Label htmlFor="featured" className="text-xs">Featured</Label>
      </div>

      {/* AI source context */}
      <div className="bg-muted/30 rounded-md p-2 text-xs text-muted-foreground">
        <span className="font-medium">Source:</span> {suggestion.sourceHeadline}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button type="submit" size="sm" className="gap-1.5">
          <Rocket className="h-3.5 w-3.5" />
          Publish Market
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
