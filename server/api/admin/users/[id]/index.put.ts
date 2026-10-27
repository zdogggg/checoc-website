import { eq } from 'drizzle-orm'
import { userUpdateInput } from '#shared/schemas/users'

export default defineEventHandler(async (event) => {
  const actor = await requireStaff(event, OWNERS)
  const id = readId(event)
  const input = await readValidated(event, userUpdateInput)
  await assertSafeUserChange(actor.id, id, input)
  const [row] = await useDb().update(schema.users).set(input).where(eq(schema.users.id, id)).returning()
  return toUserView(row!)
})
