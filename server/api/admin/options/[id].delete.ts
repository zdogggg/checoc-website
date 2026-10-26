import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireStaff(event, CATALOG_EDITORS)
  const [row] = await useDb()
    .delete(schema.options)
    .where(eq(schema.options.id, readId(event)))
    .returning({ id: schema.options.id })
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Option not found' })
  return { ok: true }
})
