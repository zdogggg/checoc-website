import { eq } from 'drizzle-orm'

// Sign out every other device (a lost phone, a shared computer); this one stays signed in
export default defineEventHandler(async (event) => {
  const { id, phone } = await requireCustomer(event)
  const now = new Date()
  await useDb().update(schema.customers).set({ sessionsValidAfter: now }).where(eq(schema.customers.id, id))
  await startCustomerSession(event, { id, phone }, now.getTime())
  return { ok: true }
})
