// Numerically stable softmax over shares scaled by liquidity parameter b
export function computePrices(shares: number[], liquidity: number): number[] {
  const scaled = shares.map(s => s / liquidity)
  const max = Math.max(...scaled)
  const exps = scaled.map(s => Math.exp(s - max))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map(e => e / sum)
}

// LMSR cost function: b * ln(Σ exp(q_i / b))
export function cost(shares: number[], liquidity: number): number {
  const scaled = shares.map(s => s / liquidity)
  const max = Math.max(...scaled)
  const sum = scaled.reduce((acc, s) => acc + Math.exp(s - max), 0)
  return liquidity * (Math.log(sum) + max)
}

// Cost of buying (delta > 0) or selling (delta < 0) shares of one outcome
export function tradeCost(currentShares: number[], outcomeIndex: number, delta: number, liquidity: number): number {
  const newShares = [...currentShares]
  newShares[outcomeIndex] += delta
  return cost(newShares, liquidity) - cost(currentShares, liquidity)
}
