import { and } from 'drizzle-orm'
import { SEGMENT_LABELS, segmentFor, TIER_LABELS } from '#shared/utils/loyalty'

// CSV of the filtered customer list, e.g. to message a segment on Zalo
export default defineEventHandler(async (event) => {
  await requireStaff(event, CATALOG_EDITORS)
  const params = await getValidatedQuery(event, customerListQuery.parse)
  const rows = await useDb()
    .select()
    .from(schema.customers)
    .where(and(...customerFilters(params)))
    .orderBy(...CUSTOMER_SORT[params.sort])
    .limit(20_000)

  const cell = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [
    ['Số điện thoại', 'Tên', 'Email', 'Sinh nhật', 'Hạng', 'Phân khúc', 'Điểm', 'Đơn hoàn tất', 'Tổng chi tiêu', 'Đơn gần nhất', 'Nhãn'],
    ...rows.map((c) => [
      c.phone,
      c.name,
      c.email,
      c.birthday,
      TIER_LABELS[c.tier],
      SEGMENT_LABELS[segmentFor(c.completedOrders, c.lastOrderAt)],
      c.points,
      c.completedOrders,
      c.totalSpent,
      c.lastOrderAt?.toISOString().slice(0, 10),
      c.tags.join('; '),
    ]),
  ]

  setResponseHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setResponseHeader(event, 'Content-Disposition', `attachment; filename="khach-hang-${new Date().toISOString().slice(0, 10)}.csv"`)
  // BOM so Excel opens the Vietnamese text correctly
  return '﻿' + lines.map((l) => l.map(cell).join(',')).join('\r\n')
})
