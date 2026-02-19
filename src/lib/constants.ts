export const STARTING_BALANCE = 1000;
export const INITIAL_POOL_SIZE = 100;
export const MIN_TRADE_AMOUNT = 1;
export const MAX_TRADE_AMOUNT = 500;

export const CATEGORIES = [
  { value: "POLITICS", label: "Politics", icon: "landmark", color: "bg-blue-500" },
  { value: "SPORTS", label: "Sports", icon: "trophy", color: "bg-green-500" },
  { value: "ECONOMY", label: "Economy", icon: "trending-up", color: "bg-amber-500" },
  { value: "CULTURE", label: "Culture", icon: "palette", color: "bg-purple-500" },
  { value: "WEATHER", label: "Weather", icon: "cloud-sun", color: "bg-cyan-500" },
  { value: "ENTERTAINMENT", label: "Entertainment", icon: "tv", color: "bg-pink-500" },
] as const;

export type Category = (typeof CATEGORIES)[number]["value"];
