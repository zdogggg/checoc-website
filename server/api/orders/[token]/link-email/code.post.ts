import { z } from 'zod'
import { emailChangeInput } from '#shared/schemas/customers'
import { normalizePhone } from '#shared/utils/orders'

// Customers who never gave an email cannot sign in while SMS codes are not set up, so their
// points would be stuck. The tracking page of a delivered order lets them add one: they must
// have the order's link, retype its phone number, and prove the mailbox with a code.
const input = emailChangeInput.extend({ phone: z.string().trim().min(1, 'Nhập số điện thoại đặt hàng').max(20) })

export default defineEventHandler(async (event) => {
  await rateLimit(event, 'link-email', 6, 15 * 60 * 1000)
  const { email, phone } = await readValidated(event, input)
  const customer = await linkableCustomer(event, getRouterParam(event, 'token') ?? '')
  if (customer.phone !== normalizePhone(phone)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Số điện thoại không khớp với đơn hàng',
      data: { issues: [{ path: 'phone', message: 'Số điện thoại không khớp với đơn hàng' }] },
    })
  }
  return { ok: true, ...(await requestEmailChangeCode(customer.id, email)) }
})
