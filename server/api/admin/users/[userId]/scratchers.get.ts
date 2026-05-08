export default defineEventHandler(async (event) => {
  const { userId } = getRouterParams(event)

  const settings = await getSettings()
  const today = new Date().toISOString().split('T')[0]
  const allTickets = await dbQuery(`USER#${userId}`, 'SCRATCH#') as Array<Record<string, unknown>>

  const todayTickets = allTickets.filter(t => t.createdDate === today)
  const paidToday = todayTickets.filter(t => !t.free)
  const freeToday = todayTickets.find(t => t.free === true)

  const jackpotsTotal = allTickets.filter(t => t.outcome === 'jackpot').length

  return {
    paidUsedToday: paidToday.length,
    dailyLimit: settings.scratcherDailyLimit,
    usedFreeToday: !!freeToday,
    paidTicketIds: paidToday.map(t => (t.SK as string).replace('SCRATCH#', '')),
    freeTicketId: freeToday ? (freeToday.SK as string).replace('SCRATCH#', '') : null,
    jackpotsTotal
  }
})
