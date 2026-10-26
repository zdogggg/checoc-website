import { randomBytes } from 'node:crypto'
import { and, asc, eq, inArray, isNull } from 'drizzle-orm'
import type { OrderInput } from '#shared/schemas/orders'
import type { AdminOrder, OrderItemView, PublicOrder } from '#shared/types/orders'
import {
  canTransition,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  type OrderStatus,
  type PaymentStatus,
} from '#shared/utils/orders'

const { orders, orderItems, orderStatusLogs, products } = schema

type OrderRow = typeof orders.$inferSelect
type ItemRow = typeof orderItems.$inferSelect
type LogRow = typeof orderStatusLogs.$inferSelect & { user?: { name: string } | null }

// "0988123456" -> "0988***456"
export function maskPhone(phone: string): string {
  return phone.length >= 7 ? `${phone.slice(0, 4)}***${phone.slice(-3)}` : phone
}

function toItemView(item: ItemRow): OrderItemView {
  const { orderId: _orderId, ...rest } = item
  return rest
}

export function toPublicOrder(order: OrderRow & { items: ItemRow[]; logs: LogRow[] }): PublicOrder {
  return {
    code: order.code,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    customerName: order.customerName,
    customerPhone: maskPhone(order.customerPhone),
    city: order.city,
    district: order.district,
    address: order.address,
    note: order.note,
    items: order.items.map(toItemView),
    subtotal: order.subtotal,
    discount: order.discount,
    shippingFee: order.shippingFee,
    total: order.total,
    couponCode: order.couponCode,
    cancelReason: order.cancelReason,
    createdAt: order.createdAt.toISOString(),
    // Staff notes stay internal; the customer only sees when each step happened
    timeline: order.logs.map((l) => ({ status: l.toStatus, at: l.createdAt.toISOString(), note: '' })),
  }
}

export function toAdminOrder(order: OrderRow & { items: ItemRow[]; logs: LogRow[] }): AdminOrder {
  return {
    ...toPublicOrder(order),
    id: order.id,
    trackingToken: order.trackingToken,
    customerPhone: order.customerPhone,
    paidAt: order.paidAt?.toISOString() ?? null,
    completedAt: order.completedAt?.toISOString() ?? null,
    cancelledAt: order.cancelledAt?.toISOString() ?? null,
    timeline: order.logs.map((l) => ({
      status: l.toStatus,
      at: l.createdAt.toISOString(),
      note: l.note,
      by: l.user?.name ?? null,
    })),
  }
}

export const orderWith = {
  items: { orderBy: asc(orderItems.id) },
  logs: { orderBy: asc(orderStatusLogs.id), with: { user: { columns: { name: true } } } },
} as const

export async function findAdminOrder(id: number) {
  const order = await useDb().query.orders.findFirst({ where: eq(orders.id, id), with: orderWith })
  return order ? toAdminOrder(order) : null
}

// Current menu data needed to price an order
async function loadPricingInputs(productIds: number[]) {
  const rows = await useDb().query.products.findMany({
    where: and(inArray(products.id, productIds), isNull(products.deletedAt)),
    with: { category: { columns: { isActive: true } } },
  })
  const productMap = new Map<number, PricingProduct>(
    rows
      .filter((r) => r.category.isActive)
      .map((r) => [r.id, { id: r.id, name: r.name, image: r.image, price: r.price, isAvailable: r.isAvailable }])
  )
  const opts = await listStoreOptions()
  const options: PricingOptions = {
    sugar: opts.sugar.map((o) => ({ label: o.label, shortLabel: o.shortLabel, price: 0, isDefault: o.default })),
    ice: opts.ice.map((o) => ({ label: o.label, shortLabel: o.shortLabel, price: 0, isDefault: o.default })),
    toppings: opts.toppings.map((t) => ({ label: t.name, shortLabel: t.name, price: t.price })),
  }
  return { productMap, options }
}

