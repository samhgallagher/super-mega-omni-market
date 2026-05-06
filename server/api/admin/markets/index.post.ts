export default defineEventHandler(async (event) => {
  const { title, description, category, photo, expiresAt, liquidity, outcomes: outcomeLabels } = await readBody(event)

  if (!title || !category || !liquidity || !outcomeLabels || outcomeLabels.length < 2) {
    throw createError({ statusCode: 400, message: 'Title, category, liquidity, and at least 2 outcomes are required.' })
  }

  const marketId = crypto.randomUUID()
  const now = Date.now()

  const outcomes = (outcomeLabels as string[]).map(label => ({
    id: crypto.randomUUID(),
    label: label.trim(),
    shares: 0
  }))

  await dbPut({
    PK: `MARKET#${marketId}`,
    SK: `MARKET#${marketId}`,
    title: title.trim(),
    description: description?.trim() || undefined,
    category,
    photo: photo || undefined,
    expiresAt: expiresAt || undefined,
    liquidity: Number(liquidity),
    outcomes,
    resolved: false,
    resolvedOutcomeId: null,
    createdAt: now,
    GSI1PK: 'MARKETS',
    GSI1SK: `MARKET#${marketId}`
  })

  return { id: marketId }
})
