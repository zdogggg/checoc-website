import { and, count, desc, eq, ilike, inArray, or, sql, type SQL } from 'drizzle-orm'
import { z } from 'zod'
import type { AdminOrderListItem } from '#shared/types/orders'
import type { OrderStatus } from '#shared/utils/orders'

const PAGE_SIZE = 30

const query = z.object({
  status: z.enum(['all', 'active', 'pending', 'confirmed', 'preparing', 'shipping', 'completed', 'cancelled']).default('active'),
  q: z.string().trim().max(60).default(''),
  // YYYY-MM-DD in shop time (Asia/Ho_Chi_Minh)
  day: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
})

const ACTIVE: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'shipping']

export default defineEventHandler(async (event) => {
  await requireStaff(event)
  const params = await getValidatedQuery(event, query.parse)
  const db = useDb()
  const { orders, orderItems } = schema

  const shopDay = sql`(${orders.createdAt} at time zone 'Asia/Ho_Chi_Minh')::date`
  const base: SQL[] = []
  if (params.q) {
    const like = `%${params.q}%`
    base.push(or(ilike(orders.code, like), ilike(orders.customerPhone, like), ilike(orders.customerName, like))!)
  }
  if (params.day) base.push(sql`${shopDay} = ${params.day}::date`)

  const where = [...base]
  if (params.status === 'active') where.push(inArray(orders.status, ACTIVE))
  else if (params.status !== 'all') where.push(eq(orders.status, params.status))

  const [rows, [totalRow], countRows] = await Promise.all([
    db
      .select()
      .from(orders)
      .where(and(...where))
      .orderBy(desc(orders.createdAt))
      .limit(PAGE_SIZE)
      .offset((params.page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(orders).where(and(...where)),
    // Tab counters ignore the status filter but respect search/day
    db
      .select({ status: orders.status, n: count() })
      .from(orders)
      .where(and(...base))
      .groupBy(orders.status),
  ])

  const items = rows.length
    ? await db
        .select({ orderId: orderItems.orderId, name: orderItems.productName, quantity: orderItems.quantity })
        .from(orderItems)
        .where(inArray(orderItems.orderId, rows.map((r) => r.id)))
    : []

  const list: AdminOrderListItem[] = rows.map((o) => {
    const mine = items.filter((i) => i.orderId === o.id)
    return {
      id: o.id,
      code: o.code,
      status: o.status,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      district: o.district,
      total: o.total,
      itemCount: mine.reduce((n, i) => n + i.quantity, 0),
      itemSummary: mine.map((i) => `${i.quantity}× ${i.name}`).join(', '),
      createdAt: o.createdAt.toISOString(),
    }
  })

  const counts = Object.fromEntries(countRows.map((r) => [r.status, r.n])) as Partial<Record<OrderStatus, number>>
  return { items: list, total: totalRow?.total ?? 0, page: params.page, pageSize: PAGE_SIZE, counts }
})
