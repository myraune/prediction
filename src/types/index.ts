import type { Market, Trade, Position, User } from "@/generated/prisma/client";

export type MarketWithStats = Market & {
  _count?: { trades: number };
};

export type PositionWithMarket = Position & {
  market: Market;
};

export type TradeWithMarket = Trade & {
  market: Market;
};

export type LeaderboardUser = Pick<User, "id" | "name" | "image" | "balance"> & {
  totalValue: number;
  rank: number;
};
