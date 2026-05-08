import { hash } from 'bcryptjs'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const { password } = await readBody(event)

  if (!password || password.length < 8) {
    throw createError({ statusCode: 400, message: 'Password must be at least 8 characters.' })
  }

  const passwordHash = await hash(password, 12)

  await dbUpdate(`USER#${session.user.userId}`, `USER#${session.user.userId}`, {
    passwordHash,
    mustChangePassword: false
  })

  await setUserSession(event, {
    user: { ...session.user, mustChangePassword: false }
  })

  return { ok: true }
})
