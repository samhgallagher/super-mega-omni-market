export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) return []

  const { id } = getRouterParams(event)
  const positions = await dbQuery(`USER#${session.user.userId}`, `POS#MARKET#${id}#`)

  return positions
    .filter(p => (p.shares as number) > 0)
    .map(p => ({
      outcomeId: p.outcomeId as string,
      shares: p.shares as number
    }))
})
