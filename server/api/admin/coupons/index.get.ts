import { desc, isNull } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireStaff(event)
  // Personal coupons are listed on each customer profile instead
  return useDb()
    .select()
    .from(schema.coupons)
    .where(isNull(schema.coupons.customerId))
    .orderBy(desc(schema.coupons.createdAt))
})
