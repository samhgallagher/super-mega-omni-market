import { compare } from 'bcryptjs'

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event)

  if (!email || !password) {
    throw createError({ statusCode: 400, message: 'Email and password are required.' })
  }

  const normalized = email.toLowerCase().trim()

  const emailRecord = await dbGet(`EMAIL#${normalized}`, `EMAIL#${normalized}`)
  if (!emailRecord) {
    throw createError({ statusCode: 401, message: 'Invalid email or password.' })
  }

  const user = await dbGet(`USER#${emailRecord.userId}`, `USER#${emailRecord.userId}`)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Invalid email or password.' })
  }

  const valid = await compare(password, user.passwordHash as string)
  if (!valid) {
    throw createError({ statusCode: 401, message: 'Invalid email or password.' })
  }

  if (user.banned) {
    throw createError({ statusCode: 403, message: 'Your account has been banned.' })
  }

  await setUserSession(event, {
    user: {
      userId: emailRecord.userId as string,
      email: normalized,
      username: user.username as string,
      photo: (user.photo as string) || null,
      balance: user.balance as number,
      isAdmin: isAdminEmail(normalized),
      mustChangePassword: (user.mustChangePassword as boolean) ?? false
    }
  })

  return { userId: emailRecord.userId, email: normalized, balance: user.balance }
})
