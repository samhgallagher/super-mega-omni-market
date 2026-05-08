import { hash } from 'bcryptjs'

export default defineEventHandler(async (event) => {
  const { userId } = getRouterParams(event)
  const { password } = await readBody(event)

  if (!password || password.length < 6) {
    throw createError({ statusCode: 400, message: 'Password must be at least 6 characters.' })
  }

  const user = await dbGet(`USER#${userId}`, `USER#${userId}`)
  if (!user) throw createError({ statusCode: 404, message: 'User not found.' })

  const passwordHash = await hash(password, 12)

  await dbUpdate(`USER#${userId}`, `USER#${userId}`, {
    passwordHash,
    mustChangePassword: true
  })

  return { ok: true }
})
