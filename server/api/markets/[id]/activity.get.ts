export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)

  const items = await dbQuery(`MARKET#${id}`, 'ACT#')

  return items
    .reverse()
    .slice(0, 50)
    .map(item => ({
      timestamp: parseInt((item.SK as string).split('#')[1]),
      userId: item.userId as string,
      username: item.username as string,
      photo: (item.photo as string) ?? null,
      outcomeLabel: item.outcomeLabel as string,
      shares: item.shares as number,
      type: item.type as 'buy' | 'sell'
    }))
})
