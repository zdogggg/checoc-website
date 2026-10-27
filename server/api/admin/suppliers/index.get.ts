import { and, asc, count, eq, max, ne } from 'drizzle-orm'
import type { SupplierView } from '#shared/types/inventory'

export default defineEventHandler(async (event): Promise<SupplierView[]> => {
  await requireStaff(event)
  const { suppliers, purchaseOrders } = schema
  const rows = await useDb()
    .select({
      supplier: suppliers,
      purchaseCount: count(purchaseOrders.id),
      lastPurchaseAt: max(purchaseOrders.receivedAt),
    })
    .from(suppliers)
    .leftJoin(purchaseOrders, and(eq(purchaseOrders.supplierId, suppliers.id), ne(purchaseOrders.status, 'cancelled')))
    .groupBy(suppliers.id)
    .orderBy(asc(suppliers.name))
  return rows.map((r) => ({
    id: r.supplier.id,
    name: r.supplier.name,
    phone: r.supplier.phone,
    address: r.supplier.address,
    note: r.supplier.note,
    isActive: r.supplier.isActive,
    purchaseCount: r.purchaseCount,
    lastPurchaseAt: r.lastPurchaseAt ? new Date(r.lastPurchaseAt).toISOString() : null,
  }))
})
