export async function getSettings() {
  const item = await dbGet('SETTINGS', 'SETTINGS')
  return {
    communityMinLiquidity: (item?.communityMinLiquidity as number) ?? 100,
    communityFeePercent: (item?.communityFeePercent as number) ?? 2.5
  }
}
