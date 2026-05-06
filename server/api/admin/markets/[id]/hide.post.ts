export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  const { hidden } = await readBody(event)

  const market = await dbGet(`MARKET#${id}`, `MARKET#${id}`)
  if (!market) throw createError({ statusCode: 404, message: 'Market not found.' })

  await dbUpdate(`MARKET#${id}`, `MARKET#${id}`, { hidden: !!hidden })
  return { ok: true }
})
