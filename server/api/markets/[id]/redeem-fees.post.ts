import { TransactWriteCommand } from '@aws-sdk/lib-dynamodb'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const { id } = getRouterParams(event)

  const [market, user] = await Promise.all([
    dbGet(`MARKET#${id}`, `MARKET#${id}`),
    dbGet(`USER#${session.user.userId}`, `USER#${session.user.userId}`)
  ])

  if (!market) throw createError({ statusCode: 404, message: 'Market not found.' })
  if (market.type !== 'community') throw createError({ statusCode: 400, message: 'Not a community market.' })
  if (market.creatorId !== session.user.userId) throw createError({ statusCode: 403, message: 'Only the creator can redeem fees.' })
  if (!market.resolved) throw createError({ statusCode: 400, message: 'Market must be resolved before redeeming fees.' })
  if (market.feesRedeemed) throw createError({ statusCode: 400, message: 'Fees already redeemed.' })
  if (!user) throw createError({ statusCode: 404, message: 'User not found.' })

  const fees = Math.round(((market.accruedFees as number) ?? 0) * 100) / 100
  if (fees <= 0) throw createError({ statusCode: 400, message: 'No fees to redeem.' })

  const newBalance = Math.round(((user.balance as number) + fees) * 100) / 100

  await db.send(new TransactWriteCommand({
    TransactItems: [
      {
        Update: {
          TableName: getTable(),
          Key: { PK: `USER#${session.user.userId}`, SK: `USER#${session.user.userId}` },
          UpdateExpression: 'SET balance = balance + :fees',
          ExpressionAttributeValues: { ':fees': fees }
        }
      },
      {
        Update: {
          TableName: getTable(),
          Key: { PK: `MARKET#${id}`, SK: `MARKET#${id}` },
          UpdateExpression: 'SET feesRedeemed = :true',
          ExpressionAttributeValues: { ':true': true }
        }
      }
    ]
  }))

  await setUserSession(event, { user: { ...session.user, balance: newBalance } })

  return { fees, newBalance }
})
