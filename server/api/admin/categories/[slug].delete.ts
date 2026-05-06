export default defineEventHandler(async (event) => {
  const { slug } = getRouterParams(event)
  await dbDelete('CATEGORIES', `CAT#${slug}`)
  return { ok: true }
})
