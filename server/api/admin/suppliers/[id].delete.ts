import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireStaff(event, CATALOG_EDITORS)
  const id = readId(event)
  const db = useDb()
  const used = await db.query.purchaseOrders.findFirst({ where: eq(schema.purchaseOrders.supplierId, id), columns: { id: true } })
  if (used) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Conflict',
      message: 'Nhà cung cấp đã có phiếu nhập nên không xoá được. Hãy chuyển sang "Ngừng giao dịch".',
    })
  }
  const [row] = await db.delete(schema.suppliers).where(eq(schema.suppliers.id, id)).returning({ id: schema.suppliers.id })
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Supplier not found' })
  return { ok: true }
})
