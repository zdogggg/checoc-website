import { and, count, countDistinct, desc, eq, sql, sum } from 'drizzle-orm'
import type { ReportKpis, SalesReport } from '#shared/types/reports'
import { eachDay, previousRange } from '#shared/utils/reports'

// Every figure here is about orders *placed* in the range (shop time). Money figures
// only count completed orders, matching the monthly P&L.

const { orders, orderItems, products, categories, customers } = schema

const shopDay = sql`(${orders.createdAt} at time zone 'Asia/Ho_Chi_Minh')::date`
const inRange = (from: string, to: string) => sql`${shopDay} between ${from}::date and ${to}::date`
const completed = eq(orders.status, 'completed')
const goods = sql`${orders.subtotal} - ${orders.discount} - ${orders.pointsDiscount}`

async function kpis(from: string, to: string): Promise<ReportKpis> {
  const db = useDb()
  const range = inRange(from, to)

  const [[money], [placed], [cancelled], [noCost], [cust]] = await Promise.all([
    db
      .select({
        revenue: sum(goods).mapWith(Number),
        orders: count(),
        cogs: sum(orders.cogs).mapWith(Number),
        fees: sum(orders.platformFee).mapWith(Number),
        discounts: sum(sql`${orders.discount} + ${orders.pointsDiscount}`).mapWith(Number),
        shipping: sum(orders.shippingFee).mapWith(Number),
      })
      .from(orders)
      .where(and(range, completed)),
    db.select({ n: count() }).from(orders).where(range),
    db.select({ n: count() }).from(orders).where(and(range, eq(orders.status, 'cancelled'))),
    db.select({ n: count() }).from(orders).where(and(range, completed, eq(orders.cogs, 0))),
    // New = the customer's first non-cancelled order ever falls inside the range
    db.execute<{ new_customers: number; returning_customers: number }>(sql`
      with buyers as (
        select distinct ${orders.customerId} as id from ${orders}
        where ${range} and ${completed} and ${orders.customerId} is not null
      ),
      firsts as (
        select o.customer_id as id, min((o.created_at at time zone 'Asia/Ho_Chi_Minh')::date) as first_day
        from orders o
        where o.status <> 'cancelled' and o.customer_id in (select id from buyers)
        group by o.customer_id
      )
      select
        count(*) filter (where first_day >= ${from}::date)::int as new_customers,
        count(*) filter (where first_day < ${from}::date)::int as returning_customers
      from firsts
    `),
  ])

  const revenue = money?.revenue ?? 0
  const completedOrders = money?.orders ?? 0
  const cogs = money?.cogs ?? 0
  const custRow = cust ?? { new_customers: 0, returning_customers: 0 }
  return {
    revenue,
    completedOrders,
    placedOrders: placed?.n ?? 0,
    cancelledOrders: cancelled?.n ?? 0,
    avgOrderValue: completedOrders ? Math.round(revenue / completedOrders) : 0,
    cogs,
    grossProfit: revenue - cogs,
    platformFees: money?.fees ?? 0,
    discounts: money?.discounts ?? 0,
    shippingCollected: money?.shipping ?? 0,
    newCustomers: custRow.new_customers ?? 0,
    returningCustomers: custRow.returning_customers ?? 0,
    ordersWithoutCost: noCost?.n ?? 0,
  }
}

export async function salesReport(from: string, to: string): Promise<SalesReport> {
  const db = useDb()
  const prev = previousRange(from, to)
  const range = and(inRange(from, to), completed)
  const hour = sql<number>`extract(hour from ${orders.createdAt} at time zone 'Asia/Ho_Chi_Minh')::int`
  const dayStr = sql<string>`to_char(${shopDay}, 'YYYY-MM-DD')`

  const [current, previous, dailyRows, hourlyRows, topProducts, cats, payments, topCustomers, channels] = await Promise.all([
    kpis(from, to),
    kpis(prev.from, prev.to),
    db
      .select({ day: dayStr, revenue: sum(goods).mapWith(Number), orders: count() })
      .from(orders)
      .where(range)
      .groupBy(dayStr),
    db
      .select({ hour, orders: count(), revenue: sum(goods).mapWith(Number) })
      .from(orders)
      .where(range)
      .groupBy(hour),
    db
      .select({
        name: orderItems.productName,
        quantity: sum(orderItems.quantity).mapWith(Number),
        revenue: sum(orderItems.lineTotal).mapWith(Number),
        cost: sum(orderItems.costTotal).mapWith(Number),
      })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .where(range)
      .groupBy(orderItems.productName)
      .orderBy(desc(sum(orderItems.quantity)))
      .limit(10),
    db
      .select({
        name: sql<string>`coalesce(${categories.name}, 'Món đã xoá')`,
        quantity: sum(orderItems.quantity).mapWith(Number),
        revenue: sum(orderItems.lineTotal).mapWith(Number),
      })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .leftJoin(products, eq(products.id, orderItems.productId))
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .where(range)
      .groupBy(categories.name)
      .orderBy(desc(sum(orderItems.lineTotal))),
    db
      .select({ method: orders.paymentMethod, orders: count(), revenue: sum(goods).mapWith(Number) })
      .from(orders)
      .where(range)
      .groupBy(orders.paymentMethod),
    db
      .select({
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
        orders: countDistinct(orders.id),
        revenue: sum(goods).mapWith(Number),
      })
      .from(orders)
      .innerJoin(customers, eq(customers.id, orders.customerId))
      .where(range)
      .groupBy(customers.id)
      .orderBy(desc(sum(goods)))
      .limit(5),
    db
      .select({
        channel: orders.channel,
        orders: count(),
        revenue: sum(goods).mapWith(Number),
        cogs: sum(orders.cogs).mapWith(Number),
        fees: sum(orders.platformFee).mapWith(Number),
      })
      .from(orders)
      .where(range)
      .groupBy(orders.channel)
      .orderBy(desc(sum(goods))),
  ])

  // Fill days and hours without orders so charts have a continuous axis
  const byDay = new Map(dailyRows.map((r) => [r.day, r]))
  const byHour = new Map(hourlyRows.map((r) => [r.hour, r]))
  return {
    range: { from, to },
    previousRange: prev,
    kpis: current,
    previous,
    daily: eachDay(from, to).map((day) => ({ day, revenue: byDay.get(day)?.revenue ?? 0, orders: byDay.get(day)?.orders ?? 0 })),
    hourly: Array.from({ length: 24 }, (_, h) => ({ hour: h, orders: byHour.get(h)?.orders ?? 0, revenue: byHour.get(h)?.revenue ?? 0 })),
    topProducts,
    categories: cats,
    payments,
    topCustomers,
    channels,
  }
}

export const shopToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date())
