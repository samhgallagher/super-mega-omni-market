import { TransactWriteCommand } from '@aws-sdk/lib-dynamodb'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const { id } = getRouterParams(event)

  const ticket = await dbGet(`USER#${session.user.userId}`, `SCRATCH#${id}`)
  if (!ticket) throw createError({ statusCode: 404, message: 'Ticket not found.' })
  if (ticket.scratched) throw createError({ statusCode: 400, message: 'Ticket already revealed.' })

  const payout = ticket.payout as number
  const user = await dbGet(`USER#${session.user.userId}`, `USER#${session.user.userId}`)
  if (!user) throw createError({ statusCode: 404, message: 'User not found.' })

  const newBalance = Math.round(((user.balance as number) + payout) * 100) / 100

  await db.send(new TransactWriteCommand({
    TransactItems: [
      {
        Update: {
          TableName: getTable(),
          Key: { PK: `USER#${session.user.userId}`, SK: `SCRATCH#${id}` },
          UpdateExpression: 'SET scratched = :true',
          ConditionExpression: 'scratched = :false',
          ExpressionAttributeValues: { ':true': true, ':false': false }
        }
      },
      ...(payout > 0 ? [{
        Update: {
          TableName: getTable(),
          Key: { PK: `USER#${session.user.userId}`, SK: `USER#${session.user.userId}` },
          UpdateExpression: 'SET balance = balance + :payout',
          ExpressionAttributeValues: { ':payout': payout }
        }
      }] : [])
    ]
  }))

  await setUserSession(event, { user: { ...session.user, balance: newBalance } })

  return { outcome: ticket.outcome as string, payout, newBalance }
})
