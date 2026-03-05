"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { initiateResolution, finalizeResolution, revertResolution, resolveMarket } from "@/actions/markets";
import { dismissDispute, upholdDispute } from "@/actions/disputes";
import { generateBlogDraft } from "@/actions/blog";
import { toast } from "sonner";
import { AlertTriangle, FileText, Clock, Shield, RotateCcw, CheckCircle, XCircle, Gavel } from "lucide-react";

interface MarketData {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  resolution: string | null;
  resolutionNote: string | null;
  resolutionSources: string | null;
  totalVolume: number;
  poolYes: number;
  poolNo: number;
  disputePeriodHours: number;
  disputeCount: number;
  pendingResolutionAt: string | null;
}

interface DisputeData {
  id: string;
  reason: string;
  status: string;
  createdAt: string;
  user: { name: string; email: string };
}

export default function AdminMarketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const marketId = params.id as string;
  const [market, setMarket] = useState<MarketData | null>(null);
  const [disputes, setDisputes] = useState<DisputeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [generatingBlog, setGeneratingBlog] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/market/${marketId}`)
      .then((r) => r.json())
      .then((data) => {
        setMarket(data);
        // Also fetch disputes
        fetch(`/api/admin/market/${marketId}/disputes`)
          .then((r) => r.json())
          .then((d) => { if (Array.isArray(d)) setDisputes(d); })
          .catch(() => {});
      })
      .catch(() => toast.error("Failed to load market"));
  }, [marketId]);

  // Calculate dispute window
  const disputeEndTime = market?.pendingResolutionAt
    ? new Date(new Date(market.pendingResolutionAt).getTime() + market.disputePeriodHours * 60 * 60 * 1000)
    : null;
  const disputeExpired = disputeEndTime ? new Date() > disputeEndTime : false;

  async function handleInitiateResolution(resolution: "YES" | "NO") {
    if (!confirm(`Initiate resolution as ${resolution}? A ${market?.disputePeriodHours ?? 24}h dispute window will start.`)) return;
    setLoading(true);

    const result = await initiateResolution({ marketId, resolution, resolutionNote: note || undefined });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Resolution initiated as ${resolution} — dispute window started`);
      // Refresh data
      window.location.reload();
    }
    setLoading(false);
  }

  async function handleInstantResolve(resolution: "YES" | "NO") {
    if (!confirm(`Instantly resolve as ${resolution}? This skips the dispute period and settles immediately.`)) return;
    setLoading(true);

    const result = await resolveMarket({ marketId, resolution, resolutionNote: note || undefined });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Market resolved as ${resolution}`);
      router.push("/admin/markets");
    }
    setLoading(false);
  }

  async function handleFinalize() {
    if (!confirm("Finalize this resolution? This will settle all positions and pay winners.")) return;
    setLoading(true);

    const result = await finalizeResolution(marketId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Market finalized — positions settled");
      router.push("/admin/markets");
    }
    setLoading(false);
  }

  async function handleRevert() {
    if (!confirm("Revert resolution? Market will return to OPEN status.")) return;
    setLoading(true);

    const result = await revertResolution(marketId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Resolution reverted — market is open again");
      window.location.reload();
    }
    setLoading(false);
  }

  async function handleDismissDispute(disputeId: string) {
    const result = await dismissDispute(disputeId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Dispute dismissed");
      setDisputes(disputes.map((d) => d.id === disputeId ? { ...d, status: "DISMISSED" } : d));
    }
  }

  async function handleUpholdDispute(disputeId: string) {
    const result = await upholdDispute(disputeId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Dispute upheld — consider reverting the resolution");
      setDisputes(disputes.map((d) => d.id === disputeId ? { ...d, status: "UPHELD" } : d));
    }
  }

  async function handleGenerateBlogDraft() {
    setGeneratingBlog(true);
    const result = await generateBlogDraft(marketId);
    if (result.error) {
      if ("existingId" in result && result.existingId) {
        toast.info("A blog post already exists for this market");
        router.push(`/admin/blog/${result.existingId}`);
      } else {
        toast.error(result.error);
      }
    } else if (result.success && "id" in result) {
      toast.success("Blog draft created!");
      router.push(`/admin/blog/${result.id}`);
    }
    setGeneratingBlog(false);
  }

  if (!market) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Market Details</h1>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={
                market.status === "PENDING_RESOLUTION" ? "bg-amber-500/10 text-amber-600 border-amber-500/30" :
                market.status === "RESOLVED" ? "bg-purple-500/10 text-purple-600 border-purple-500/30" :
                ""
              }>
                {market.status === "PENDING_RESOLUTION" ? "Pending Resolution" : market.status}
              </Badge>
              {market.disputeCount > 0 && (
                <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
                  {market.disputeCount} dispute{market.disputeCount !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            <h2 className="text-lg font-semibold">{market.title}</h2>
            <p className="text-muted-foreground text-sm mt-1">{market.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Category</p>
              <p className="font-medium">{market.category}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Volume</p>
              <p className="font-medium">{market.totalVolume.toLocaleString("nb-NO")} pts</p>
            </div>
            <div>
              <p className="text-muted-foreground">Dispute Period</p>
              <p className="font-medium">{market.disputePeriodHours}h</p>
            </div>
          </div>

          {market.resolutionSources && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3 rounded-lg">
              <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Resolution Sources</p>
              <p className="text-sm text-blue-900 dark:text-blue-300">{market.resolutionSources}</p>
            </div>
          )}

          {market.resolution && (
            <div className="bg-muted p-4 rounded-lg">
              <p className="font-medium">
                {market.status === "PENDING_RESOLUTION" ? "Proposed: " : "Resolved: "}
                {market.resolution}
              </p>
              {market.resolutionNote && (
                <p className="text-sm text-muted-foreground mt-1">{market.resolutionNote}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Blog Draft */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Blog Content
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Generate an AI blog draft with Norwegian SEO for this market.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateBlogDraft}
              disabled={generatingBlog}
            >
              {generatingBlog ? "Generating..." : "Generate Blog Draft"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── PENDING_RESOLUTION: Dispute management + Finalize/Revert ── */}
      {market.status === "PENDING_RESOLUTION" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-amber-500" />
                Dispute Window
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm space-y-1">
                <p>
                  <strong>Proposed resolution:</strong>{" "}
                  <span className={market.resolution === "YES" ? "text-green-600" : "text-red-600"}>
                    {market.resolution}
                  </span>
                </p>
                {disputeEndTime && (
                  <p>
                    <strong>Dispute window ends:</strong>{" "}
                    {disputeExpired ? (
                      <span className="text-green-600">Expired — ready to finalize</span>
                    ) : (
                      <span className="text-amber-600">
                        {disputeEndTime.toLocaleString("nb-NO", {
                          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                    )}
                  </p>
                )}
                <p>
                  <strong>Disputes filed:</strong> {market.disputeCount}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleFinalize}
                  disabled={loading || !disputeExpired}
                  className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4" />
                  Finalize Resolution
                </Button>
                <Button
                  onClick={handleRevert}
                  disabled={loading}
                  variant="outline"
                  className="flex-1 gap-2 text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                >
                  <RotateCcw className="h-4 w-4" />
                  Revert to Open
                </Button>
              </div>

              {!disputeExpired && (
                <p className="text-xs text-muted-foreground">
                  You can finalize once the dispute window expires, or revert back to OPEN at any time.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Disputes list */}
          {disputes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Gavel className="h-5 w-5" />
                  Disputes ({disputes.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {disputes.map((dispute) => (
                  <div key={dispute.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{dispute.user.name}</span>
                        <span className="text-xs text-muted-foreground">{dispute.user.email}</span>
                      </div>
                      <Badge variant="outline" className={
                        dispute.status === "OPEN" ? "text-amber-600" :
                        dispute.status === "UPHELD" ? "text-red-600" :
                        "text-muted-foreground"
                      }>
                        {dispute.status}
                      </Badge>
                    </div>
                    <p className="text-sm">{dispute.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      Filed {new Date(dispute.createdAt).toLocaleString("nb-NO")}
                    </p>
                    {dispute.status === "OPEN" && (
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs gap-1"
                          onClick={() => handleDismissDispute(dispute.id)}
                        >
                          <XCircle className="h-3 w-3" />
                          Dismiss
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs gap-1 text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleUpholdDispute(dispute.id)}
                        >
                          <Shield className="h-3 w-3" />
                          Uphold
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ── OPEN: Resolution controls ── */}
      {market.status === "OPEN" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-[var(--color-no)]" />
              Resolve Market
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="note">Resolution Note (optional)</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Explain the resolution..."
                rows={3}
              />
            </div>

            {/* Standard: Initiate with dispute period */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Standard Resolution (with {market.disputePeriodHours}h dispute window)
              </p>
              <div className="flex gap-4">
                <Button
                  onClick={() => handleInitiateResolution("YES")}
                  disabled={loading}
                  className="flex-1 bg-[var(--color-yes)] text-white hover:bg-[var(--color-yes)]/90 gap-2"
                >
                  <Clock className="h-4 w-4" />
                  Initiate YES
                </Button>
                <Button
                  onClick={() => handleInitiateResolution("NO")}
                  disabled={loading}
                  className="flex-1 bg-[var(--color-no)] text-white hover:bg-[var(--color-no)]/90 gap-2"
                >
                  <Clock className="h-4 w-4" />
                  Initiate NO
                </Button>
              </div>
            </div>

            {/* Quick: Instant resolve (no dispute) */}
            <div className="pt-2 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Instant Resolution (skip dispute period — use for obvious outcomes)
              </p>
              <div className="flex gap-4">
                <Button
                  onClick={() => handleInstantResolve("YES")}
                  disabled={loading}
                  variant="outline"
                  className="flex-1 text-[var(--color-yes)] border-[var(--color-yes)]/30 hover:bg-[var(--color-yes)]/10"
                >
                  Instant YES
                </Button>
                <Button
                  onClick={() => handleInstantResolve("NO")}
                  disabled={loading}
                  variant="outline"
                  className="flex-1 text-[var(--color-no)] border-[var(--color-no)]/30 hover:bg-[var(--color-no)]/10"
                >
                  Instant NO
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
