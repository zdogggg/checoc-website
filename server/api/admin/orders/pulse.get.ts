import { and, count, eq, lte, max } from 'drizzle-orm'

// Cheap endpoint polled by the admin layout: pending count for the badge,
// latest id so the browser can tell a new order arrived and play a sound
export default defineEventHandler(async (event) => {
  await requireStaff(event)
  const { orders } = schema
  const { ingredients } = schema
  const [[pending], [latest], [low]] = await Promise.all([
    useDb().select({ n: count() }).from(orders).where(eq(orders.status, 'pending')),
    useDb().select({ id: max(orders.id) }).from(orders),
    // Ingredients at or below their minimum (badge on "Kho nguyên liệu")
    useDb()
      .select({ n: count() })
      .from(ingredients)
      .where(and(eq(ingredients.isActive, true), lte(ingredients.stock, ingredients.minStock))),
  ])
  return { pending: pending!.n, latestId: latest!.id ?? 0, lowStock: low!.n }
})
