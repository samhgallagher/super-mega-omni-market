export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  const items = await dbQueryGSI('GSI1', 'USERS', 'GSI1PK') as Array<Record<string, unknown>>

  const sorted = items
    .filter(u => !u.banned)
    .sort((a, b) => (b.balance as number) - (a.balance as number))
    .slice(0, 50)

  return sorted.map((user, i) => ({
    rank: i + 1,
    userId: (user.PK as string).replace('USER#', ''),
    username: user.username as string,
    photo: (user.photo as string) ?? null,
    balance: user.balance as number,
    isCurrentUser: session?.user?.userId === (user.PK as string).replace('USER#', '')
  }))
})
