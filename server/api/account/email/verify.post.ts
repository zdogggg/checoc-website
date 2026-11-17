import { eq } from 'drizzle-orm'
import { emailChangeVerifyInput } from '#shared/schemas/customers'

// Step 2: the code proves the customer reads that mailbox; the email becomes their sign-in email
export default defineEventHandler(async (event) => {
  await rateLimit(event, 'otp-verify', 20, 15 * 60 * 1000)
  const { id } = await requireCustomer(event)
  const { email, code } = await readValidated(event, emailChangeVerifyInput)
  await verifyEmailChangeCode(id, email, code)
  await useDb()
    .update(schema.customers)
    .set({ email })
    .where(eq(schema.customers.id, id))
    .catch((error) => rethrowUnique(error, 'Email này đã gắn với một tài khoản khác'))
  return loadAccount(id)
})
