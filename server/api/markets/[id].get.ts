export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const session = await getUserSession(event)

  const market = await dbGet(`MARKET#${id}`, `MARKET#${id}`)
  if (!market) throw createError({ statusCode: 404, message: 'Market not found.' })

  if (market.type === 'community' && market.status === 'pending') {
    const isCreator = session?.user?.userId === market.creatorId
    const isAdmin = session?.user?.isAdmin
    if (!isCreator && !isAdmin) throw createError({ statusCode: 404, message: 'Market not found.' })
  }

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
    outcomes: outcomes.map((o, i) => ({ ...o, price: prices[i] })),
    type: market.type ?? 'admin',
    status: market.status ?? null,
    creatorId: market.creatorId ?? null,
    creatorUsername: market.creatorUsername ?? null,
    creatorPhoto: market.creatorPhoto ?? null,
    feePercent: (market.feePercent as number) ?? 0,
    accruedFees: (market.accruedFees as number) ?? 0,
    feesRedeemed: (market.feesRedeemed as boolean) ?? false
  }
})
