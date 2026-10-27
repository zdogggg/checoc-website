// Goods have arrived: stock goes up and average costs are updated
export default defineEventHandler(async (event) => {
  const user = await requireStaff(event, CATALOG_EDITORS)
  const id = readId(event)
  await receivePurchase(id, user.id)
  return findPurchase(id)
})
