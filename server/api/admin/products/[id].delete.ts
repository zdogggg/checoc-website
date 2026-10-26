import { and, eq, isNull, sql } from 'drizzle-orm'

// Soft delete; the slug gets a suffix so it can be reused by a new product
export default defineEventHandler(async (event) => {
  await requireStaff(event, CATALOG_EDITORS)
  const id = readId(event)
  const { products } = schema
  const now = new Date()
  const [row] = await useDb()
    .update(products)
    .set({ deletedAt: now, slug: sql`${products.slug} || '--deleted-' || ${now.getTime()}` })
    .where(and(eq(products.id, id), isNull(products.deletedAt)))
    .returning({ id: products.id })
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Product not found' })
  return { ok: true }
})
