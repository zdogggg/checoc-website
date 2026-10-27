import { eq } from 'drizzle-orm'
import { supplierInput } from '#shared/schemas/inventory'

export default defineEventHandler(async (event) => {
  await requireStaff(event, CATALOG_EDITORS)
  const id = readId(event)
  const input = await readValidated(event, supplierInput)
  const [row] = await useDb().update(schema.suppliers).set(input).where(eq(schema.suppliers.id, id)).returning()
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Supplier not found' })
  return row
})
