const SYMBOLS = ['🍒', '🍋', '⭐', '🔔', '💰', '🎲', '🃏']
const JACKPOT = '💎'

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  const settings = await getSettings()

  const today = new Date().toISOString().split('T')[0]
  const allTickets = await dbQuery(`USER#${session.user.userId}`, 'SCRATCH#') as Array<Record<string, unknown>>
  const usedFreeToday = allTickets.some(t => t.createdDate === today && t.free === true)

  if (usedFreeToday) {
    throw createError({ statusCode: 400, message: 'You have already claimed your free scratcher today.' })
  }

  const isJackpot = Math.random() < settings.scratcherJackpotOdds
  const outcome: 'win' | 'jackpot' = isJackpot ? 'jackpot' : 'win'
  const payout = isJackpot ? settings.scratcherFreeJackpotPrize : settings.scratcherFreeWinPrize

  const main = pick(SYMBOLS)
  const symbols: [string, string, string] = isJackpot ? [main, main, JACKPOT] : [main, main, main]

  const ticketId = crypto.randomUUID()

  await dbPut({
    PK: `USER#${session.user.userId}`,
    SK: `SCRATCH#${ticketId}`,
    free: true,
    tier: 0,
    outcome,
    symbols,
    payout,
    scratched: false,
    createdAt: Date.now(),
    createdDate: today
  })

  return { id: ticketId, symbols, payout: null, outcome: null }
})
