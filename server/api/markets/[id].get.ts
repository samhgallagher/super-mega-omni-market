export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)

  const market = await dbGet(`MARKET#${id}`, `MARKET#${id}`)
  if (!market) throw createError({ statusCode: 404, message: 'Market not found.' })

  const outcomes = market.outcomes as Array<{ id: string, label: string, shares: number }>
  const prices = computePrices(outcomes.map(o => o.shares), market.liquidity as number)

  return {
    id,
    title: market.title,
    description: market.description ?? null,
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
