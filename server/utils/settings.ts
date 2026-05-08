export async function getSettings() {
  const item = await dbGet('SETTINGS', 'SETTINGS')
  return {
    communityMinLiquidity: (item?.communityMinLiquidity as number) ?? 100,
    communityFeePercent: (item?.communityFeePercent as number) ?? 2.5,
    scratcherDailyLimit: (item?.scratcherDailyLimit as number) ?? 3,
    scratcherWinOdds: (item?.scratcherWinOdds as number) ?? 0.30,
    scratcherJackpotOdds: (item?.scratcherJackpotOdds as number) ?? 0.002,
    scratcherWinMultiplier: (item?.scratcherWinMultiplier as number) ?? 3,
    scratcherJackpotMultiplier: (item?.scratcherJackpotMultiplier as number) ?? 100
  }
}
