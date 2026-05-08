export default defineEventHandler(async (event) => {
  const { userId } = getRouterParams(event)
  const { banned } = await readBody(event)

  const user = await dbGet(`USER#${userId}`, `USER#${userId}`)
  if (!user) throw createError({ statusCode: 404, message: 'User not found.' })

  await dbUpdate(`USER#${userId}`, `USER#${userId}`, { banned: Boolean(banned) })

  return { ok: true }
})
