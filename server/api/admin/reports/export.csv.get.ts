import { and, asc, desc, eq, sql, sum } from 'drizzle-orm'
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from '#shared/utils/orders'

// ?kind=orders (one row per order) | products (one row per product, completed orders)
export default defineEventHandler(async (event) => {
  await requireStaff(event, CATALOG_EDITORS)
  const { from, to } = await readReportRange(event)
  const kind = getQuery(event).kind === 'products' ? 'products' : 'orders'
  const db = useDb()
  const { orders, orderItems } = schema
  const shopDay = sql`(${orders.createdAt} at time zone 'Asia/Ho_Chi_Minh')::date`
  const range = sql`${shopDay} between ${from}::date and ${to}::date`

  let lines: unknown[][]
  if (kind === 'orders') {
    const rows = await db
      .select({
        code: orders.code,
        createdAt: sql<string>`to_char(${orders.createdAt} at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD HH24:MI')`,
        status: orders.status,
        customerName: orders.customerName,
        customerPhone: orders.customerPhone,
        district: orders.district,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
        subtotal: orders.subtotal,
        discount: orders.discount,
        pointsDiscount: orders.pointsDiscount,
        shippingFee: orders.shippingFee,
        total: orders.total,
        cogs: orders.cogs,
        couponCode: orders.couponCode,
      })
      .from(orders)
      .where(range)
      .orderBy(asc(orders.createdAt))
    lines = [
      ['Mã đơn', 'Thời gian', 'Trạng thái', 'Khách', 'SĐT', 'Quận', 'Thanh toán', 'TT thanh toán', 'Tạm tính', 'Giảm mã', 'Giảm điểm', 'Phí ship', 'Tổng thu', 'Giá vốn', 'Mã giảm giá'],
      ...rows.map((r) => [
        r.code,
        r.createdAt,
        ORDER_STATUS_LABELS[r.status],
        r.customerName,
        r.customerPhone,
        r.district,
        PAYMENT_METHOD_LABELS[r.paymentMethod],
        PAYMENT_STATUS_LABELS[r.paymentStatus],
        r.subtotal,
        r.discount,
        r.pointsDiscount,
        r.shippingFee,
        r.total,
        r.cogs,
        r.couponCode,
      ]),
    ]
  } else {
    const rows = await db
      .select({
        name: orderItems.productName,
        quantity: sum(orderItems.quantity).mapWith(Number),
        revenue: sum(orderItems.lineTotal).mapWith(Number),
        cost: sum(orderItems.costTotal).mapWith(Number),
      })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .where(and(range, eq(orders.status, 'completed')))
      .groupBy(orderItems.productName)
      .orderBy(desc(sum(orderItems.lineTotal)))
    lines = [
      ['Món', 'Số lượng', 'Doanh thu (trước giảm giá)', 'Giá vốn', 'Lãi gộp'],
      ...rows.map((r) => [r.name, r.quantity, r.revenue, r.cost, r.revenue - r.cost]),
    ]
  }

  const cell = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  setResponseHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setResponseHeader(event, 'Content-Disposition', `attachment; filename="${kind === 'orders' ? 'don-hang' : 'mon-ban'}-${from}_${to}.csv"`)
  return '﻿' + lines.map((l) => l.map(cell).join(',')).join('\r\n')
})
