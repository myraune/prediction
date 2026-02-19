export interface PoolState {
  poolYes: number;
  poolNo: number;
}

export interface TradeResult {
  newPoolYes: number;
  newPoolNo: number;
  shares: number;
  effectivePrice: number;
}

export function getPrice(pool: PoolState): { yes: number; no: number } {
  const total = pool.poolYes + pool.poolNo;
  return {
    yes: pool.poolNo / total,
    no: pool.poolYes / total,
  };
}

export function buyShares(
  pool: PoolState,
  side: "YES" | "NO",
  amount: number
): TradeResult {
  const k = pool.poolYes * pool.poolNo;

  if (side === "YES") {
    const newPoolNo = pool.poolNo + amount;
    const newPoolYes = k / newPoolNo;
    const shares = pool.poolYes - newPoolYes;
    return {
      newPoolYes,
      newPoolNo,
      shares,
      effectivePrice: amount / shares,
    };
  } else {
    const newPoolYes = pool.poolYes + amount;
    const newPoolNo = k / newPoolYes;
    const shares = pool.poolNo - newPoolNo;
    return {
      newPoolYes,
      newPoolNo,
      shares,
      effectivePrice: amount / shares,
    };
  }
}

export function sellShares(
  pool: PoolState,
  side: "YES" | "NO",
  sharesToSell: number
): TradeResult {
  const k = pool.poolYes * pool.poolNo;

  if (side === "YES") {
    const newPoolYes = pool.poolYes + sharesToSell;
    const newPoolNo = k / newPoolYes;
    const pointsReceived = pool.poolNo - newPoolNo;
    return {
      newPoolYes,
      newPoolNo,
      shares: sharesToSell,
      effectivePrice: pointsReceived / sharesToSell,
    };
  } else {
    const newPoolNo = pool.poolNo + sharesToSell;
    const newPoolYes = k / newPoolNo;
    const pointsReceived = pool.poolYes - newPoolYes;
    return {
      newPoolYes,
      newPoolNo,
      shares: sharesToSell,
      effectivePrice: pointsReceived / sharesToSell,
    };
  }
}

export function estimateSlippage(
  pool: PoolState,
  side: "YES" | "NO",
  amount: number
): number {
  const currentPrice = getPrice(pool);
  const result = buyShares(pool, side, amount);
  const spotPrice = side === "YES" ? currentPrice.yes : currentPrice.no;
  return (result.effectivePrice - spotPrice) / spotPrice;
}
