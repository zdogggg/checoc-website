import { purchaseInput } from '#shared/schemas/inventory'

export default defineEventHandler(async (event) => {
  const user = await requireStaff(event, CATALOG_EDITORS)
  const id = readId(event)
  const input = await readValidated(event, purchaseInput)
  await savePurchase(id, input, user.id)
  return findPurchase(id)
})
