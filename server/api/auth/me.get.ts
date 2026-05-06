export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  const user = await dbGet(`USER#${session.user.userId}`, `USER#${session.user.userId}`)
  if (!user) throw createError({ statusCode: 404, message: 'User not found.' })

  const updated = {
    ...session.user,
    username: user.username as string,
    photo: (user.photo as string) || null,
    balance: user.balance as number
  }

  await setUserSession(event, { user: updated })
  return updated
})
