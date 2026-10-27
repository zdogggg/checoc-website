export default defineEventHandler(async (event) => {
  await requireStaff(event, CATALOG_EDITORS)
  const id = readId(event)
  await cancelPurchase(id)
  return findPurchase(id)
})
