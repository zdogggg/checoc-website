import { and, asc, desc, eq, sql, sum } from 'drizzle-orm'
import { CHANNEL_LABELS, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from '#shared/utils/orders'

// ?kind=orders (one row per order) | products (one row per product, completed orders)
export default defineEventHandler(async (event) => {
  await requireStaff(event, CATALOG_EDITORS)
  const { from, to } = await readReportRange(event)
  const kind = getQuery(event).kind === 'products' ? 'products' : 'orders'
  const db = useDb()
  const { orders, orderItems } = schema
  const range = createdBetween(orders.createdAt, from, to)

  let lines: unknown[][]
  if (kind === 'orders') {
    const rows = await db
      .select({
        code: orders.code,
        createdAt: sql<string>`to_char(${orders.createdAt} at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD HH24:MI')`,
        status: orders.status,
        channel: orders.channel,
        externalCode: orders.externalCode,
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
        platformFee: orders.platformFee,
        couponCode: orders.couponCode,
      })
      .from(orders)
      .where(range)
      .orderBy(asc(orders.createdAt))
    lines = [
      ['Mã đơn', 'Kênh', 'Mã trên app', 'Thời gian', 'Trạng thái', 'Khách', 'SĐT', 'Quận', 'Thanh toán', 'TT thanh toán', 'Tạm tính', 'Giảm mã', 'Giảm điểm', 'Phí ship', 'Tổng thu', 'Giá vốn', 'Phí nền tảng', 'Mã giảm giá'],
      ...rows.map((r) => [
        r.code,
        CHANNEL_LABELS[r.channel],
        r.externalCode,
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
        r.platformFee,
        r.couponCode,
      ]),
    ]
  } else {
    const rows = await db
      .select({
        name: orderItems.productName,
        quantity: sum(orderItems.quantity).mapWith(Number),
        revenue: lineRevenueSum(),
        cost: sum(orderItems.costTotal).mapWith(Number),
      })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .where(and(range, eq(orders.status, 'completed')))
      .groupBy(orderItems.productName)
      .orderBy(desc(lineRevenueSum()))
    lines = [
      ['Món', 'Số lượng', 'Doanh thu (sau giảm giá)', 'Giá vốn', 'Lãi gộp'],
      ...rows.map((r) => [r.name, r.quantity, r.revenue, r.cost, r.revenue - r.cost]),
    ]
  }
  setResponseHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setResponseHeader(event, 'Content-Disposition', `attachment; filename="${kind === 'orders' ? 'don-hang' : 'mon-ban'}-${from}_${to}.csv"`)
  return toCsv(lines)
})
