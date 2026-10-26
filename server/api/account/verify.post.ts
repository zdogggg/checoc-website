import { sql } from 'drizzle-orm'
import { otpVerifyInput } from '#shared/schemas/customers'

export default defineEventHandler(async (event) => {
  rateLimit(event, 'otp-verify', 20, 15 * 60 * 1000)
  const { phone, code } = await readValidated(event, otpVerifyInput)
  await verifyLoginCode(phone, code)

  // First sign-in creates the customer; returning customers keep their history and points
  const { customers } = schema
  const [customer] = await useDb()
    .insert(customers)
    .values({ phone, lastLoginAt: new Date() })
    .onConflictDoUpdate({ target: customers.phone, set: { lastLoginAt: sql`now()` } })
    .returning({ id: customers.id, phone: customers.phone })

  // Keeps a staff login in the same browser intact
  await setUserSession(event, { customer: customer! })
  return { ok: true }
})
