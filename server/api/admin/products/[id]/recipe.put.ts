import { eq } from 'drizzle-orm'
import { recipeInput } from '#shared/schemas/inventory'

export default defineEventHandler(async (event) => {
  await requireStaff(event, CATALOG_EDITORS)
  const id = readId(event)
  const { items } = await readValidated(event, recipeInput)
  const exists = await useDb().query.products.findFirst({ where: eq(schema.products.id, id), columns: { id: true } })
  if (!exists) throw createError({ statusCode: 404, statusMessage: 'Product not found' })
  await saveRecipe('product', id, items)
  return loadRecipe('product', id)
})
