import { TransactWriteCommand } from '@aws-sdk/lib-dynamodb'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const { id } = getRouterParams(event)
  const { outcomeId, shares, type } = await readBody(event)

  if (!outcomeId || !shares || !['buy', 'sell'].includes(type)) {
    throw createError({ statusCode: 400, message: 'Invalid request.' })
  }
  if (shares <= 0) {
    throw createError({ statusCode: 400, message: 'Shares must be positive.' })
  }

  const market = await dbGet(`MARKET#${id}`, `MARKET#${id}`)
  if (!market) throw createError({ statusCode: 404, message: 'Market not found.' })
  if (market.resolved) throw createError({ statusCode: 400, message: 'This market has been resolved.' })

  const outcomes = market.outcomes as Array<{ id: string, label: string, shares: number }>
  const outcomeIndex = outcomes.findIndex(o => o.id === outcomeId)
  if (outcomeIndex === -1) throw createError({ statusCode: 400, message: 'Invalid outcome.' })

  const liquidity = market.liquidity as number
  const currentShares = outcomes.map(o => o.shares)
  const delta = type === 'buy' ? shares : -shares
  const tradeAmount = tradeCost(currentShares, outcomeIndex, delta, liquidity)

  const user = await dbGet(`USER#${session.user.userId}`, `USER#${session.user.userId}`)
  if (!user) throw createError({ statusCode: 404, message: 'User not found.' })

  const balance = user.balance as number

  if (type === 'buy') {
    if (balance < tradeAmount) throw createError({ statusCode: 400, message: 'Insufficient balance.' })
  }

  if (type === 'sell') {
    const position = await dbGet(`USER#${session.user.userId}`, `POS#MARKET#${id}#OUTCOME#${outcomeId}`)
    if (!position || (position.shares as number) < shares) {
      throw createError({ statusCode: 400, message: 'Insufficient shares.' })
    }
  }

  const newShares = [...currentShares]
  newShares[outcomeIndex] += delta
  const newOutcomes = outcomes.map((o, i) => ({ ...o, shares: newShares[i] }))
  const newPrices = computePrices(newShares, liquidity)
  const now = Date.now()
  const balanceDelta = type === 'buy' ? -tradeAmount : -tradeAmount // tradeAmount is negative when selling

  await db.send(new TransactWriteCommand({
    TransactItems: [
      {
        Update: {
          TableName: TABLE,
          Key: { PK: `MARKET#${id}`, SK: `MARKET#${id}` },
          UpdateExpression: 'SET outcomes = :outcomes',
          ExpressionAttributeValues: { ':outcomes': newOutcomes }
        }
      },
      {
        Update: {
          TableName: TABLE,
          Key: { PK: `USER#${session.user.userId}`, SK: `USER#${session.user.userId}` },
          UpdateExpression: 'SET balance = balance + :delta',
          ExpressionAttributeValues: { ':delta': balanceDelta }
        }
      },
      {
        Update: {
          TableName: TABLE,
          Key: { PK: `USER#${session.user.userId}`, SK: `POS#MARKET#${id}#OUTCOME#${outcomeId}` },
          UpdateExpression: 'SET #s = if_not_exists(#s, :zero) + :delta, marketId = :marketId, outcomeId = :outcomeId, redeemed = if_not_exists(redeemed, :false), GSI2PK = :gsiPK, GSI2SK = :gsiSK',
          ExpressionAttributeNames: { '#s': 'shares' },
          ExpressionAttributeValues: {
            ':zero': 0,
            ':delta': delta,
            ':marketId': id,
            ':outcomeId': outcomeId,
            ':false': false,
            ':gsiPK': `MARKET#${id}`,
            ':gsiSK': `OUTCOME#${outcomeId}`
          }
        }
      },
      {
        Put: {
          TableName: TABLE,
          Item: {
            PK: `MARKET#${id}`,
            SK: `HIST#${now}`,
            outcomes: newOutcomes.map((o, i) => ({ id: o.id, label: o.label, price: newPrices[i] }))
          }
        }
      },
      {
        Put: {
          TableName: TABLE,
          Item: {
            PK: `MARKET#${id}`,
            SK: `ACT#${now}#${crypto.randomUUID().slice(0, 8)}`,
            userId: session.user.userId,
            username: session.user.username,
            photo: session.user.photo ?? null,
            outcomeId,
            outcomeLabel: outcomes[outcomeIndex].label,
            shares,
            type
          }
        }
      }
    ]
  }))

  const newBalance = balance + balanceDelta
  await setUserSession(event, { user: { ...session.user, balance: newBalance } })

  return {
    cost: tradeAmount,
    newBalance,
    outcomes: newOutcomes.map((o, i) => ({ ...o, price: newPrices[i] }))
  }
})
