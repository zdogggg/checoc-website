export default defineEventHandler(async (event) => {
  await requireStaff(event)
  const product = await findAdminProduct(readId(event))
  if (!product) throw createError({ statusCode: 404, statusMessage: 'Product not found' })
  return product
})
