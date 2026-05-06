export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const { photo } = await readBody(event)

  const trimmed = photo?.trim() || null

  await dbUpdate(`USER#${session.user.userId}`, `USER#${session.user.userId}`, { photo: trimmed })

  await setUserSession(event, { user: { ...session.user, photo: trimmed } })

  return { ok: true }
})
