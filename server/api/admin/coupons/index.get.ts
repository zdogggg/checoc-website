import { desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireStaff(event)
  return useDb().select().from(schema.coupons).orderBy(desc(schema.coupons.createdAt))
})
