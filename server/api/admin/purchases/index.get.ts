import { count, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import type { PurchaseListItem } from '#shared/types/inventory'

const query = z.object({ status: z.enum(['all', 'draft', 'received', 'cancelled']).default('all') })

export default defineEventHandler(async (event): Promise<PurchaseListItem[]> => {
  await requireStaff(event)
  const { status } = await getValidatedQuery(event, query.parse)
  const { purchaseOrders, purchaseItems, suppliers } = schema
  const rows = await useDb()
    .select({ po: purchaseOrders, supplierName: suppliers.name, itemCount: count(purchaseItems.id) })
    .from(purchaseOrders)
    .leftJoin(suppliers, eq(suppliers.id, purchaseOrders.supplierId))
    .leftJoin(purchaseItems, eq(purchaseItems.purchaseId, purchaseOrders.id))
    .where(status === 'all' ? undefined : eq(purchaseOrders.status, status))
    .groupBy(purchaseOrders.id, suppliers.name)
    .orderBy(desc(purchaseOrders.id))
    .limit(200)
  return rows.map((r) => ({
    id: r.po.id,
    code: r.po.code,
    status: r.po.status,
    supplierName: r.supplierName,
    total: r.po.total,
    itemCount: r.itemCount,
    note: r.po.note,
    receivedAt: r.po.receivedAt?.toISOString() ?? null,
    createdAt: r.po.createdAt.toISOString(),
  }))
})
