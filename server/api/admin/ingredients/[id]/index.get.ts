import { desc, eq } from 'drizzle-orm'
import type { IngredientDetail } from '#shared/types/inventory'

export default defineEventHandler(async (event): Promise<IngredientDetail> => {
  await requireStaff(event)
  const id = readId(event)
  const db = useDb()
  const { ingredients, stockMovements, productIngredients, optionIngredients, products, options } = schema

  const row = await db.query.ingredients.findFirst({ where: eq(ingredients.id, id) })
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Ingredient not found' })

  const [movements, productUses, optionUses] = await Promise.all([
    db.query.stockMovements.findMany({
      where: eq(stockMovements.ingredientId, id),
      orderBy: desc(stockMovements.id),
      limit: 100,
      with: {
        purchase: { columns: { id: true, code: true } },
        order: { columns: { id: true, code: true } },
        user: { columns: { name: true } },
      },
    }),
    db
      .select({ id: products.id, name: products.name, quantity: productIngredients.quantity })
      .from(productIngredients)
      .innerJoin(products, eq(products.id, productIngredients.productId))
      .where(eq(productIngredients.ingredientId, id)),
    db
      .select({ id: options.id, name: options.label, quantity: optionIngredients.quantity })
      .from(optionIngredients)
      .innerJoin(options, eq(options.id, optionIngredients.optionId))
      .where(eq(optionIngredients.ingredientId, id)),
  ])

  return {
    ...toIngredientListItem({ ...row, usedByProducts: productUses.length, usedByOptions: optionUses.length }),
    movements: movements.map((m) => ({
      id: m.id,
      type: m.type,
      quantity: m.quantity,
      balanceAfter: m.balanceAfter,
      unitCost: m.unitCost,
      note: m.note,
      ref: m.purchase
        ? { kind: 'purchase' as const, id: m.purchase.id, code: m.purchase.code }
        : m.order
          ? { kind: 'order' as const, id: m.order.id, code: m.order.code }
          : null,
      by: m.user?.name ?? null,
      createdAt: m.createdAt.toISOString(),
    })),
    usedIn: [
      ...productUses.map((u) => ({ kind: 'product' as const, ...u })),
      ...optionUses.map((u) => ({ kind: 'option' as const, ...u })),
    ],
  }
})
