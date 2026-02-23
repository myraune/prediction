export const STARTING_BALANCE = 1000;
export const INITIAL_POOL_SIZE = 100;
export const MIN_TRADE_AMOUNT = 1;
export const MAX_TRADE_AMOUNT = 500;

export const CATEGORIES = [
  { value: "POLITICS", label: "Politics", icon: "landmark", color: "bg-blue-500" },
  { value: "SPORTS", label: "Sports", icon: "trophy", color: "bg-green-500" },
  { value: "CRYPTO", label: "Crypto", icon: "bitcoin", color: "bg-orange-500" },
  { value: "CLIMATE", label: "Climate", icon: "thermometer-sun", color: "bg-cyan-500" },
  { value: "ECONOMICS", label: "Economics", icon: "trending-up", color: "bg-amber-500" },
  { value: "CULTURE", label: "Culture", icon: "palette", color: "bg-purple-500" },
  { value: "COMPANIES", label: "Companies", icon: "building-2", color: "bg-slate-500" },
  { value: "FINANCIALS", label: "Financials", icon: "bar-chart-3", color: "bg-emerald-500" },
  { value: "TECH_SCIENCE", label: "Tech & Science", icon: "cpu", color: "bg-indigo-500" },
  { value: "ENTERTAINMENT", label: "Entertainment", icon: "tv", color: "bg-pink-500" },
] as const;

export type Category = (typeof CATEGORIES)[number]["value"];

/** Category-specific gradient backgrounds for cards without images */
export const CATEGORY_GRADIENTS: Record<string, string> = {
  POLITICS: "linear-gradient(135deg, #1e3a5f 0%, #2d5aa0 100%)",
  SPORTS: "linear-gradient(135deg, #1a5c2e 0%, #2d8a4e 100%)",
  CRYPTO: "linear-gradient(135deg, #7c4a1c 0%, #c47f2c 100%)",
  CLIMATE: "linear-gradient(135deg, #1a4a5c 0%, #2d7a8a 100%)",
  ECONOMICS: "linear-gradient(135deg, #5c4a1a 0%, #8a7a2d 100%)",
  CULTURE: "linear-gradient(135deg, #5c1a5c 0%, #8a2d8a 100%)",
  COMPANIES: "linear-gradient(135deg, #2d2d3d 0%, #4a4a5a 100%)",
  FINANCIALS: "linear-gradient(135deg, #1a4a3a 0%, #2d7a6a 100%)",
  TECH_SCIENCE: "linear-gradient(135deg, #2d2d6b 0%, #4a4aaa 100%)",
  ENTERTAINMENT: "linear-gradient(135deg, #5c1a4a 0%, #8a2d6b 100%)",
};
