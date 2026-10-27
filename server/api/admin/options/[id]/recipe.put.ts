import { eq } from 'drizzle-orm'
import { recipeInput } from '#shared/schemas/inventory'

export default defineEventHandler(async (event) => {
  await requireStaff(event, CATALOG_EDITORS)
  const id = readId(event)
  const { items } = await readValidated(event, recipeInput)
  const exists = await useDb().query.options.findFirst({ where: eq(schema.options.id, id), columns: { id: true } })
  if (!exists) throw createError({ statusCode: 404, statusMessage: 'Option not found' })
  await saveRecipe('option', id, items)
  return loadRecipe('option', id)
})
