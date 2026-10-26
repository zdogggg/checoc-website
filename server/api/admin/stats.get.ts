import { and, count, eq, isNull } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireStaff(event)
  const db = useDb()
  const { products, categories, coupons } = schema
  const [[all], [unavailable], [cats], [activeCoupons]] = await Promise.all([
    db.select({ n: count() }).from(products).where(isNull(products.deletedAt)),
    db
      .select({ n: count() })
      .from(products)
      .where(and(isNull(products.deletedAt), eq(products.isAvailable, false))),
    db.select({ n: count() }).from(categories),
    db.select({ n: count() }).from(coupons).where(eq(coupons.isActive, true)),
  ])
  return {
    products: all!.n,
    unavailableProducts: unavailable!.n,
    categories: cats!.n,
    activeCoupons: activeCoupons!.n,
  }
})
