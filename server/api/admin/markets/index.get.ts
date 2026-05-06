export default defineEventHandler(async () => {
  const items = await dbQueryGSI('GSI1', 'MARKETS', 'GSI1PK') as Array<Record<string, unknown>>

  return items.map((market) => {
    const outcomes = market.outcomes as Array<{ id: string, label: string, shares: number }>
    const prices = computePrices(outcomes.map(o => o.shares), market.liquidity as number)
    return {
      id: (market.PK as string).replace('MARKET#', ''),
      title: market.title,
      category: market.category,
      resolved: market.resolved ?? false,
      resolvedOutcomeId: market.resolvedOutcomeId ?? null,
      hidden: market.hidden ?? false,
      outcomes: outcomes.map((o, i) => ({ ...o, price: prices[i] }))
    }
  })
})
