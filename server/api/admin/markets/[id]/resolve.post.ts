export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const { outcomeId } = await readBody(event)

  if (!outcomeId) throw createError({ statusCode: 400, message: 'outcomeId is required.' })

  const market = await dbGet(`MARKET#${id}`, `MARKET#${id}`)
  if (!market) throw createError({ statusCode: 404, message: 'Market not found.' })
  if (market.resolved) throw createError({ statusCode: 400, message: 'Market is already resolved.' })

  const outcomes = market.outcomes as Array<{ id: string }>
  if (!outcomes.find(o => o.id === outcomeId)) {
    throw createError({ statusCode: 400, message: 'Invalid outcome.' })
  }

  await dbUpdate(`MARKET#${id}`, `MARKET#${id}`, { resolved: true, resolvedOutcomeId: outcomeId })

  return { ok: true }
})
