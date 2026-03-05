"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Shield } from "lucide-react";
import { createDispute } from "@/actions/disputes";
import { toast } from "sonner";

interface DisputeBannerProps {
  marketId: string;
  resolution: string;
  pendingResolutionAt: string;
  disputePeriodHours: number;
  disputeCount: number;
  hasPosition: boolean;
  hasDisputed: boolean;
}

export function DisputeBanner({
  marketId,
  resolution,
  pendingResolutionAt,
  disputePeriodHours,
  disputeCount,
  hasPosition,
  hasDisputed,
}: DisputeBannerProps) {
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  const disputeEnds = new Date(
    new Date(pendingResolutionAt).getTime() + disputePeriodHours * 60 * 60 * 1000
  );
  const isExpired = new Date() > disputeEnds;

  // Countdown timer
  useState(() => {
    function update() {
      const now = new Date();
      const diff = disputeEnds.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${hours}h ${mins}m`);
    }
    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  });

  async function handleSubmit() {
    if (reason.length < 10) {
      toast.error("Reason must be at least 10 characters");
      return;
    }
    setLoading(true);
    const result = await createDispute({ marketId, reason });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Dispute filed successfully");
      setShowForm(false);
      setReason("");
    }
    setLoading(false);
  }

  return (
    <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Pending Resolution
            </span>
            <Badge className={resolution === "YES" ? "bg-green-600 text-white text-xs" : "bg-red-600 text-white text-xs"}>
              Proposed: {resolution}
            </Badge>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
            This market has been proposed for resolution.
            {!isExpired ? (
              <>
                {" "}The dispute window closes in <strong>{timeLeft}</strong>.
              </>
            ) : (
              <> The dispute window has expired and the market will be finalized soon.</>
            )}
          </p>

          <div className="flex items-center gap-3 mt-2 text-xs text-amber-600 dark:text-amber-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {disputePeriodHours}h dispute window
            </span>
            {disputeCount > 0 && (
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {disputeCount} dispute{disputeCount !== 1 ? "s" : ""} filed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* File dispute form */}
      {hasPosition && !hasDisputed && !isExpired && (
        <div className="pt-2 border-t border-amber-200 dark:border-amber-800">
          {!showForm ? (
            <Button
              variant="outline"
              size="sm"
              className="text-amber-700 border-amber-300 hover:bg-amber-100 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-900/30 gap-1"
              onClick={() => setShowForm(true)}
            >
              <Shield className="h-3 w-3" />
              File a Dispute
            </Button>
          ) : (
            <div className="space-y-2">
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why you believe this resolution is incorrect... (min 10 characters)"
                rows={3}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={loading || reason.length < 10}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {loading ? "Submitting..." : "Submit Dispute"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setShowForm(false); setReason(""); }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {hasDisputed && (
        <p className="text-xs text-amber-600 dark:text-amber-500 pt-2 border-t border-amber-200 dark:border-amber-800">
          ✓ You have already filed a dispute on this market.
        </p>
      )}
    </div>
  );
}
