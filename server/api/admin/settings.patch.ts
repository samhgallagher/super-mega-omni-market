export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const current = await dbGet('SETTINGS', 'SETTINGS')

  const base = {
    communityMinLiquidity: (current?.communityMinLiquidity as number) ?? 100,
    communityFeePercent: (current?.communityFeePercent as number) ?? 2.5
  }

  if (body.communityMinLiquidity !== undefined) {
    const val = Number(body.communityMinLiquidity)
    if (isNaN(val) || val <= 0) throw createError({ statusCode: 400, message: 'Min liquidity must be a positive number.' })
    base.communityMinLiquidity = val
  }

  if (body.communityFeePercent !== undefined) {
    const val = Number(body.communityFeePercent)
    if (isNaN(val) || val < 0 || val > 100) throw createError({ statusCode: 400, message: 'Fee percent must be between 0 and 100.' })
    base.communityFeePercent = val
  }

  await dbPut({ PK: 'SETTINGS', SK: 'SETTINGS', ...base })

  return base
})
