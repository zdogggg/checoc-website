import { asc, eq } from 'drizzle-orm'

// Cached (see server/utils/menuCache.ts)
export default defineCachedEventHandler(async () => {
  const rows = await useDb()
    .select()
    .from(schema.categories)
    .where(eq(schema.categories.isActive, true))
    .orderBy(asc(schema.categories.sortOrder), asc(schema.categories.id))
  return rows.map(toCategoryDto)
}, menuCacheOptions('categories'))
