import { eq } from 'drizzle-orm'
import { customerNoteInput } from '#shared/schemas/customers'

export default defineEventHandler(async (event) => {
  const user = await requireStaff(event)
  const id = readId(event)
  const { content } = await readValidated(event, customerNoteInput)
  const exists = await useDb().query.customers.findFirst({ where: eq(schema.customers.id, id), columns: { id: true } })
  if (!exists) throw createError({ statusCode: 404, statusMessage: 'Customer not found' })
  await useDb().insert(schema.customerNotes).values({ customerId: id, userId: user.id, content })
  setResponseStatus(event, 201)
  return { ok: true }
})
