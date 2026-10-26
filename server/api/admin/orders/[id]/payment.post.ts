import { paymentStatusInput } from '#shared/schemas/orders'

// Money changes (marking paid / refunded) are limited to owner and manager
export default defineEventHandler(async (event) => {
  await requireStaff(event, CATALOG_EDITORS)
  const id = readId(event)
  const { paymentStatus } = await readValidated(event, paymentStatusInput)
  await changePaymentStatus(id, paymentStatus)
  return findAdminOrder(id)
})
