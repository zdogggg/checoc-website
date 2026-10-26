import { and, desc, eq, gte, ilike, or, sql, type SQL } from 'drizzle-orm'
import { z } from 'zod'
import type { AdminCustomerListItem, LedgerEntryView, LoyaltyReason } from '#shared/types/customers'
import { pointsEarned, segmentFor, tierFor } from '#shared/utils/loyalty'

const { customers, customerAddresses, loyaltyLedger } = schema

type Db = ReturnType<typeof useDb>
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0]

// Find or create the customer for an order's phone number and remember the address.
// The latest name typed at checkout wins (people fix typos), unless it is empty.
export async function upsertCustomerForOrder(
  tx: Tx,
  input: { phone: string; name: string; city: string; district: string; address: string }
) {
  const now = new Date()
  const [customer] = await tx
    .insert(customers)
    .values({ phone: input.phone, name: input.name, lastOrderAt: now })
    .onConflictDoUpdate({
      target: customers.phone,
      set: { name: sql`coalesce(nullif(${input.name}, ''), ${customers.name})`, lastOrderAt: now },
    })
    .returning()

  await tx
    .insert(customerAddresses)
    .values({ customerId: customer!.id, city: input.city, district: input.district, address: input.address })
    .onConflictDoUpdate({
      target: [customerAddresses.customerId, customerAddresses.city, customerAddresses.district, customerAddresses.address],
      set: { lastUsedAt: now },
    })

  return customer!
}

// Change a balance and write the ledger line; refuses to go below zero
export async function adjustPoints(
  tx: Tx,
  customerId: number,
  delta: number,
  reason: LoyaltyReason,
  extra: { orderId?: number; userId?: number; note?: string } = {}
) {
  const [row] = await tx
    .update(customers)
    .set({ points: sql`${customers.points} + ${delta}` })
    .where(and(eq(customers.id, customerId), gte(sql`${customers.points} + ${delta}`, 0)))
    .returning({ points: customers.points })
  if (!row) {
    throw createError({ statusCode: 409, statusMessage: 'Conflict', message: 'Không đủ điểm để thực hiện' })
  }
  await tx.insert(loyaltyLedger).values({
    customerId,
    delta,
    balanceAfter: row.points,
    reason,
    orderId: extra.orderId ?? null,
    userId: extra.userId ?? null,
    note: extra.note ?? '',
  })
  return row.points
}

// Called inside the status-change transaction when an order is completed:
// grant points (at the tier the customer had when ordering), add to spend, re-tier
export async function applyOrderCompletion(
  tx: Tx,
  order: { id: number; customerId: number | null; total: number; subtotal: number; discount: number; pointsDiscount: number }
): Promise<number> {
  if (!order.customerId) return 0
  const [customer] = await tx.select().from(customers).where(eq(customers.id, order.customerId)).for('update')
  if (!customer) return 0

  const earned = pointsEarned(order.subtotal - order.discount - order.pointsDiscount, customer.tier)
  const totalSpent = customer.totalSpent + order.total
  await tx
    .update(customers)
    .set({ totalSpent, completedOrders: customer.completedOrders + 1, tier: tierFor(totalSpent) })
    .where(eq(customers.id, customer.id))

  if (earned > 0) {
    await adjustPoints(tx, customer.id, earned, 'order_earn', { orderId: order.id })
  }
  return earned
}

const REASON_NOTES: Record<LoyaltyReason, string> = {
  order_earn: 'Tích điểm đơn hàng',
  order_redeem: 'Dùng điểm cho đơn hàng',
  redeem_refund: 'Hoàn điểm do huỷ đơn',
  manual: 'Điều chỉnh',
}

export function toLedgerView(
  row: typeof loyaltyLedger.$inferSelect & { order?: { code: string } | null; user?: { name: string } | null },
  withStaff = false
): LedgerEntryView {
  return {
    id: row.id,
    delta: row.delta,
    balanceAfter: row.balanceAfter,
    reason: row.reason,
    orderCode: row.order?.code ?? null,
    note: row.note || REASON_NOTES[row.reason],
    ...(withStaff ? { by: row.user?.name ?? null } : {}),
    createdAt: row.createdAt.toISOString(),
  }
}

// SQL version of segmentFor() in shared/utils/loyalty.ts, for filtering lists
export function segmentCondition(segment: string) {
  const days = sql`extract(epoch from (now() - ${customers.lastOrderAt})) / 86400`
  const recent = sql`${customers.lastOrderAt} is not null and ${days} <= 30`
  switch (segment) {
    case 'lost':
      return sql`(${customers.lastOrderAt} is null or ${days} > 60)`
    case 'at_risk':
      return sql`(${days} > 30 and ${days} <= 60)`
    case 'loyal':
      return sql`(${recent} and ${customers.completedOrders} >= 3)`
    case 'regular':
      return sql`(${recent} and ${customers.completedOrders} = 2)`
    case 'new':
      return sql`(${recent} and ${customers.completedOrders} <= 1)`
    default:
      return undefined
  }
}

export const customerListQuery = z.object({
  q: z.string().trim().max(60).default(''),
  segment: z.enum(['all', 'new', 'loyal', 'regular', 'at_risk', 'lost']).default('all'),
  tier: z.enum(['all', 'member', 'silver', 'gold']).default('all'),
  // Customers whose birthday falls in the current month
  birthdayMonth: z.enum(['0', '1']).default('0'),
  sort: z.enum(['recent', 'spent', 'orders', 'points']).default('recent'),
  page: z.coerce.number().int().min(1).default(1),
})
export type CustomerListQuery = z.infer<typeof customerListQuery>

// WHERE conditions shared by the list and the CSV export
export function customerFilters(params: CustomerListQuery, includeSegment = true): SQL[] {
  const where: SQL[] = []
  if (params.q) {
    const like = `%${params.q}%`
    where.push(or(ilike(customers.phone, like), ilike(customers.name, like), ilike(customers.email, like))!)
  }
  if (params.tier !== 'all') where.push(eq(customers.tier, params.tier))
  if (params.birthdayMonth === '1') {
    where.push(sql`extract(month from ${customers.birthday}) = extract(month from (now() at time zone 'Asia/Ho_Chi_Minh'))`)
  }
  if (includeSegment && params.segment !== 'all') where.push(segmentCondition(params.segment)!)
  return where
}

export const CUSTOMER_SORT = {
  recent: [sql`${customers.lastOrderAt} desc nulls last`, desc(customers.id)],
  spent: [desc(customers.totalSpent), desc(customers.id)],
  orders: [desc(customers.completedOrders), desc(customers.id)],
  points: [desc(customers.points), desc(customers.id)],
} as const

export function toCustomerListItem(c: typeof customers.$inferSelect): AdminCustomerListItem {
  return {
    id: c.id,
    phone: c.phone,
    name: c.name,
    tier: c.tier,
    segment: segmentFor(c.completedOrders, c.lastOrderAt),
    points: c.points,
    totalSpent: c.totalSpent,
    completedOrders: c.completedOrders,
    lastOrderAt: c.lastOrderAt?.toISOString() ?? null,
    tags: c.tags,
  }
}
