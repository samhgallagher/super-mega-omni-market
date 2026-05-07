import { TransactWriteCommand } from '@aws-sdk/lib-dynamodb'

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)

  const market = await dbGet(`MARKET#${id}`, `MARKET#${id}`)
  if (!market) throw createError({ statusCode: 404, message: 'Market not found.' })
  if (market.type !== 'community') throw createError({ statusCode: 400, message: 'Only community markets can be moderated.' })
  if (market.status !== 'pending') throw createError({ statusCode: 400, message: 'Market is not pending.' })

  await db.send(new TransactWriteCommand({
    TransactItems: [
      {
        Update: {
          TableName: getTable(),
          Key: { PK: `MARKET#${id}`, SK: `MARKET#${id}` },
          UpdateExpression: 'SET #status = :status, GSI1PK = :gsi1pk',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: { ':status': 'rejected', ':gsi1pk': 'REJECTED_COMMUNITY' }
        }
      },
      {
        Update: {
          TableName: getTable(),
          Key: { PK: `USER#${market.creatorId}`, SK: `USER#${market.creatorId}` },
          UpdateExpression: 'SET balance = balance + :amount',
          ExpressionAttributeValues: { ':amount': market.liquidityStaked as number }
        }
      }
    ]
  }))

  return { ok: true }
})
