import { orderInput } from '#shared/schemas/orders'
import type { PlacedOrder } from '#shared/types/orders'

export default defineEventHandler(async (event): Promise<PlacedOrder> => {
  // Generous: many customers share one IP (mobile carrier NAT, office Wi-Fi); this only stops floods
  rateLimit(event, 'orders', 20, 10 * 60 * 1000)
  const input = await readValidated(event, orderInput)
  const session = await getUserSession(event)
  const { order, itemCount } = await createOrder(input, session.customer)

  // Fire and forget: a slow or failing notification must not affect the customer
  event.waitUntil(notifyNewOrder(order, itemCount))

  setResponseStatus(event, 201)
  return { code: order.code, trackingToken: order.trackingToken, total: order.total }
})
