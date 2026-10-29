import { randomBytes } from 'node:crypto'
import { and, eq, sql } from 'drizzle-orm'
import type { PlatformOrderInput } from '#shared/schemas/orders'
import { OrderPricingError, platformFeeFor, priceOrderLines, repriceLines } from './orderPricing'

// Orders that arrived on ShopeeFood and are entered by staff once done. They go straight to
// "completed": stock is taken out and COGS stored like any completed order, the app's
// commission is kept on the order, and no customer, points or notification is involved
// (delivery apps do not share the buyer's contact details).

const { orders, orderItems, orderStatusLogs, stockMovements } = schema

export async function createPlatformOrder(input: PlatformOrderInput, userId: number) {
  const { productMap, options } = await loadPricingInputs([...new Set(input.items.map((i) => i.productId))])
  // A dish switched off on the website ("sold out") may still have been sold on the app
  for (const p of productMap.values()) p.isAvailable = true

  let lines
  try {
    lines = priceOrderLines(
      input.items.map((i) => ({ ...i, sugar: '', ice: '', note: '' })),
      productMap,
      options,
    )
  } catch (error) {
    if (error instanceof OrderPricingError) {
      throw createError({ statusCode: 409, statusMessage: 'Conflict', message: error.message })
    }
    throw error
  }
  if (input.subtotal != null) lines = repriceLines(lines, input.subtotal)

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0)
  if (input.discount > subtotal) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Unprocessable Entity',
      message: 'Giảm giá không được lớn hơn tiền món',
      data: { issues: [{ path: 'discount', message: 'Giảm giá không được lớn hơn tiền món' }] },
    })
  }
  const goods = subtotal - input.discount
  const placedAt = input.placedAt ?? new Date()

  return useDb()
    .transaction(async (tx) => {
      const [order] = await tx
        .insert(orders)
        .values({
          trackingToken: randomBytes(16).toString('base64url'),
          channel: 'shopeefood',
          externalCode: input.externalCode,
          status: 'completed',
          paymentMethod: 'platform',
          paymentStatus: 'paid',
          customerName: 'Khách ShopeeFood',
          customerPhone: '',
          city: DELIVERY_CITY,
          district: '',
          address: '',
          note: input.note,
          subtotal,
          discount: input.discount,
          shippingFee: 0,
          total: goods,
          platformFee: platformFeeFor(goods, input.feePercent),
          paidAt: placedAt,
          completedAt: placedAt,
          createdAt: placedAt,
        })
        .returning()

      await tx.insert(orderItems).values(lines.map((l) => ({ ...l, orderId: order!.id })))
      const cogs = await consumeOrderStock(tx, order!.id, userId)
      await tx.update(orders).set({ cogs }).where(eq(orders.id, order!.id))
      await tx.insert(orderStatusLogs).values({
        orderId: order!.id,
        toStatus: 'completed',
        userId,
        note: `Nhập từ ShopeeFood (${input.externalCode})`,
      })
      return { ...order!, cogs }
    })
    .catch((error) => rethrowUnique(error, `Đơn ShopeeFood ${input.externalCode} đã được nhập rồi`))
}

// Undo an order entered by mistake: its ingredients go back into stock and it leaves the
// reports (cancelled). Only for app orders; website orders follow the normal status flow.
export async function voidPlatformOrder(id: number, reason: string, userId: number) {
  await useDb().transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, id)).for('update')
    if (!order) throw createError({ statusCode: 404, statusMessage: 'Order not found' })
    if (order.channel === 'website' || order.status !== 'completed') {
      throw createError({
        statusCode: 409,
        statusMessage: 'Conflict',
        message: 'Chỉ huỷ được đơn ShopeeFood đã nhập và chưa bị huỷ',
      })
    }

    // Net quantity this order took out of each ingredient (negative numbers)
    const used = await tx
      .select({ ingredientId: stockMovements.ingredientId, quantity: sql<number>`sum(${stockMovements.quantity})`.mapWith(Number) })
      .from(stockMovements)
      .where(and(eq(stockMovements.orderId, id), eq(stockMovements.type, 'out')))
      .groupBy(stockMovements.ingredientId)
      .orderBy(stockMovements.ingredientId)
    for (const u of used) {
      if (u.quantity < 0) {
        await moveStock(tx, u.ingredientId, -u.quantity, 'adjust', {
          orderId: id,
          userId,
          note: `Hoàn kho: huỷ đơn ${order.code} nhập nhầm`,
        })
      }
    }
    await syncAutoAvailability(tx, used.map((u) => u.ingredientId))

    await tx
      .update(orders)
      .set({ status: 'cancelled', cancelledAt: new Date(), cancelReason: reason })
      .where(eq(orders.id, id))
    await tx.insert(orderStatusLogs).values({ orderId: id, fromStatus: 'completed', toStatus: 'cancelled', userId, note: reason })
  })
}
