"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cancelOrder } from "@/actions/orders";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleCancel() {
    setLoading(true);
    const result = await cancelOrder(orderId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Order cancelled");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 text-xs text-muted-foreground hover:text-destructive gap-1"
      onClick={handleCancel}
      disabled={loading}
    >
      <X className="h-3 w-3" />
      {loading ? "..." : "Cancel"}
    </Button>
  );
}
