import { and, asc, eq, inArray } from 'drizzle-orm'
import type { PurchaseInput } from '#shared/schemas/inventory'
import type { PurchaseDetail } from '#shared/types/inventory'

const { purchaseOrders, purchaseItems } = schema

type Db = ReturnType<typeof useDb>
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0]

const lineTotal = (quantity: number, unitCost: number) => Math.round(quantity * unitCost)

export async function findPurchase(id: number): Promise<PurchaseDetail | null> {
  const po = await useDb().query.purchaseOrders.findFirst({
    where: eq(purchaseOrders.id, id),
    with: {
      supplier: { columns: { name: true } },
      creator: { columns: { name: true } },
      items: { orderBy: asc(purchaseItems.id), with: { ingredient: { columns: { name: true, unit: true } } } },
    },
  })
  if (!po) return null
  return {
    id: po.id,
    code: po.code,
    status: po.status,
    supplierId: po.supplierId,
    supplierName: po.supplier?.name ?? null,
    total: po.total,
    itemCount: po.items.length,
    note: po.note,
    receivedAt: po.receivedAt?.toISOString() ?? null,
    createdAt: po.createdAt.toISOString(),
    createdBy: po.creator?.name ?? null,
    items: po.items.map((i) => ({
      id: i.id,
      ingredientId: i.ingredientId,
      name: i.ingredient.name,
      unit: i.ingredient.unit,
      quantity: i.quantity,
      unitCost: i.unitCost,
      lineTotal: i.lineTotal,
    })),
  }
}

async function writeItems(tx: Tx, purchaseId: number, items: PurchaseInput['items']) {
  const ids = [...new Set(items.map((i) => i.ingredientId))]
  const found = await tx.select({ id: schema.ingredients.id }).from(schema.ingredients).where(inArray(schema.ingredients.id, ids))
  if (found.length !== ids.length) {
    throw createError({ statusCode: 422, statusMessage: 'Validation failed', message: 'Có nguyên liệu không tồn tại' })
  }
  await tx.delete(purchaseItems).where(eq(purchaseItems.purchaseId, purchaseId))
  await tx.insert(purchaseItems).values(
    items.map((i) => ({ purchaseId, ...i, lineTotal: lineTotal(i.quantity, i.unitCost) }))
  )
  return items.reduce((sum, i) => sum + lineTotal(i.quantity, i.unitCost), 0)
}

// Draft receipts can be edited freely; stock only changes when the goods are received
export async function savePurchase(id: number | null, input: PurchaseInput, userId: number): Promise<number> {
  return useDb().transaction(async (tx) => {
    let purchaseId = id
    if (purchaseId == null) {
      const [row] = await tx
        .insert(purchaseOrders)
        .values({ supplierId: input.supplierId ?? null, note: input.note, createdBy: userId })
        .returning({ id: purchaseOrders.id })
      purchaseId = row!.id
    } else {
      const [row] = await tx.select().from(purchaseOrders).where(eq(purchaseOrders.id, purchaseId)).for('update')
      if (!row) throw createError({ statusCode: 404, statusMessage: 'Purchase not found' })
      if (row.status !== 'draft') {
        throw createError({ statusCode: 409, statusMessage: 'Conflict', message: 'Chỉ sửa được phiếu nhập chưa nhận hàng' })
      }
      await tx
        .update(purchaseOrders)
        .set({ supplierId: input.supplierId ?? null, note: input.note })
        .where(eq(purchaseOrders.id, purchaseId))
    }
    const total = await writeItems(tx, purchaseId, input.items)
    await tx.update(purchaseOrders).set({ total }).where(eq(purchaseOrders.id, purchaseId))
    return purchaseId
  })
}

