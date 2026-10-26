import { productInput } from '#shared/schemas/catalog'

export default defineEventHandler(async (event) => {
  await requireStaff(event, CATALOG_EDITORS)
  const input = await readValidated(event, productInput)
  try {
    const id = await saveProduct(null, input)
    setResponseStatus(event, 201)
    return findAdminProduct(id)
  } catch (error) {
    rethrowUnique(error, 'Slug món ăn đã tồn tại')
  }
})
