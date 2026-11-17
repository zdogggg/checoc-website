import { and, eq, isNull } from 'drizzle-orm'
import { emailChangeVerifyInput } from '#shared/schemas/customers'

// Step 2: the code proves the mailbox; the email becomes the sign-in email and the customer is
// signed in right away, so the points can be used on the next order
export default defineEventHandler(async (event) => {
  await rateLimit(event, 'otp-verify', 20, 15 * 60 * 1000)
  const { email, code } = await readValidated(event, emailChangeVerifyInput)
  const customer = await linkableCustomer(event, getRouterParam(event, 'token') ?? '')
  await verifyEmailChangeCode(customer.id, email, code)
  const [row] = await useDb()
    .update(schema.customers)
    .set({ email, lastLoginAt: new Date() })
    .where(and(eq(schema.customers.id, customer.id), isNull(schema.customers.email)))
    .returning({ id: schema.customers.id })
    .catch((error) => rethrowUnique(error, 'Email này đã gắn với một tài khoản khác'))
  if (!row) throw createError({ statusCode: 409, statusMessage: 'Conflict', message: 'Tài khoản này đã có email đăng nhập' })
  await startCustomerSession(event, customer)
  return { ok: true }
})
