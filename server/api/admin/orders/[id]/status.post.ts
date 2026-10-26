import { orderStatusInput } from '#shared/schemas/orders'

// Every staff role may move orders through the kitchen/delivery flow
export default defineEventHandler(async (event) => {
  const user = await requireStaff(event)
  const id = readId(event)
  const { status, note } = await readValidated(event, orderStatusInput)
  await changeOrderStatus(id, status, note, user.id)
  return findAdminOrder(id)
})
