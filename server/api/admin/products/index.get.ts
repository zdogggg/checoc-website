import { asc, isNull } from 'drizzle-orm'

// Admin list: includes unavailable products and products in hidden categories
export default defineEventHandler(async (event) => {
  await requireStaff(event)
  const db = useDb()
  const [rows, costs] = await Promise.all([
    db.query.products.findMany({
      where: isNull(schema.products.deletedAt),
      with: { category: true, images: true },
      orderBy: [asc(schema.products.sortOrder), asc(schema.products.id)],
    }),
    productRecipeCosts(db),
  ])
  // recipeCost: one serving at current average ingredient costs (null = no recipe yet)
  return rows.map((r) => ({ ...toAdminProductDto(r), recipeCost: costs.get(r.id)?.cost ?? null }))
})
