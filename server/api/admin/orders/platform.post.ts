import { platformOrderInput } from '#shared/schemas/orders'

// Staff enter a finished ShopeeFood order (all roles: it is part of handling orders)
export default defineEventHandler(async (event) => {
  const user = await requireStaff(event)
  const input = await readValidated(event, platformOrderInput)
  const order = await createPlatformOrder(input, user.id)
  setResponseStatus(event, 201)
  return { id: order.id, code: order.code, total: order.total, platformFee: order.platformFee, cogs: order.cogs }
})
