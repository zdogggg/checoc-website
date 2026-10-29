import type { H3Event } from 'h3'
import { eq } from 'drizzle-orm'

// The order behind a tracking link; the unguessable token is the customer's proof
export async function findOrderByToken(event: H3Event) {
  const token = getRouterParam(event, 'token') ?? ''
  const order = await useDb().query.orders.findFirst({ where: eq(schema.orders.trackingToken, token) })
  if (!order) throw createError({ statusCode: 404, statusMessage: 'Order not found' })
  return order
}
