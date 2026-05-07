export default defineEventHandler(async (event) => {
  const { userId } = getRouterParams(event)

  const [user, positionItems] = await Promise.all([
    dbGet(`USER#${userId}`, `USER#${userId}`),
    dbQuery(`USER#${userId}`, 'POS#')
  ])

  if (!user) throw createError({ statusCode: 404, message: 'User not found.' })

  if (positionItems.length === 0) {
    return {
      username: user.username as string,
      photo: (user.photo as string) ?? null,
      positions: []
    }
  }

  const marketKeys = [...new Set(positionItems.map(p => p.marketId as string))]
    .map(id => ({ PK: `MARKET#${id}`, SK: `MARKET#${id}` }))

  const marketItems = await dbBatchGet(marketKeys)
  const marketMap = Object.fromEntries(
    marketItems.map(m => [(m.PK as string).replace('MARKET#', ''), m])
  )

  const positions = positionItems.map((pos) => {
    const market = marketMap[pos.marketId as string]
    if (!market || (pos.shares as number) === 0) return null

    const outcomes = market.outcomes as Array<{ id: string, label: string, shares: number }>
    const outcomeIndex = outcomes.findIndex(o => o.id === pos.outcomeId)
    const outcome = outcomes[outcomeIndex]
    if (!outcome) return null

    const liquidity = market.liquidity as number
    const currentShares = outcomes.map(o => o.shares)
    const prices = computePrices(currentShares, liquidity)
    const userShares = pos.shares as number

    const currentPrice = prices[outcomeIndex]
    const sellValue = userShares > 0
      ? Math.max(0, -tradeCost(currentShares, outcomeIndex, -userShares, liquidity))
      : 0

    const resolved = market.resolved as boolean
    const won = resolved && market.resolvedOutcomeId === pos.outcomeId

    return {
      marketId: pos.marketId as string,
      outcomeId: pos.outcomeId as string,
      marketTitle: market.title as string,
      outcomeLabel: outcome.label,
      shares: userShares,
      currentPrice,
      sellValue,
      resolved,
      won,
      lost: resolved && !won,
      payout: won ? userShares : 0,
      redeemed: (pos.redeemed as boolean) ?? false
    }
  }).filter(Boolean)

  return {
    username: user.username as string,
    photo: (user.photo as string) ?? null,
    positions
  }
})
