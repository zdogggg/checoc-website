import { eq, inArray } from 'drizzle-orm'
import type { RecipeView } from '#shared/types/inventory'

const { ingredients, productIngredients, optionIngredients } = schema

type Kind = 'product' | 'option'

const table = (kind: Kind) => (kind === 'product' ? productIngredients : optionIngredients)

export async function loadRecipe(kind: Kind, ownerId: number): Promise<RecipeView> {
  const t = table(kind)
  const ownerCol = kind === 'product' ? productIngredients.productId : optionIngredients.optionId
  const rows = await useDb()
    .select({
      ingredientId: ingredients.id,
      name: ingredients.name,
      unit: ingredients.unit,
      avgCost: ingredients.avgCost,
      quantity: t.quantity,
    })
    .from(t)
    .innerJoin(ingredients, eq(ingredients.id, t.ingredientId))
    .where(eq(ownerCol, ownerId))
    .orderBy(ingredients.name)
  const items = rows.map((r) => ({ ...r, cost: r.quantity * r.avgCost }))
  return { items, totalCost: Math.round(items.reduce((s, i) => s + i.cost, 0)) }
}

// Replace a product's or option's recipe, then re-check availability of affected products
export async function saveRecipe(kind: Kind, ownerId: number, items: { ingredientId: number; quantity: number }[]) {
  await useDb().transaction(async (tx) => {
    if (items.length) {
      const found = await tx
        .select({ id: ingredients.id })
        .from(ingredients)
        .where(inArray(ingredients.id, items.map((i) => i.ingredientId)))
      if (found.length !== items.length) {
        throw createError({ statusCode: 422, statusMessage: 'Validation failed', message: 'Có nguyên liệu không tồn tại' })
      }
    }
    const before =
      kind === 'product'
        ? await tx.select().from(productIngredients).where(eq(productIngredients.productId, ownerId))
        : []
    if (kind === 'product') {
      await tx.delete(productIngredients).where(eq(productIngredients.productId, ownerId))
      if (items.length) await tx.insert(productIngredients).values(items.map((i) => ({ ...i, productId: ownerId })))
    } else {
      await tx.delete(optionIngredients).where(eq(optionIngredients.optionId, ownerId))
      if (items.length) await tx.insert(optionIngredients).values(items.map((i) => ({ ...i, optionId: ownerId })))
    }
    if (kind === 'product') {
      await syncAutoAvailability(tx, [...new Set([...before.map((b) => b.ingredientId), ...items.map((i) => i.ingredientId)])])
    }
  })
}
