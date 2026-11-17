import { orderInput } from '#shared/schemas/orders'
import type { PlacedOrder } from '#shared/types/orders'

export default defineEventHandler(async (event): Promise<PlacedOrder> => {
  // Generous: many customers share one IP (mobile carrier NAT, office Wi-Fi); this only stops floods
  await rateLimit(event, 'orders', 20, 10 * 60 * 1000)
  const input = await readValidated(event, orderInput)
  // Checkout hides VietQR until the bank account is set; enforce it here too
  if (input.paymentMethod === 'vietqr' && !isBankConfigured(useRuntimeConfig(event).public.bank)) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Unprocessable Entity',
      message: 'Quán chưa nhận chuyển khoản, vui lòng chọn thanh toán khi nhận hàng',
    })
  }
  // Spending points needs a valid sign-in (checked against the database, not only the cookie)
  const customer = await currentCustomer(event)
  const { order, itemCount, replayed } = await createOrder(input, customer ?? undefined, deviceHashFor(event))

  // Fire and forget: a slow or failing notification must not affect the customer.
  // A retried request returns the order placed the first time; the shop was told already.
  if (!replayed) event.waitUntil(notifyNewOrder(order, itemCount))

  setResponseStatus(event, replayed ? 200 : 201)
  return { code: order.code, trackingToken: order.trackingToken, total: order.total }
})
