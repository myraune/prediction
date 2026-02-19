import { formatDistanceToNow } from "date-fns";

export function formatPoints(amount: number): string {
  return `${amount.toLocaleString("nb-NO", { maximumFractionDigits: 0 })} pts`;
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatRelativeDate(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatPrice(price: number): string {
  return `${price.toFixed(2)} pts`;
}

export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString("nb-NO", { maximumFractionDigits: 0 });
}
