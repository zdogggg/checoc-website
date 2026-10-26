import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireStaff(event, CATALOG_EDITORS)
  const [row] = await useDb()
    .delete(schema.coupons)
    .where(eq(schema.coupons.id, readId(event)))
    .returning({ id: schema.coupons.id })
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Coupon not found' })
  return { ok: true }
})
