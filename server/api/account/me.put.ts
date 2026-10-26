import { eq } from 'drizzle-orm'
import { accountProfileInput } from '#shared/schemas/customers'

export default defineEventHandler(async (event) => {
  const { id } = await requireCustomer(event)
  const input = await readValidated(event, accountProfileInput)
  await useDb()
    .update(schema.customers)
    .set({ name: input.name, email: input.email ?? null, birthday: input.birthday ?? null })
    .where(eq(schema.customers.id, id))
  return loadAccount(id)
})