export async function createOrder(input: OrderInput) {
  const { productMap, options } = await loadPricingInputs([...new Set(input.items.map((i) => i.productId))])

  let lines: PricedLine[]
  try {
    lines = priceOrderLines(input.items, productMap, options)
  } catch (error) {
    if (error instanceof OrderPricingError) {
      throw createError({ statusCode: 409, statusMessage: 'Conflict', message: error.message })
    }
    throw error
  }

  return useDb().transaction(async (tx) => {
    let coupon: Awaited<ReturnType<typeof findUsableCoupon>> | null = null
    if (input.couponCode) {
      const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0)
      coupon = await findUsableCoupon(tx, input.couponCode, subtotal)
      await claimCouponUse(tx, coupon.id)
    }
    const totals = totalsFor(lines, coupon ? toAppliedCoupon(coupon) : null)

    const [order] = await tx
      .insert(orders)
      .values({
        trackingToken: randomBytes(16).toString('base64url'),
        paymentMethod: input.paymentMethod,
        customerName: input.fullName,
        customerPhone: input.phone,
        city: input.city,
        district: input.district,
        address: input.address,
        note: input.note,
        subtotal: totals.subtotal,
        discount: totals.discount,
        shippingFee: totals.shippingFee,
        total: totals.total,
        couponId: coupon?.id ?? null,
        couponCode: coupon?.code ?? null,
      })
      .returning()

    await tx.insert(orderItems).values(totals.lines.map((l) => ({ ...l, orderId: order!.id })))
    await tx.insert(orderStatusLogs).values({ orderId: order!.id, toStatus: 'pending', note: 'Khách đặt hàng' })
    return { order: order!, itemCount: totals.lines.reduce((n, l) => n + l.quantity, 0) }
  })
}

// Move an order to a new status. Row-locked so two staff clicking at once cannot
// both apply a transition; the second one gets a 409 from canTransition.
export async function changeOrderStatus(id: number, to: OrderStatus, note: string, userId: number) {
  await useDb().transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, id)).for('update')
    if (!order) throw createError({ statusCode: 404, statusMessage: 'Order not found' })
    if (!canTransition(order.status, to)) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Conflict',
        message: `Không thể chuyển đơn từ "${ORDER_STATUS_LABELS[order.status]}" sang "${ORDER_STATUS_LABELS[to]}". Trang có thể đã cũ, hãy tải lại.`,
      })
    }

    const now = new Date()
    const patch: Partial<typeof orders.$inferInsert> = { status: to }
    if (to === 'completed') {
      patch.completedAt = now
      // Cash is collected on delivery
      if (order.paymentMethod === 'cod' && order.paymentStatus === 'unpaid') {
        patch.paymentStatus = 'paid'
        patch.paidAt = now
      }
    }
    if (to === 'cancelled') {
      patch.cancelledAt = now
      patch.cancelReason = note
      if (order.couponId) await releaseCouponUse(tx, order.couponId)
    }

    await tx.update(orders).set(patch).where(eq(orders.id, id))
    await tx.insert(orderStatusLogs).values({ orderId: id, fromStatus: order.status, toStatus: to, userId, note })
  })
}

const PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  unpaid: ['paid'],
  // "paid -> unpaid" undoes a mistaken click
  paid: ['unpaid', 'refunded'],
  refunded: [],
}

export async function changePaymentStatus(id: number, to: PaymentStatus) {
  await useDb().transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, id)).for('update')
    if (!order) throw createError({ statusCode: 404, statusMessage: 'Order not found' })
    if (!PAYMENT_TRANSITIONS[order.paymentStatus].includes(to)) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Conflict',
        message: `Không thể đổi thanh toán từ "${PAYMENT_STATUS_LABELS[order.paymentStatus]}" sang "${PAYMENT_STATUS_LABELS[to]}"`,
      })
    }
    await tx
      .update(orders)
      .set({ paymentStatus: to, paidAt: to === 'paid' ? new Date() : to === 'unpaid' ? null : order.paidAt })
      .where(eq(orders.id, id))
  })
}
