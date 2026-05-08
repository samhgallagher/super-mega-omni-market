export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  const user = await dbGet(`USER#${session.user.userId}`, `USER#${session.user.userId}`)
  if (!user) throw createError({ statusCode: 404, message: 'User not found.' })

  if (user.banned) {
    await clearUserSession(event)
    throw createError({ statusCode: 403, message: 'Your account has been banned.' })
  }

  const updated = {
    ...session.user,
    username: user.username as string,
    photo: (user.photo as string) || null,
    balance: user.balance as number,
    mustChangePassword: (user.mustChangePassword as boolean) ?? false
  }

  await setUserSession(event, { user: updated })
  return updated
})
