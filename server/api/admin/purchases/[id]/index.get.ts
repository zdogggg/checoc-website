export default defineEventHandler(async (event) => {
  await requireStaff(event)
  const purchase = await findPurchase(readId(event))
  if (!purchase) throw createError({ statusCode: 404, statusMessage: 'Purchase not found' })
  return purchase
})
