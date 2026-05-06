export default defineEventHandler(async (event) => {
  const { category } = getQuery(event)

  let items = await dbQueryGSI('GSI1', 'MARKETS', 'GSI1PK') as Array<Record<string, unknown>>

  items = items.filter(m => !m.hidden)

  if (category) {
    items = items.filter(m => m.category === category)
  }

  return items.map((market) => {
    const outcomes = market.outcomes as Array<{ id: string, label: string, shares: number }>
    const prices = computePrices(outcomes.map(o => o.shares), market.liquidity as number)
    return {
      id: (market.PK as string).replace('MARKET#', ''),
      title: market.title,
      photo: market.photo ?? null,
      category: market.category,
      liquidity: market.liquidity,
      expiresAt: market.expiresAt ?? null,
      resolved: market.resolved ?? false,
      resolvedOutcomeId: market.resolvedOutcomeId ?? null,
      createdAt: market.createdAt,
      outcomes: outcomes.map((o, i) => ({ ...o, price: prices[i] }))
    }
  })
})
