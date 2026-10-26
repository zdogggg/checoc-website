import { productInput } from '#shared/schemas/catalog'

export default defineEventHandler(async (event) => {
  await requireStaff(event, CATALOG_EDITORS)
  const id = readId(event)
  const input = await readValidated(event, productInput)
  try {
    await saveProduct(id, input)
    return findAdminProduct(id)
  } catch (error) {
    rethrowUnique(error, 'Slug món ăn đã tồn tại')
  }
})
