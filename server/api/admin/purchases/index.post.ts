import { purchaseInput } from '#shared/schemas/inventory'

export default defineEventHandler(async (event) => {
  const user = await requireStaff(event, CATALOG_EDITORS)
  const input = await readValidated(event, purchaseInput)
  const id = await savePurchase(null, input, user.id)
  setResponseStatus(event, 201)
  return findPurchase(id)
})
