import { eq } from 'drizzle-orm'

const { orders, orderStatusLogs } = schema

// Take back a completed website order (customer complaint, wrong dish, never received...).
// Everything completing it did is undone: the order leaves revenue and P&L (it becomes
// cancelled), the coupon use is released, the customer's spend, tier and points are reversed.
//
// restock: the ingredients go back into stock (e.g. sealed toppings returned unused).
// Otherwise the food was made and cannot be sold again: the ingredients are written off as
// waste, so their cost still shows in the month's P&L as a loss instead of disappearing.
export async function refundOrder(id: number, input: { reason: string; restock: boolean }, userId: number) {
  await useDb().transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, id)).for('update')
    if (!order) throw createError({ statusCode: 404, statusMessage: 'Order not found' })
    if (order.channel !== 'website' || order.status !== 'completed') {
      throw createError({ statusCode: 409, statusMessage: 'Conflict', message: 'Chỉ hoàn trả được đơn website đã hoàn tất' })
    }

    const used = await orderStockUsage(tx, id)
    for (const u of used) {
      await moveStock(tx, u.ingredientId, u.quantity, 'adjust', { orderId: id, userId, note: `Trả đơn ${order.code}` })
      if (!input.restock) {
        await moveStock(tx, u.ingredientId, -u.quantity, 'waste', { orderId: id, userId, note: `Bỏ đi: món của đơn trả ${order.code}` })
      }
    }
    if (input.restock) await syncAutoAvailability(tx, used.map((u) => u.ingredientId))

    await reverseOrderCompletion(tx, order)
    if (order.couponId) await releaseCouponUse(tx, order.couponId)

    const now = new Date()
    await tx
      .update(orders)
      .set({
        status: 'cancelled',
        cancelledAt: now,
        refundedAt: now,
        cancelReason: input.reason,
        ...(order.paymentStatus === 'paid' ? { paymentStatus: 'refunded' as const } : {}),
      })
      .where(eq(orders.id, id))
    await tx.insert(orderStatusLogs).values({
      orderId: id,
      fromStatus: 'completed',
      toStatus: 'cancelled',
      userId,
      note: `Hoàn trả: ${input.reason}`,
    })
  })
}
