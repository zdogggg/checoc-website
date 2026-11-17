// Undo a receipt entered wrongly: stock and average costs go back, the receipt can be corrected
export default defineEventHandler(async (event) => {
  const user = await requireStaff(event, CATALOG_EDITORS)
  const id = readId(event)
  await unreceivePurchase(id, user.id)
  return findPurchase(id)
})
