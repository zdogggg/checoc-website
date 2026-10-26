import { eq } from 'drizzle-orm'
import { couponInput } from '#shared/schemas/catalog'

export default defineEventHandler(async (event) => {
  await requireStaff(event, CATALOG_EDITORS)
  const id = readId(event)
  const input = await readValidated(event, couponInput)
  try {
    const [row] = await useDb().update(schema.coupons).set(input).where(eq(schema.coupons.id, id)).returning()
    if (!row) throw createError({ statusCode: 404, statusMessage: 'Coupon not found' })
    return row
  } catch (error) {
    rethrowUnique(error, 'Mã giảm giá đã tồn tại')
  }
})
