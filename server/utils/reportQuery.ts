import type { H3Event } from 'h3'
import { sql, type AnyColumn, type SQL } from 'drizzle-orm'
import { z } from 'zod'
import { isIsoDay, MAX_RANGE_DAYS, rangeDays } from '#shared/utils/reports'

const day = z.string().refine(isIsoDay, 'Ngày không hợp lệ')

const rangeQuery = z
  .object({ from: day, to: day })
  .refine((r) => r.from <= r.to, 'Ngày bắt đầu phải trước ngày kết thúc')
  .refine((r) => rangeDays(r.from, r.to) <= MAX_RANGE_DAYS, `Khoảng thời gian tối đa ${MAX_RANGE_DAYS} ngày`)

// ?from=YYYY-MM-DD&to=YYYY-MM-DD (shop days); defaults to the last 7 days
export async function readReportRange(event: H3Event) {
  const q = getQuery(event)
  const today = shopToday()
  const result = rangeQuery.safeParse({
    from: q.from ?? new Date(Date.parse(`${today}T00:00:00Z`) - 6 * 86_400_000).toISOString().slice(0, 10),
    to: q.to ?? today,
  })
  if (!result.success) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', message: result.error.issues[0]!.message })
  }
  return result.data
}

// Shop days and months as timestamp bounds on the raw column, so PostgreSQL can use the index
// on created_at instead of computing the shop date of every row.
// [from 00:00, to + 1 day 00:00) in shop time; from/to are YYYY-MM-DD
export function createdBetween(column: AnyColumn, from: string, to: string): SQL {
  return sql`${column} >= (${from}::date)::timestamp at time zone 'Asia/Ho_Chi_Minh'
    and ${column} < (${to}::date + 1)::timestamp at time zone 'Asia/Ho_Chi_Minh'`
}

// The whole shop month (YYYY-MM)
export function createdInMonth(column: AnyColumn, month: string): SQL {
  return sql`${column} >= (${month + '-01'}::date)::timestamp at time zone 'Asia/Ho_Chi_Minh'
    and ${column} < ((${month + '-01'}::date + interval '1 month')::date)::timestamp at time zone 'Asia/Ho_Chi_Minh'`
}

// Revenue of order lines after the order's coupon and points, shared out over its lines in
// proportion to their price, so the per-dish and per-category figures add up to the revenue KPI
export function lineRevenueSum(): SQL<number> {
  const { orders, orderItems } = schema
  return sql<number>`coalesce(round(sum(${orderItems.lineTotal}::numeric * (${orders.subtotal} - ${orders.discount} - ${orders.pointsDiscount}) / nullif(${orders.subtotal}, 0))), 0)`.mapWith(
    Number
  )
}
