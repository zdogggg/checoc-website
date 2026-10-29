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
import { maxRedeemablePoints, MIN_POINTS_TO_REDEEM, pointsValue } from '#shared/utils/loyalty'

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
    pointsUsed: order.pointsUsed,
    pointsDiscount: order.pointsDiscount,
    pointsEarned: order.pointsEarned,
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
    customerId: order.customerId,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    channel: order.channel,
    externalCode: order.externalCode,
    platformFee: order.platformFee,
    cogs: order.cogs,
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
export async function loadPricingInputs(productIds: number[]) {
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

// sessionCustomer: the shopper signed in by SMS code, if any (needed to spend points)
export async function createOrder(input: OrderInput, sessionCustomer?: { id: number; phone: string }) {
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
      coupon = await findUsableCoupon(tx, input.couponCode, subtotal, input.phone)
      await claimCouponUse(tx, coupon.id)
    }
    const applied = coupon ? toAppliedCoupon(coupon) : null
    const customer = await upsertCustomerForOrder(tx, {
      phone: input.phone,
      name: input.fullName,
      city: input.city,
      district: input.district,
      address: input.address,
    })

    // Spending points: only for the signed-in owner of this phone number, within the limits
    let pointsUsed = 0
    if (input.pointsToUse > 0) {
      if (!sessionCustomer || sessionCustomer.phone !== input.phone) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Forbidden',
          message: 'Vui lòng đăng nhập bằng đúng số điện thoại đặt hàng để dùng điểm',
        })
      }
      const beforePoints = totalsFor(lines, applied)
      const max = maxRedeemablePoints(customer.points, beforePoints.subtotal - beforePoints.discount)
      if (input.pointsToUse > max) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Conflict',
          message: max
            ? `Đơn này dùng được tối đa ${max.toLocaleString('vi-VN')} điểm`
            : `Cần ít nhất ${MIN_POINTS_TO_REDEEM} điểm và đơn đủ lớn để dùng điểm`,
        })
      }
      pointsUsed = input.pointsToUse
    }
    const totals = totalsFor(lines, applied, pointsValue(pointsUsed))

    const [order] = await tx
      .insert(orders)
      .values({
        trackingToken: randomBytes(16).toString('base64url'),
        paymentMethod: input.paymentMethod,
        customerName: input.fullName,
        customerPhone: input.phone,
        customerEmail: input.email ?? null,
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
        customerId: customer.id,
        pointsUsed,
        pointsDiscount: totals.pointsDiscount,
      })
      .returning()

    if (pointsUsed) {
      await adjustPoints(tx, customer.id, -pointsUsed, 'order_redeem', { orderId: order!.id })
    }

    await tx.insert(orderItems).values(totals.lines.map((l) => ({ ...l, orderId: order!.id })))
    await tx.insert(orderStatusLogs).values({ orderId: order!.id, toStatus: 'pending', note: 'Khách đặt hàng' })
    return { order: order!, itemCount: totals.lines.reduce((n, l) => n + l.quantity, 0) }
  })
}

// Move an order to a new status. Row-locked so two staff clicking at once cannot
// both apply a transition; the second one gets a 409 from canTransition.
export async function changeOrderStatus(id: number, to: OrderStatus, note: string, userId: number) {
  const order = await useDb().transaction(async (tx) => {
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
      patch.pointsEarned = await applyOrderCompletion(tx, order)
      // Ingredients leave the stock when the order is done; their cost becomes the order's COGS
      patch.cogs = await consumeOrderStock(tx, id, userId)
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
      if (order.customerId && order.pointsUsed > 0) {
        await adjustPoints(tx, order.customerId, order.pointsUsed, 'redeem_refund', { orderId: id })
      }
    }

    await tx.update(orders).set(patch).where(eq(orders.id, id))
    await tx.insert(orderStatusLogs).values({ orderId: id, fromStatus: order.status, toStatus: to, userId, note })
    return order
  })
  if (to === 'completed') await linkCustomerEmail(order)
}

// The email typed at checkout becomes the customer's sign-in email only once the order is
// completed: the shop has then delivered to, and usually called, the owner of that phone.
// Never overwrites an email the customer already has, never takes one used by another customer.
async function linkCustomerEmail(order: typeof orders.$inferSelect) {
  if (!order.customerEmail || !order.customerId) return
  const { customers } = schema
  try {
    await useDb()
      .update(customers)
      .set({ email: order.customerEmail })
      .where(and(eq(customers.id, order.customerId), isNull(customers.email)))
  } catch (error) {
    // unique_violation: the email already belongs to another customer, leave both as they are.
    // Anything else is logged only: the status change itself is already saved.
    if ((error as { cause?: { code?: string } })?.cause?.code !== '23505') console.error('[orders] linking email failed', error)
  }
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
