import { TransactWriteCommand } from '@aws-sdk/lib-dynamodb'

const SYMBOLS = ['🍒', '🍋', '⭐', '🔔', '💰', '🎲', '🃏']
const JACKPOT = '💎'

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function makeSymbols(outcome: 'win' | 'jackpot' | 'lose'): [string, string, string] {
  const main = pick(SYMBOLS)
  if (outcome === 'win') return [main, main, main]
  if (outcome === 'jackpot') return [main, main, JACKPOT]
  const others = SYMBOLS.filter(s => s !== main)
  return [main, main, pick(others)]
}

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const { tier } = await readBody(event)

  if (![10, 100, 500].includes(tier)) {
    throw createError({ statusCode: 400, message: 'Invalid tier. Must be 10, 100, or 500.' })
  }

  const [settings, user] = await Promise.all([
    getSettings(),
    dbGet(`USER#${session.user.userId}`, `USER#${session.user.userId}`)
  ])

  if (!user) throw createError({ statusCode: 404, message: 'User not found.' })

  const today = new Date().toISOString().split('T')[0]
  const allTickets = await dbQuery(`USER#${session.user.userId}`, 'SCRATCH#') as Array<Record<string, unknown>>
  const ticketsToday = allTickets.filter(t => t.createdDate === today).length

  if (ticketsToday >= settings.scratcherDailyLimit) {
    throw createError({ statusCode: 400, message: `Daily limit of ${settings.scratcherDailyLimit} scratchers reached. Come back tomorrow!` })
  }

  if ((user.balance as number) < tier) {
    throw createError({ statusCode: 400, message: 'Insufficient balance.' })
  }

  const r = Math.random()
  const outcome: 'win' | 'jackpot' | 'lose' =
    r < settings.scratcherJackpotOdds ? 'jackpot'
      : r < settings.scratcherJackpotOdds + settings.scratcherWinOdds ? 'win'
        : 'lose'

  const symbols = makeSymbols(outcome)
  const payout = outcome === 'win'
    ? Math.round(tier * settings.scratcherWinMultiplier * 100) / 100
    : outcome === 'jackpot'
      ? Math.round(tier * settings.scratcherJackpotMultiplier * 100) / 100
      : 0

  const ticketId = crypto.randomUUID()

  await db.send(new TransactWriteCommand({
    TransactItems: [
      {
        Update: {
          TableName: getTable(),
          Key: { PK: `USER#${session.user.userId}`, SK: `USER#${session.user.userId}` },
          UpdateExpression: 'SET balance = balance - :cost',
          ConditionExpression: 'balance >= :cost',
          ExpressionAttributeValues: { ':cost': tier }
        }
      },
      {
        Put: {
          TableName: getTable(),
          Item: {
            PK: `USER#${session.user.userId}`,
            SK: `SCRATCH#${ticketId}`,
            tier,
            outcome,
            symbols,
            payout,
            scratched: false,
            createdAt: Date.now(),
            createdDate: today
          }
        }
      }
    ]
  }))

  const newBalance = Math.round(((user.balance as number) - tier) * 100) / 100
  await setUserSession(event, { user: { ...session.user, balance: newBalance } })

  return { id: ticketId, tier, symbols, payout, outcome: null, newBalance }
})
