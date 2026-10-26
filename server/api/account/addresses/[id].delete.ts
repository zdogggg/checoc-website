import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const customer = await requireCustomer(event)
  const { customerAddresses } = schema
  const [row] = await useDb()
    .delete(customerAddresses)
    .where(and(eq(customerAddresses.id, readId(event)), eq(customerAddresses.customerId, customer.id)))
    .returning({ id: customerAddresses.id })
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Address not found' })
  return { ok: true }
})
