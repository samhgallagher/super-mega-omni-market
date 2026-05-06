export default defineEventHandler(async () => {
  const items = await dbQuery('CATEGORIES')
  return items.map(item => ({
    slug: (item.SK as string).replace('CAT#', ''),
    label: item.label as string
  }))
})
