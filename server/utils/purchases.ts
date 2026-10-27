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

