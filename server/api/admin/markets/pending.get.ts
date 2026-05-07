export default defineEventHandler(async () => {
  const items = await dbQueryGSI('GSI1', 'PENDING_COMMUNITY', 'GSI1PK') as Array<Record<string, unknown>>

  return items
    .sort((a, b) => (a.createdAt as number) - (b.createdAt as number))
    .map(market => ({
      id: (market.PK as string).replace('MARKET#', ''),
      title: market.title as string,
      description: (market.description as string) ?? null,
      photo: (market.photo as string) ?? null,
      expiresAt: (market.expiresAt as number) ?? null,
      creatorId: market.creatorId as string,
      creatorUsername: market.creatorUsername as string,
      creatorPhoto: (market.creatorPhoto as string) ?? null,
      liquidityStaked: market.liquidityStaked as number,
      feePercent: market.feePercent as number,
      outcomes: (market.outcomes as Array<{ label: string }>).map(o => o.label),
      createdAt: market.createdAt as number
    }))
})
