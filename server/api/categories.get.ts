import { asc, eq } from 'drizzle-orm'

export default defineEventHandler(async () => {
  const rows = await useDb()
    .select()
    .from(schema.categories)
    .where(eq(schema.categories.isActive, true))
    .orderBy(asc(schema.categories.sortOrder), asc(schema.categories.id))
  return rows.map(toCategoryDto)
})
