import { hash } from 'bcryptjs'

export default defineEventHandler(async (event) => {
  const { email, username, password, photo } = await readBody(event)

  if (!email || !username || !password) {
    throw createError({ statusCode: 400, message: 'Email, username, and password are required.' })
  }

  const trimmedUsername = username.trim()
  if (trimmedUsername.length < 2 || trimmedUsername.length > 30) {
    throw createError({ statusCode: 400, message: 'Username must be between 2 and 30 characters.' })
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
    throw createError({ statusCode: 400, message: 'Username may only contain letters, numbers, hyphens, and underscores.' })
  }

  const normalized = email.toLowerCase().trim()
  const usernameLower = trimmedUsername.toLowerCase()

  const [existingEmail, existingUsername] = await Promise.all([
    dbGet(`EMAIL#${normalized}`, `EMAIL#${normalized}`),
    dbGet(`USERNAME#${usernameLower}`, `USERNAME#${usernameLower}`)
  ])

  if (existingEmail) throw createError({ statusCode: 409, message: 'An account with that email already exists.' })
  if (existingUsername) throw createError({ statusCode: 409, message: 'That username is already taken.' })

  const userId = crypto.randomUUID()
  const passwordHash = await hash(password, 12)
  const now = Date.now()

  await Promise.all([
    dbPut({
      PK: `USER#${userId}`,
      SK: `USER#${userId}`,
      email: normalized,
      username: trimmedUsername,
      photo: photo?.trim() || undefined,
      passwordHash,
      balance: 10000,
      createdAt: now,
      GSI1PK: 'USERS',
      GSI1SK: `USER#${userId}`
    }),
    dbPut({ PK: `EMAIL#${normalized}`, SK: `EMAIL#${normalized}`, userId }),
    dbPut({ PK: `USERNAME#${usernameLower}`, SK: `USERNAME#${usernameLower}`, userId })
  ])

  await setUserSession(event, {
    user: { userId, email: normalized, username: trimmedUsername, photo: photo?.trim() || null, balance: 10000, isAdmin: isAdminEmail(normalized) }
  })

  return { userId, email: normalized, username: trimmedUsername, balance: 10000 }
})
