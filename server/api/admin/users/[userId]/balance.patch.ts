export default defineEventHandler(async (event) => {
  const { userId } = getRouterParams(event)
  const { balance } = await readBody(event)

  const val = Number(balance)
  if (isNaN(val) || val < 0) {
    throw createError({ statusCode: 400, message: 'Balance must be a non-negative number.' })
  }

  const user = await dbGet(`USER#${userId}`, `USER#${userId}`)
  if (!user) throw createError({ statusCode: 404, message: 'User not found.' })

  const rounded = Math.round(val * 100) / 100
  await dbUpdate(`USER#${userId}`, `USER#${userId}`, { balance: rounded })

  return { balance: rounded }
})
