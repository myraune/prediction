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
