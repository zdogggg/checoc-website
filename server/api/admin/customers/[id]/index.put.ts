import { eq } from 'drizzle-orm'
import { adminCustomerInput } from '#shared/schemas/customers'

// Staff edit contact details, tags and the internal note (points have their own endpoint)
export default defineEventHandler(async (event) => {
  await requireStaff(event)
  const id = readId(event)
  const input = await readValidated(event, adminCustomerInput)
  const [row] = await useDb()
    .update(schema.customers)
    .set({
      name: input.name,
      email: input.email ?? null,
      birthday: input.birthday ?? null,
      tags: [...new Set(input.tags)],
      note: input.note,
    })
    .where(eq(schema.customers.id, id))
    .returning({ id: schema.customers.id })
    .catch((error) => rethrowUnique(error, 'Email này đã gắn với một khách hàng khác'))
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Customer not found' })
  return { ok: true }
})
