export function getTimeRemaining(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();

  if (diff <= 0) return "Closed";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 30) {
    const months = Math.floor(days / 30);
    return `${months}mo`;
  }
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function isClosingSoon(date: Date): boolean {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return diff > 0 && diff < 24 * 60 * 60 * 1000; // less than 24 hours
}
