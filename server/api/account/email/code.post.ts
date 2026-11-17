import { emailChangeInput } from '#shared/schemas/customers'

// Step 1 of adding or changing the sign-in email: a code goes to the new address
export default defineEventHandler(async (event) => {
  await rateLimit(event, 'email-change', 6, 15 * 60 * 1000)
  const { id } = await requireCustomer(event)
  const { email } = await readValidated(event, emailChangeInput)
  return { ok: true, ...(await requestEmailChangeCode(id, email)) }
})
