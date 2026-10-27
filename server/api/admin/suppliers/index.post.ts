import { supplierInput } from '#shared/schemas/inventory'

export default defineEventHandler(async (event) => {
  await requireStaff(event, CATALOG_EDITORS)
  const input = await readValidated(event, supplierInput)
  const [row] = await useDb().insert(schema.suppliers).values(input).returning()
  setResponseStatus(event, 201)
  return row
})
