import { asc, isNull } from 'drizzle-orm'

// Admin list: includes unavailable products and products in hidden categories
export default defineEventHandler(async (event) => {
  await requireStaff(event)
  const rows = await useDb().query.products.findMany({
    where: isNull(schema.products.deletedAt),
    with: { category: true, images: true },
    orderBy: [asc(schema.products.sortOrder), asc(schema.products.id)],
  })
  return rows.map(toAdminProductDto)
})
