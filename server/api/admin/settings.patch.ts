export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const current = await dbGet('SETTINGS', 'SETTINGS')

  const base = {
    communityMinLiquidity: (current?.communityMinLiquidity as number) ?? 100,
    communityFeePercent: (current?.communityFeePercent as number) ?? 2.5,
    scratcherDailyLimit: (current?.scratcherDailyLimit as number) ?? 3,
    scratcherWinOdds: (current?.scratcherWinOdds as number) ?? 0.30,
    scratcherJackpotOdds: (current?.scratcherJackpotOdds as number) ?? 0.002,
    scratcherWinMultiplier: (current?.scratcherWinMultiplier as number) ?? 3,
    scratcherJackpotMultiplier: (current?.scratcherJackpotMultiplier as number) ?? 100
  }

  const numericFields: Array<[keyof typeof base, number, number]> = [
    ['communityMinLiquidity', 1, Infinity],
    ['communityFeePercent', 0, 100],
    ['scratcherDailyLimit', 1, 100],
    ['scratcherWinOdds', 0, 1],
    ['scratcherJackpotOdds', 0, 1],
    ['scratcherWinMultiplier', 0, Infinity],
    ['scratcherJackpotMultiplier', 0, Infinity]
  ]

  for (const [field, min, max] of numericFields) {
    if (body[field] !== undefined) {
      const val = Number(body[field])
      if (isNaN(val) || val < min || val > max) {
        throw createError({ statusCode: 400, message: `Invalid value for ${field}.` })
      }
      base[field] = val as never
    }
  }

  await dbPut({ PK: 'SETTINGS', SK: 'SETTINGS', ...base })

  return base
})
