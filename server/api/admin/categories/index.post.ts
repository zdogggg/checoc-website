import { categoryInput } from '#shared/schemas/catalog'

export default defineEventHandler(async (event) => {
  await requireStaff(event, CATALOG_EDITORS)
  const input = await readValidated(event, categoryInput)
  try {
    const [row] = await useDb().insert(schema.categories).values(input).returning()
    setResponseStatus(event, 201)
    return row
  } catch (error) {
    rethrowUnique(error, 'Slug danh mục đã tồn tại')
  }
})
