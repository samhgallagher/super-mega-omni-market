export default defineEventHandler(async (event) => {
  const { label } = await readBody(event)
  if (!label?.trim()) throw createError({ statusCode: 400, message: 'Label is required.' })

  const slug = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const existing = await dbGet('CATEGORIES', `CAT#${slug}`)
  if (existing) throw createError({ statusCode: 409, message: 'A category with that name already exists.' })

  await dbPut({ PK: 'CATEGORIES', SK: `CAT#${slug}`, label: label.trim() })

  return { slug, label: label.trim() }
})
