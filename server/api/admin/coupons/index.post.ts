import { couponInput } from '#shared/schemas/catalog'

export default defineEventHandler(async (event) => {
  await requireStaff(event, CATALOG_EDITORS)
  const input = await readValidated(event, couponInput)
  try {
    const [row] = await useDb().insert(schema.coupons).values(input).returning()
    setResponseStatus(event, 201)
    return row
  } catch (error) {
    rethrowUnique(error, 'Mã giảm giá đã tồn tại')
  }
})