// Goods arrived: add each line to stock at its purchase price (updates average costs)
export async function receivePurchase(id: number, userId: number) {
  await useDb().transaction(async (tx) => {
    const [po] = await tx.select().from(purchaseOrders).where(eq(purchaseOrders.id, id)).for('update')
    if (!po) throw createError({ statusCode: 404, statusMessage: 'Purchase not found' })
    if (po.status !== 'draft') {
      throw createError({ statusCode: 409, statusMessage: 'Conflict', message: 'Phiếu này đã được nhận hoặc đã huỷ' })
    }
    const items = await tx.select().from(purchaseItems).where(eq(purchaseItems.purchaseId, id)).orderBy(purchaseItems.ingredientId)
    if (!items.length) throw createError({ statusCode: 422, statusMessage: 'Empty', message: 'Phiếu nhập chưa có dòng nào' })

    for (const item of items) {
      await moveStock(tx, item.ingredientId, item.quantity, 'in', {
        unitCost: item.unitCost,
        purchaseId: id,
        userId,
        note: `Nhập theo phiếu ${po.code}`,
      })
    }
    await tx.update(purchaseOrders).set({ status: 'received', receivedAt: new Date() }).where(eq(purchaseOrders.id, id))
    await syncAutoAvailability(tx, [...new Set(items.map((i) => i.ingredientId))])
  })
}

export async function cancelPurchase(id: number) {
  const [row] = await useDb()
    .update(purchaseOrders)
    .set({ status: 'cancelled' })
    .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.status, 'draft')))
    .returning({ id: purchaseOrders.id })
  if (!row) throw createError({ statusCode: 409, statusMessage: 'Conflict', message: 'Chỉ huỷ được phiếu chưa nhận hàng' })
}


// Undo "goods received" (wrong quantity or price typed): the stock and average costs go back to
// what they were, and the receipt returns to "waiting for goods" so it can be corrected and
// received again. Refused when part of the delivery has already been used.
export async function unreceivePurchase(id: number, userId: number) {
  const { ingredients, stockMovements } = schema
  await useDb().transaction(async (tx) => {
    const [po] = await tx.select().from(purchaseOrders).where(eq(purchaseOrders.id, id)).for('update')
    if (!po) throw createError({ statusCode: 404, statusMessage: 'Purchase not found' })
    if (po.status !== 'received') {
      throw createError({ statusCode: 409, statusMessage: 'Conflict', message: 'Phiếu này chưa nhận hàng' })
    }

    // Lines of the same ingredient are taken back together, at their combined cost
    const items = await tx.select().from(purchaseItems).where(eq(purchaseItems.purchaseId, id))
    const byIngredient = new Map<number, { qty: number; value: number }>()
    for (const i of items) {
      const cur = byIngredient.get(i.ingredientId) ?? { qty: 0, value: 0 }
      byIngredient.set(i.ingredientId, { qty: cur.qty + i.quantity, value: cur.value + i.quantity * i.unitCost })
    }

    const ids = [...byIngredient.keys()].sort((a, b) => a - b)
    const rows = await tx.select().from(ingredients).where(inArray(ingredients.id, ids)).orderBy(asc(ingredients.id)).for('update')
    const short = rows.filter((r) => r.stock < byIngredient.get(r.id)!.qty - 1e-9)
    if (short.length) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Conflict',
        message: `Không huỷ được: đã dùng một phần hàng của phiếu này (${short.map((r) => r.name).join(', ')}). Hãy điều chỉnh kho thay vì huỷ nhận hàng.`,
      })
    }

    for (const row of rows) {
      const { qty, value } = byIngredient.get(row.id)!
      const unitCost = qty > 0 ? value / qty : 0
      const balance = roundQty(row.stock - qty)
      await tx
        .update(ingredients)
        .set({ stock: balance, avgCost: removeFromAverage(row.stock, row.avgCost, qty, unitCost) })
        .where(eq(ingredients.id, row.id))
      // Recorded as a negative delivery so the ingredient's history reads in/out correctly
      await tx.insert(stockMovements).values({
        ingredientId: row.id,
        type: 'in',
        quantity: roundQty(-qty),
        balanceAfter: balance,
        unitCost,
        purchaseId: id,
        userId,
        note: `Huỷ nhận hàng phiếu ${po.code}`,
      })
    }
    await tx.update(purchaseOrders).set({ status: 'draft', receivedAt: null }).where(eq(purchaseOrders.id, id))
    await syncAutoAvailability(tx, ids)
  })
}
