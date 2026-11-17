import { eq } from 'drizzle-orm'
import { adminCustomerInput } from '#shared/schemas/customers'

// Staff edit contact details, tags and the internal note (points have their own endpoint)
export default defineEventHandler(async (event) => {
  const staff = await requireStaff(event)
  const id = readId(event)
  const input = await readValidated(event, adminCustomerInput)
  // The email signs the customer in and lets them spend points: whoever sets it can take the
  // account over, so only managers and owners may change it (and it is in the audit log)
  const current = await useDb().query.customers.findFirst({ where: eq(schema.customers.id, id), columns: { email: true } })
  if (!current) throw createError({ statusCode: 404, statusMessage: 'Customer not found' })
  if ((input.email ?? null) !== current.email && !CATALOG_EDITORS.includes(staff.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden', message: 'Chỉ quản lý hoặc chủ quán được đổi email của khách' })
  }
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
