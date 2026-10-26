import { count, eq, max } from 'drizzle-orm'

// Cheap endpoint polled by the admin layout: pending count for the badge,
// latest id so the browser can tell a new order arrived and play a sound
export default defineEventHandler(async (event) => {
  await requireStaff(event)
  const { orders } = schema
  const [[pending], [latest]] = await Promise.all([
    useDb().select({ n: count() }).from(orders).where(eq(orders.status, 'pending')),
    useDb().select({ id: max(orders.id) }).from(orders),
  ])
  return { pending: pending!.n, latestId: latest!.id ?? 0 }
})
