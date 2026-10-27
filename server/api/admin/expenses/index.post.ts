import { expenseInput } from '#shared/schemas/inventory'

export default defineEventHandler(async (event) => {
  const user = await requireStaff(event, CATALOG_EDITORS)
  const input = await readValidated(event, expenseInput)
  const [row] = await useDb()
    .insert(schema.expenses)
    .values({ ...input, createdBy: user.id })
    .returning()
  setResponseStatus(event, 201)
  return row
})
