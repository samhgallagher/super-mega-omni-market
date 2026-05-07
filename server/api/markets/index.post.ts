import { TransactWriteCommand } from '@aws-sdk/lib-dynamodb'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const { title, description, photo, expiresAt, feePercent: rawFeePercent, outcomes: outcomeLabels } = await readBody(event)

  if (!title?.trim()) throw createError({ statusCode: 400, message: 'Title is required.' })
  if (!Array.isArray(outcomeLabels) || outcomeLabels.filter((o: string) => o?.trim()).length < 2) {
    throw createError({ statusCode: 400, message: 'At least 2 outcomes are required.' })
  }

  const [settings, user] = await Promise.all([
    getSettings(),
    dbGet(`USER#${session.user.userId}`, `USER#${session.user.userId}`)
  ])

  if (!user) throw createError({ statusCode: 404, message: 'User not found.' })

  const feePercent = rawFeePercent !== undefined ? Number(rawFeePercent) : settings.communityFeePercent
  if (isNaN(feePercent) || feePercent < 0 || feePercent > 100) {
    throw createError({ statusCode: 400, message: 'Fee percent must be between 0 and 100.' })
  }

  const balance = user.balance as number
  if (balance < settings.communityMinLiquidity) {
    throw createError({ statusCode: 400, message: `Insufficient balance. You need at least ¤${settings.communityMinLiquidity} to create a market.` })
  }

  const marketId = crypto.randomUUID()
  const now = Date.now()
  const outcomes = (outcomeLabels as string[])
    .filter(l => l?.trim())
    .map(label => ({ id: crypto.randomUUID(), label: label.trim(), shares: 0 }))

  await db.send(new TransactWriteCommand({
    TransactItems: [
      {
        Update: {
          TableName: getTable(),
          Key: { PK: `USER#${session.user.userId}`, SK: `USER#${session.user.userId}` },
          UpdateExpression: 'SET balance = balance - :amount',
          ConditionExpression: 'balance >= :amount',
          ExpressionAttributeValues: { ':amount': settings.communityMinLiquidity }
        }
      },
      {
        Put: {
          TableName: getTable(),
          Item: {
            PK: `MARKET#${marketId}`,
            SK: `MARKET#${marketId}`,
            type: 'community',
            status: 'pending',
            title: title.trim(),
            description: description?.trim() || undefined,
            category: 'community',
            photo: photo?.trim() || undefined,
            expiresAt: expiresAt ? Number(expiresAt) : undefined,
            liquidity: settings.communityMinLiquidity,
            outcomes,
            resolved: false,
            resolvedOutcomeId: null,
            hidden: false,
            createdAt: now,
            creatorId: session.user.userId,
            creatorUsername: session.user.username,
            creatorPhoto: session.user.photo ?? null,
            feePercent,
            liquidityStaked: settings.communityMinLiquidity,
            accruedFees: 0,
            feesRedeemed: false,
            GSI1PK: 'PENDING_COMMUNITY',
            GSI1SK: `MARKET#${marketId}`
          }
        }
      }
    ]
  }))

  await setUserSession(event, {
    user: { ...session.user, balance: balance - settings.communityMinLiquidity }
  })

  return { id: marketId }
})
