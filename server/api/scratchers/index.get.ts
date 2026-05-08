export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const settings = await getSettings()

  if (!session?.user) {
    return { ticketsToday: 0, settings, unscratched: [] }
  }

  const today = new Date().toISOString().split('T')[0]
  const allTickets = await dbQuery(`USER#${session.user.userId}`, 'SCRATCH#') as Array<Record<string, unknown>>

  const ticketsToday = allTickets.filter(t => t.createdDate === today).length
  const unscratched = allTickets
    .filter(t => !t.scratched)
    .sort((a, b) => (b.createdAt as number) - (a.createdAt as number))
    .map(t => ({
      id: (t.SK as string).replace('SCRATCH#', ''),
      tier: t.tier as number,
      symbols: t.symbols as [string, string, string],
      createdAt: t.createdAt as number
    }))

  return { ticketsToday, settings, unscratched }
})
