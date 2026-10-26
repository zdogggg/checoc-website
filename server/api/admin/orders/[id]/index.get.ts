export default defineEventHandler(async (event) => {
  await requireStaff(event)
  const order = await findAdminOrder(readId(event))
  if (!order) throw createError({ statusCode: 404, statusMessage: 'Order not found' })
  return order
})
