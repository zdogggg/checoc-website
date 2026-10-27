import { eq, sql } from 'drizzle-orm'
import { emailOtpVerifyInput, phoneOtpVerifyInput } from '#shared/schemas/customers'

export default defineEventHandler(async (event) => {
  rateLimit(event, 'otp-verify', 20, 15 * 60 * 1000)
  const { customers } = schema
  let customer: { id: number; phone: string } | undefined

  if (await sendsEmail(event)) {
    const { email, code } = await readValidated(event, emailOtpVerifyInput)
    await verifyLoginCode({ email }, code)
    // A code is only ever sent to an email linked to a customer
    const found = await findCustomerByEmail(email)
    if (!found) throw createError({ statusCode: 400, statusMessage: 'OTP', message: 'Mã đã hết hạn. Vui lòng yêu cầu mã mới.' })
    await useDb().update(customers).set({ lastLoginAt: new Date() }).where(eq(customers.id, found.id))
    customer = { id: found.id, phone: found.phone }
  } else {
    const { phone, code } = await readValidated(event, phoneOtpVerifyInput)
    await verifyLoginCode({ phone }, code)
    // First SMS sign-in creates the customer; returning customers keep their history and points
    ;[customer] = await useDb()
      .insert(customers)
      .values({ phone, lastLoginAt: new Date() })
      .onConflictDoUpdate({ target: customers.phone, set: { lastLoginAt: sql`now()` } })
      .returning({ id: customers.id, phone: customers.phone })
  }

  // Keeps a staff login in the same browser intact
  await setUserSession(event, { customer: customer! })
  return { ok: true }
})
