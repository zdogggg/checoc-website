import { refundOrderInput } from '#shared/schemas/orders'

// Take back a completed website order; changes revenue, stock and points, so managers and owners only
export default defineEventHandler(async (event) => {
  const user = await requireStaff(event, CATALOG_EDITORS)
  const id = readId(event)
  const input = await readValidated(event, refundOrderInput)
  await refundOrder(id, input, user.id)
  return findAdminOrder(id)
})
