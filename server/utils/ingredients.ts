import { asc, sql } from 'drizzle-orm'
import type { IngredientListItem } from '#shared/types/inventory'

const { ingredients, productIngredients, optionIngredients } = schema

export function toIngredientListItem(
  row: typeof ingredients.$inferSelect & { usedByProducts?: number; usedByOptions?: number }
): IngredientListItem {
  return {
    id: row.id,
    name: row.name,
    unit: row.unit,
    stock: row.stock,
    minStock: row.minStock,
    avgCost: row.avgCost,
    stockValue: Math.round(Math.max(0, row.stock) * row.avgCost),
    isLow: row.stock <= row.minStock,
    isActive: row.isActive,
    usedByProducts: row.usedByProducts ?? 0,
    usedByOptions: row.usedByOptions ?? 0,
    note: row.note,
  }
}

export async function listIngredients(): Promise<IngredientListItem[]> {
  const rows = await useDb()
    .select({
      ingredient: ingredients,
      usedByProducts: sql<number>`(select count(*) from ${productIngredients} where ${productIngredients.ingredientId} = ${ingredients.id})`.mapWith(Number),
      usedByOptions: sql<number>`(select count(*) from ${optionIngredients} where ${optionIngredients.ingredientId} = ${ingredients.id})`.mapWith(Number),
    })
    .from(ingredients)
    .orderBy(asc(ingredients.name))
  return rows.map((r) => toIngredientListItem({ ...r.ingredient, usedByProducts: r.usedByProducts, usedByOptions: r.usedByOptions }))
}
