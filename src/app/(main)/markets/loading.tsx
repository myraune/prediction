import { MarketCardSkeleton } from "@/components/markets/market-card";

export default function MarketsLoading() {
  return (
    <div className="min-w-0">
      {/* Header skeleton */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="h-7 w-32 skeleton rounded" />
        <div className="h-4 w-20 skeleton rounded" />
      </div>

      {/* Sort tabs skeleton */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex gap-2">
          {[80, 56, 88, 72].map((w) => (
            <div key={w} className="h-7 skeleton rounded-full" style={{ width: w }} />
          ))}
        </div>
        <div className="flex gap-3">
          {[40, 64, 28].map((w) => (
            <div key={w} className="h-4 skeleton rounded" style={{ width: w }} />
          ))}
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <MarketCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
