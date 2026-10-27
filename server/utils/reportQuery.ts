import type { H3Event } from 'h3'
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
