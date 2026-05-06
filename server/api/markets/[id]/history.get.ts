export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)

  const items = await dbQuery(`MARKET#${id}`, 'HIST#')

  return items.slice(-100).map(item => ({
    timestamp: parseInt((item.SK as string).replace('HIST#', '')),
    outcomes: item.outcomes as Array<{ id: string, label: string, price: number }>
  }))
})
