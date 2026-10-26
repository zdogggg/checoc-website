import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { normalizePhone } from '#shared/utils/orders'

const lookupInput = z.object({
  code: z.string().trim().min(1, 'Vui lòng nhập mã đơn').max(20),
  phone: z.string().trim().min(1, 'Vui lòng nhập số điện thoại').max(20),
})

// Find a tracking link from order code + phone (both must match)
export default defineEventHandler(async (event) => {
  rateLimit(event, 'order-lookup', 10, 10 * 60 * 1000)
  const { code, phone } = await readValidated(event, lookupInput)
  const order = await useDb().query.orders.findFirst({
    where: and(eq(schema.orders.code, code.toUpperCase()), eq(schema.orders.customerPhone, normalizePhone(phone))),
    columns: { trackingToken: true },
  })
  if (!order) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Order not found',
      message: 'Không tìm thấy đơn hàng. Vui lòng kiểm tra lại mã đơn và số điện thoại đặt hàng.',
    })
  }
  return { trackingToken: order.trackingToken }
})
