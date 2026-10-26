import { and, count, desc, eq, gte, inArray, isNull, ne, sql, sum } from 'drizzle-orm'

// Revenue counts every order that was not cancelled, on the day it was placed (shop time)
export default defineEventHandler(async (event) => {
  await requireStaff(event)
  const db = useDb()
  const { products, categories, coupons, orders, orderItems } = schema

  const shopDay = sql<string>`to_char((${orders.createdAt} at time zone 'Asia/Ho_Chi_Minh')::date, 'YYYY-MM-DD')`
  const today = sql`(now() at time zone 'Asia/Ho_Chi_Minh')::date`
  const isToday = sql`(${orders.createdAt} at time zone 'Asia/Ho_Chi_Minh')::date = ${today}`
  const weekStart = sql`((${today} - 6)::timestamp at time zone 'Asia/Ho_Chi_Minh')`
  const notCancelled = ne(orders.status, 'cancelled')

  const [[catalog], [unavailable], [cats], [activeCoupons], [todayRow], [active], [pending], daily, top] =
    await Promise.all([
      db.select({ n: count() }).from(products).where(isNull(products.deletedAt)),
      db
        .select({ n: count() })
        .from(products)
        .where(and(isNull(products.deletedAt), eq(products.isAvailable, false))),
      db.select({ n: count() }).from(categories),
      db
      .select({ n: count() })
      .from(coupons)
      .where(and(eq(coupons.isActive, true), isNull(coupons.customerId))),
      db
        .select({ orders: count(), revenue: sum(orders.total).mapWith(Number) })
        .from(orders)
        .where(and(isToday, notCancelled)),
      db
        .select({ n: count() })
        .from(orders)
        .where(inArray(orders.status, ['pending', 'confirmed', 'preparing', 'shipping'])),
      db.select({ n: count() }).from(orders).where(eq(orders.status, 'pending')),
      db
        .select({ day: shopDay, orders: count(), revenue: sum(orders.total).mapWith(Number) })
        .from(orders)
        .where(and(gte(orders.createdAt, weekStart), notCancelled))
        .groupBy(shopDay)
        .orderBy(shopDay),
      db
        .select({ name: orderItems.productName, quantity: sum(orderItems.quantity).mapWith(Number) })
        .from(orderItems)
        .innerJoin(orders, eq(orders.id, orderItems.orderId))
        .where(and(gte(orders.createdAt, weekStart), notCancelled))
        .groupBy(orderItems.productName)
        .orderBy(desc(sum(orderItems.quantity)))
        .limit(5),
    ])

  return {
    products: catalog!.n,
    unavailableProducts: unavailable!.n,
    categories: cats!.n,
    activeCoupons: activeCoupons!.n,
    todayOrders: todayRow!.orders,
    todayRevenue: todayRow!.revenue ?? 0,
    activeOrders: active!.n,
    pendingOrders: pending!.n,
    last7Days: daily,
    topProducts: top,
  }
})
