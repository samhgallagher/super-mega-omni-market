export default defineEventHandler(async (event) => {
  const { userId } = getRouterParams(event)
  const { type } = await readBody(event) // 'paid' | 'free' | 'all'

  if (!['paid', 'free', 'all'].includes(type)) {
    throw createError({ statusCode: 400, message: 'type must be paid, free, or all.' })
  }

  const today = new Date().toISOString().split('T')[0]
  const allTickets = await dbQuery(`USER#${userId}`, 'SCRATCH#') as Array<Record<string, unknown>>
  const todayTickets = allTickets.filter(t => t.createdDate === today)

  const toReset = type === 'paid'
    ? todayTickets.filter(t => !t.free)
    : type === 'free'
      ? todayTickets.filter(t => t.free === true)
      : todayTickets

  await Promise.all(
    toReset.map(t => dbUpdate(`USER#${userId}`, t.SK as string, { createdDate: '1970-01-01' }))
  )

  return { ok: true, reset: toReset.length }
})
