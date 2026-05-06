export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  const positionItems = await dbQuery(`USER#${session.user.userId}`, 'POS#')
  if (positionItems.length === 0) return []

  const marketKeys = [...new Set(positionItems.map(p => p.marketId as string))]
    .map(id => ({ PK: `MARKET#${id}`, SK: `MARKET#${id}` }))

  const marketItems = await dbBatchGet(marketKeys)
  const marketMap = Object.fromEntries(
    marketItems.map(m => [(m.PK as string).replace('MARKET#', ''), m])
  )

  return positionItems.map((pos) => {
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
    const payout = won ? userShares : 0

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
      payout,
      redeemed: (pos.redeemed as boolean) ?? false
    }
  }).filter(Boolean)
})
