import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireStaff(event, CATALOG_EDITORS)
  const [row] = await useDb()
    .delete(schema.expenses)
    .where(eq(schema.expenses.id, readId(event)))
    .returning({ id: schema.expenses.id })
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Expense not found' })
  return { ok: true }
})
