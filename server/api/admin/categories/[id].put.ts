import { eq } from 'drizzle-orm'
import { categoryInput } from '#shared/schemas/catalog'

export default defineEventHandler(async (event) => {
  await requireStaff(event, CATALOG_EDITORS)
  const id = readId(event)
  const input = await readValidated(event, categoryInput)
  try {
    const [row] = await useDb().update(schema.categories).set(input).where(eq(schema.categories.id, id)).returning()
    if (!row) throw createError({ statusCode: 404, statusMessage: 'Category not found' })
    return row
  } catch (error) {
    rethrowUnique(error, 'Slug danh mục đã tồn tại')
  }
})
