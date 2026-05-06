import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
  BatchGetCommand
} from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({
  region: process.env.AWS_REGION ?? 'us-east-1',
  ...(process.env.AWS_ACCESS_KEY_ID && {
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
    }
  })
})

export const db = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true }
})

export function getTable(): string {
  return useRuntimeConfig().dynamodbTableName
}

export async function dbGet(pk: string, sk: string) {
  const { Item } = await db.send(new GetCommand({
    TableName: getTable(),
    Key: { PK: pk, SK: sk }
  }))
  return Item ?? null
}

export async function dbPut(item: Record<string, unknown>) {
  await db.send(new PutCommand({
    TableName: getTable(),
    Item: item
  }))
}

export async function dbQuery(pk: string, skPrefix?: string) {
  const table = getTable()
  const { Items } = await db.send(new QueryCommand({
    TableName: table,
    KeyConditionExpression: skPrefix
      ? 'PK = :pk AND begins_with(SK, :sk)'
      : 'PK = :pk',
    ExpressionAttributeValues: skPrefix
      ? { ':pk': pk, ':sk': skPrefix }
      : { ':pk': pk }
  }))
  return Items ?? []
}

export async function dbDelete(pk: string, sk: string) {
  await db.send(new DeleteCommand({
    TableName: getTable(),
    Key: { PK: pk, SK: sk }
  }))
}

export async function dbUpdate(pk: string, sk: string, updates: Record<string, unknown>) {
  const entries = Object.entries(updates)
  const UpdateExpression = 'SET ' + entries.map((_, i) => `#k${i} = :v${i}`).join(', ')
  const ExpressionAttributeNames = Object.fromEntries(entries.map(([k], i) => [`#k${i}`, k]))
  const ExpressionAttributeValues = Object.fromEntries(entries.map(([, v], i) => [`:v${i}`, v]))

  await db.send(new UpdateCommand({
    TableName: getTable(),
    Key: { PK: pk, SK: sk },
    UpdateExpression,
    ExpressionAttributeNames,
    ExpressionAttributeValues
  }))
}

export async function dbBatchGet(keys: Array<{ PK: string, SK: string }>) {
  if (keys.length === 0) return []
  const table = getTable()
  const { Responses } = await db.send(new BatchGetCommand({
    RequestItems: { [table]: { Keys: keys } }
  }))
  return Responses?.[table] ?? []
}

export async function dbQueryGSI(indexName: string, pk: string, pkAttribute: string, skPrefix?: string, skAttribute?: string) {
  const { Items } = await db.send(new QueryCommand({
    TableName: getTable(),
    IndexName: indexName,
    KeyConditionExpression: skPrefix && skAttribute
      ? `${pkAttribute} = :pk AND begins_with(${skAttribute}, :sk)`
      : `${pkAttribute} = :pk`,
    ExpressionAttributeValues: skPrefix
      ? { ':pk': pk, ':sk': skPrefix }
      : { ':pk': pk }
  }))
  return Items ?? []
}
