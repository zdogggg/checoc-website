import { eq } from 'drizzle-orm'
import type { PublicOrder } from '#shared/types/orders'

export default defineEventHandler(async (event): Promise<PublicOrder> => {
  const token = getRouterParam(event, 'token') ?? ''
  const order = await useDb().query.orders.findFirst({
    where: eq(schema.orders.trackingToken, token),
    with: orderWith,
  })
  if (!order) throw createError({ statusCode: 404, statusMessage: 'Order not found' })
  setResponseHeader(event, 'Cache-Control', 'no-store')
  let canLinkEmail = false
  if (order.status === 'completed' && order.channel === 'website' && order.customerId) {
    const customer = await useDb().query.customers.findFirst({
      where: eq(schema.customers.id, order.customerId),
      columns: { email: true },
    })
    canLinkEmail = !!customer && !customer.email
  }
  return { ...toPublicOrder(order), canLinkEmail }
})
