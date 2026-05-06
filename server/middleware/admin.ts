export default defineEventHandler(async (event) => {
  if (!getRequestURL(event).pathname.startsWith('/api/admin')) return
  const session = await getUserSession(event)
  if (!session?.user?.isAdmin) {
    throw createError({ statusCode: 403, message: 'Forbidden.' })
  }
})
