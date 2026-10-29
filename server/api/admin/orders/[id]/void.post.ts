import { voidOrderInput } from '#shared/schemas/orders'

// Undo a ShopeeFood order entered by mistake (puts the stock back); managers and owners only
export default defineEventHandler(async (event) => {
  const user = await requireStaff(event, CATALOG_EDITORS)
  const id = readId(event)
  const { reason } = await readValidated(event, voidOrderInput)
  await voidPlatformOrder(id, reason, user.id)
  return findAdminOrder(id)
})
