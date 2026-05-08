export default defineEventHandler(async () => {
  const items = await dbQueryGSI('GSI1', 'USERS', 'GSI1PK') as Array<Record<string, unknown>>

  return items
    .sort((a, b) => (a.createdAt as number) - (b.createdAt as number))
    .map(user => ({
      userId: (user.PK as string).replace('USER#', ''),
      username: user.username as string,
      email: user.email as string,
      photo: (user.photo as string) ?? null,
      balance: user.balance as number,
      banned: (user.banned as boolean) ?? false,
      mustChangePassword: (user.mustChangePassword as boolean) ?? false,
      createdAt: user.createdAt as number
    }))
})
