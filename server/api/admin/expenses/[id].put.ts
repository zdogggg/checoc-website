import { eq } from 'drizzle-orm'
import { expenseInput } from '#shared/schemas/inventory'

export default defineEventHandler(async (event) => {
  await requireStaff(event, CATALOG_EDITORS)
  const id = readId(event)
  const input = await readValidated(event, expenseInput)
  const [row] = await useDb().update(schema.expenses).set(input).where(eq(schema.expenses.id, id)).returning()
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Expense not found' })
  return row
})
