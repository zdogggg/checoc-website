import { and, eq, inArray, sql } from 'drizzle-orm'
import {
  canMakeOne,
  consumptionByLine,
  optionKey,
  roundQty,
  sumUsage,
  weightedAverageCost,
  type RecipeBook,
  type RecipeLine,
  type StockMovementType,
} from '#shared/utils/inventory'

const { ingredients, stockMovements, productIngredients, optionIngredients, options, optionGroups, products, orderItems } =
  schema

type Db = ReturnType<typeof useDb>
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0]

// Change one ingredient's stock and record the movement. The row is locked so
// concurrent movements (two orders completing at once) cannot lose an update.
// For deliveries (type "in") the weighted average cost is updated too.
export async function moveStock(
  tx: Tx,
  ingredientId: number,
  delta: number,
  type: StockMovementType,
  extra: { unitCost?: number; purchaseId?: number; orderId?: number; userId?: number; note?: string } = {}
) {
  const [row] = await tx.select().from(ingredients).where(eq(ingredients.id, ingredientId)).for('update')
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Ingredient not found' })

  const balance = roundQty(row.stock + delta)
  const avgCost = type === 'in' ? weightedAverageCost(row.stock, row.avgCost, delta, extra.unitCost ?? 0) : row.avgCost
  await tx.update(ingredients).set({ stock: balance, avgCost }).where(eq(ingredients.id, ingredientId))
  await tx.insert(stockMovements).values({
    ingredientId,
    type,
    quantity: roundQty(delta),
    balanceAfter: balance,
    unitCost: type === 'in' ? (extra.unitCost ?? 0) : row.avgCost,
    purchaseId: extra.purchaseId ?? null,
    orderId: extra.orderId ?? null,
    userId: extra.userId ?? null,
    note: extra.note ?? '',
  })
  return { balance, avgCost, costPerUnit: row.avgCost }
}

// Recipes for the given products plus every option recipe
export async function loadRecipeBook(db: Db | Tx, productIds: number[]): Promise<RecipeBook> {
  const productRows = productIds.length
    ? await db.select().from(productIngredients).where(inArray(productIngredients.productId, productIds))
    : []
  const optionRows = await db
    .select({
      code: optionGroups.code,
      label: options.label,
      shortLabel: options.shortLabel,
      ingredientId: optionIngredients.ingredientId,
      quantity: optionIngredients.quantity,
    })
    .from(optionIngredients)
    .innerJoin(options, eq(options.id, optionIngredients.optionId))
    .innerJoin(optionGroups, eq(optionGroups.id, options.groupId))

  const book: RecipeBook = { products: new Map(), options: new Map() }
  for (const r of productRows) {
    const list = book.products.get(r.productId) ?? []
    list.push({ ingredientId: r.ingredientId, quantity: r.quantity })
    book.products.set(r.productId, list)
  }
  for (const r of optionRows) {
    // Order items store sugar/ice by short label and toppings by full label
    const key = optionKey(r.code, r.code === 'topping' ? r.label : r.shortLabel)
    const list = book.options.get(key) ?? []
    list.push({ ingredientId: r.ingredientId, quantity: r.quantity })
    book.options.set(key, list)
  }
  return book
}

// Called when an order is completed: take its ingredients out of stock at average cost,
// store the cost on each line, and return the order's total ingredient cost (COGS)
export async function consumeOrderStock(tx: Tx, orderId: number, userId: number): Promise<number> {
  const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId)).orderBy(orderItems.id)
  const productIds = [...new Set(items.map((i) => i.productId).filter((id): id is number => id != null))]
  const book = await loadRecipeBook(tx, productIds)

  const perLine = consumptionByLine(
    items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      sugar: i.sugar,
      ice: i.ice,
      toppings: i.toppings.map((t) => t.name),
    })),
    book
  )
  const total = sumUsage(perLine)
  if (!total.size) return 0

  // Lock and move each ingredient once, in id order (avoids deadlocks between orders)
  const unitCost = new Map<number, number>()
  for (const id of [...total.keys()].sort((a, b) => a - b)) {
    const { costPerUnit } = await moveStock(tx, id, -total.get(id)!, 'out', { orderId, userId })
    unitCost.set(id, costPerUnit)
  }

  let cogs = 0
  for (const [index, usage] of perLine.entries()) {
    let cost = 0
    for (const [id, q] of usage) cost += q * (unitCost.get(id) ?? 0)
    const rounded = Math.round(cost)
    cogs += rounded
    if (rounded) await tx.update(orderItems).set({ costTotal: rounded }).where(eq(orderItems.id, items[index]!.id))
  }

  await syncAutoAvailability(tx, [...total.keys()])
  return cogs
}

// Switch products off when an ingredient runs short and back on once restocked.
// Only products the system switched off itself (autoDisabled) are switched back on.
export async function syncAutoAvailability(tx: Tx, ingredientIds: number[]) {
  if (!ingredientIds.length) return
  const affected = await tx
    .selectDistinct({ productId: productIngredients.productId })
    .from(productIngredients)
    .where(inArray(productIngredients.ingredientId, ingredientIds))
  const productIds = affected.map((a) => a.productId)
  if (!productIds.length) return

  const rows = await tx
    .select({
      productId: productIngredients.productId,
      ingredientId: productIngredients.ingredientId,
      quantity: productIngredients.quantity,
      stock: ingredients.stock,
    })
    .from(productIngredients)
    .innerJoin(ingredients, eq(ingredients.id, productIngredients.ingredientId))
    .where(inArray(productIngredients.productId, productIds))

  const recipes = new Map<number, RecipeLine[]>()
  const stock = new Map<number, number>()
  for (const r of rows) {
    recipes.set(r.productId, [...(recipes.get(r.productId) ?? []), { ingredientId: r.ingredientId, quantity: r.quantity }])
    stock.set(r.ingredientId, r.stock)
  }

  const short = productIds.filter((id) => !canMakeOne(recipes.get(id) ?? [], stock))
  const ok = productIds.filter((id) => canMakeOne(recipes.get(id) ?? [], stock))
  if (short.length) {
    await tx
      .update(products)
      .set({ isAvailable: false, autoDisabled: true })
      .where(and(inArray(products.id, short), eq(products.isAvailable, true)))
  }
  if (ok.length) {
    await tx
      .update(products)
      .set({ isAvailable: true, autoDisabled: false })
      .where(and(inArray(products.id, ok), eq(products.autoDisabled, true)))
  }
}

// Current cost of one serving of each product (VND, rounded), from average ingredient costs
export async function productRecipeCosts(db: Db): Promise<Map<number, { cost: number; hasRecipe: boolean }>> {
  const rows = await db
    .select({
      productId: productIngredients.productId,
      cost: sql<number>`sum(${productIngredients.quantity} * ${ingredients.avgCost})`.mapWith(Number),
    })
    .from(productIngredients)
    .innerJoin(ingredients, eq(ingredients.id, productIngredients.ingredientId))
    .groupBy(productIngredients.productId)
  return new Map(rows.map((r) => [r.productId, { cost: Math.round(r.cost), hasRecipe: true }]))
}
