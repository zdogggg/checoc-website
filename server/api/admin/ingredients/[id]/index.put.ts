import { eq } from 'drizzle-orm'
import { ingredientInput } from '#shared/schemas/inventory'

// Stock and cost are not editable here: they only change through movements
export default defineEventHandler(async (event) => {
  await requireStaff(event, CATALOG_EDITORS)
  const id = readId(event)
  const input = await readValidated(event, ingredientInput)
  try {
    const row = await useDb().transaction(async (tx) => {
      const [updated] = await tx.update(schema.ingredients).set(input).where(eq(schema.ingredients.id, id)).returning()
      if (!updated) throw createError({ statusCode: 404, statusMessage: 'Ingredient not found' })
      return updated
    })
    return row
  } catch (error) {
    rethrowUnique(error, 'Nguyên liệu này đã có trong danh sách')
  }
})
