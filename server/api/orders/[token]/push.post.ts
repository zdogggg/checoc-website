import { pushSubscriptionInput } from '#shared/schemas/push'

// Follow this order: the browser gets a notification at each status change
export default defineEventHandler(async (event) => {
  rateLimit(event, 'push', 30, 10 * 60 * 1000)
  if (!isPushConfigured()) throw createError({ statusCode: 503, statusMessage: 'Push not configured' })
  const order = await findOrderByToken(event)
  if (isFinalStatus(order.status)) {
    throw createError({ statusCode: 409, statusMessage: 'Conflict', message: 'Đơn đã kết thúc, không cần nhận thông báo nữa' })
  }
  const { endpoint, keys } = await readValidated(event, pushSubscriptionInput)
  await useDb()
    .insert(schema.pushSubscriptions)
    .values({ orderId: order.id, endpoint, p256dh: keys.p256dh, auth: keys.auth })
    .onConflictDoUpdate({
      target: [schema.pushSubscriptions.orderId, schema.pushSubscriptions.endpoint],
      set: { p256dh: keys.p256dh, auth: keys.auth },
    })
  setResponseStatus(event, 201)
  return { ok: true }
})
