import { z } from 'zod'
import { normalizePhone } from '#shared/utils/orders'

// Owner only: permanent, and it removes the customer's history from the CRM.
// The phone number has to be typed again so a wrong click cannot erase someone.
const eraseInput = z.object({ confirmPhone: z.string().trim().min(1, 'Nhập số điện thoại của khách để xác nhận').max(20) })

export default defineEventHandler(async (event) => {
  await requireStaff(event, OWNERS)
  const id = readId(event)
  const { confirmPhone } = await readValidated(event, eraseInput)
  const customer = await useDb().query.customers.findFirst({ where: (c, { eq }) => eq(c.id, id), columns: { phone: true } })
  if (!customer) throw createError({ statusCode: 404, statusMessage: 'Customer not found' })
  if (normalizePhone(confirmPhone) !== customer.phone) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Số điện thoại xác nhận không khớp',
      data: { issues: [{ path: 'confirmPhone', message: 'Số điện thoại xác nhận không khớp' }] },
    })
  }
  return { ok: true, ...(await eraseCustomer(id)) }
})
