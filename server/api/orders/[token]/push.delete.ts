import { and, eq } from 'drizzle-orm'
import { pushUnsubscribeInput } from '#shared/schemas/push'

export default defineEventHandler(async (event) => {
  const order = await findOrderByToken(event)
  const { endpoint } = await readValidated(event, pushUnsubscribeInput)
  const { pushSubscriptions } = schema
  await useDb()
    .delete(pushSubscriptions)
    .where(and(eq(pushSubscriptions.orderId, order.id), eq(pushSubscriptions.endpoint, endpoint)))
  return { ok: true }
})
