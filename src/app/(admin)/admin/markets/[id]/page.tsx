"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { resolveMarket } from "@/actions/markets";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

interface MarketData {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  resolution: string | null;
  resolutionNote: string | null;
  totalVolume: number;
  poolYes: number;
  poolNo: number;
}

export default function AdminMarketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const marketId = params.id as string;
  const [market, setMarket] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    fetch(`/api/admin/market/${marketId}`)
      .then((r) => r.json())
      .then(setMarket)
      .catch(() => toast.error("Failed to load market"));
  }, [marketId]);

  async function handleResolve(resolution: "YES" | "NO") {
    if (!confirm(`Are you sure you want to resolve this market as ${resolution}? This cannot be undone.`)) return;
    setLoading(true);

    const result = await resolveMarket({ marketId, resolution, resolutionNote: note || undefined });

    if (result.error) {
      toast.error(result.error);
      setLoading(false);
    } else {
      toast.success(`Market resolved as ${resolution}`);
      router.push("/admin/markets");
    }
  }

  if (!market) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Market Details</h1>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <Badge variant="outline" className="mb-2">{market.status}</Badge>
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
          </div>

          {market.resolution && (
            <div className="bg-muted p-4 rounded-lg">
              <p className="font-medium">Resolved: {market.resolution}</p>
              {market.resolutionNote && (
                <p className="text-sm text-muted-foreground mt-1">{market.resolutionNote}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

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

            <div className="flex gap-4">
              <Button
                onClick={() => handleResolve("YES")}
                disabled={loading}
                className="flex-1 bg-[var(--color-yes)] text-white hover:bg-[var(--color-yes)]/90"
              >
                Resolve YES
              </Button>
              <Button
                onClick={() => handleResolve("NO")}
                disabled={loading}
                className="flex-1 bg-[var(--color-no)] text-white hover:bg-[var(--color-no)]/90"
              >
                Resolve NO
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
