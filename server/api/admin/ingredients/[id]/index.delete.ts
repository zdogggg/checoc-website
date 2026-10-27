import { eq } from 'drizzle-orm'

// Only ingredients that were never used anywhere can be deleted; others should be hidden
export default defineEventHandler(async (event) => {
  await requireStaff(event, CATALOG_EDITORS)
  const id = readId(event)
  const db = useDb()
  const { ingredients, productIngredients, optionIngredients, purchaseItems, stockMovements } = schema

  const [inRecipe, inOption, inPurchase, moved] = await Promise.all([
    db.query.productIngredients.findFirst({ where: eq(productIngredients.ingredientId, id) }),
    db.query.optionIngredients.findFirst({ where: eq(optionIngredients.ingredientId, id) }),
    db.query.purchaseItems.findFirst({ where: eq(purchaseItems.ingredientId, id), columns: { id: true } }),
    db.query.stockMovements.findFirst({ where: eq(stockMovements.ingredientId, id), columns: { id: true } }),
  ])
  if (inRecipe || inOption) {
    throw createError({ statusCode: 409, statusMessage: 'Conflict', message: 'Nguyên liệu đang có trong định mức món. Hãy gỡ khỏi định mức trước.' })
  }
  if (inPurchase || moved) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Conflict',
      message: 'Nguyên liệu đã có lịch sử nhập/xuất kho nên không xoá được. Hãy chuyển sang "Ngừng dùng".',
    })
  }
  const [row] = await db.delete(ingredients).where(eq(ingredients.id, id)).returning({ id: ingredients.id })
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Ingredient not found' })
  return { ok: true }
})
