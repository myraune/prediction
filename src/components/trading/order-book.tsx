import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";

interface OrderBookProps {
  marketId: string;
}

export async function OrderBook({ marketId }: OrderBookProps) {
  let orders: { side: string; targetPrice: number; amount: number; createdAt: Date }[] = [];

  try {
    orders = await prisma.order.findMany({
      where: { marketId, status: "PENDING" },
      select: { side: true, targetPrice: true, amount: true, createdAt: true },
      orderBy: { targetPrice: "asc" },
      take: 20,
    });
  } catch {
    return null;
  }

  if (orders.length === 0) return null;

  const yesOrders = orders.filter((o) => o.side === "YES").sort((a, b) => b.targetPrice - a.targetPrice);
  const noOrders = orders.filter((o) => o.side === "NO").sort((a, b) => b.targetPrice - a.targetPrice);

  return (
    <section aria-label="Order book" className="rounded-xl border border-border/50 p-3 bg-card">
      <h3 className="text-sm font-medium mb-3">Order Book</h3>
      <div className="grid grid-cols-2 gap-4">
        {/* YES orders */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-yes)] mb-2">
            YES Bids ({yesOrders.length})
          </p>
          {yesOrders.length === 0 ? (
            <p className="text-xs text-muted-foreground">No bids</p>
          ) : (
            <div className="space-y-1">
              {yesOrders.map((o, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <Badge variant="outline" className="text-[var(--color-yes)] border-[var(--color-yes)]/30 text-[10px] h-5 px-1.5">
                    {Math.round(o.targetPrice * 100)}¢
                  </Badge>
                  <span className="font-price text-muted-foreground">{o.amount.toFixed(0)} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* NO orders */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-no)] mb-2">
            NO Bids ({noOrders.length})
          </p>
          {noOrders.length === 0 ? (
            <p className="text-xs text-muted-foreground">No bids</p>
          ) : (
            <div className="space-y-1">
              {noOrders.map((o, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <Badge variant="outline" className="text-[var(--color-no)] border-[var(--color-no)]/30 text-[10px] h-5 px-1.5">
                    {Math.round(o.targetPrice * 100)}¢
                  </Badge>
                  <span className="font-price text-muted-foreground">{o.amount.toFixed(0)} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
