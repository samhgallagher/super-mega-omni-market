import { TransactWriteCommand } from '@aws-sdk/lib-dynamodb'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const { marketId, outcomeId } = await readBody(event)

  if (!marketId || !outcomeId) {
    throw createError({ statusCode: 400, message: 'marketId and outcomeId are required.' })
  }

  const [market, position, user] = await Promise.all([
    dbGet(`MARKET#${marketId}`, `MARKET#${marketId}`),
    dbGet(`USER#${session.user.userId}`, `POS#MARKET#${marketId}#OUTCOME#${outcomeId}`),
    dbGet(`USER#${session.user.userId}`, `USER#${session.user.userId}`)
  ])

  if (!market) throw createError({ statusCode: 404, message: 'Market not found.' })
  if (!market.resolved) throw createError({ statusCode: 400, message: 'Market is not resolved yet.' })
  if (market.resolvedOutcomeId !== outcomeId) throw createError({ statusCode: 400, message: 'This outcome did not win.' })
  if (!position) throw createError({ statusCode: 404, message: 'Position not found.' })
  if (position.redeemed) throw createError({ statusCode: 400, message: 'Already redeemed.' })
  if (!user) throw createError({ statusCode: 404, message: 'User not found.' })

  const shares = position.shares as number
  if (shares <= 0) throw createError({ statusCode: 400, message: 'No shares to redeem.' })

  const payout = shares // ¤1 per winning share
  const newBalance = (user.balance as number) + payout

  await db.send(new TransactWriteCommand({
    TransactItems: [
      {
        Update: {
          TableName: getTable(),
          Key: { PK: `USER#${session.user.userId}`, SK: `USER#${session.user.userId}` },
          UpdateExpression: 'SET balance = balance + :payout',
          ExpressionAttributeValues: { ':payout': payout }
        }
      },
      {
        Update: {
          TableName: getTable(),
          Key: { PK: `USER#${session.user.userId}`, SK: `POS#MARKET#${marketId}#OUTCOME#${outcomeId}` },
          UpdateExpression: 'SET redeemed = :true',
          ConditionExpression: 'redeemed = :false',
          ExpressionAttributeValues: { ':true': true, ':false': false }
        }
      }
    ]
  }))

  await setUserSession(event, { user: { ...session.user, balance: newBalance } })

  return { payout, newBalance }
})
