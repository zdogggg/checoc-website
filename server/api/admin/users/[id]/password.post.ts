import { eq } from 'drizzle-orm'
import { passwordResetInput } from '#shared/schemas/users'

// The owner sets a new password and hands it over; the old sessions of that account keep
// working until they expire, so deactivate the account first if it was compromised.
export default defineEventHandler(async (event) => {
  await requireStaff(event, OWNERS)
  const id = readId(event)
  const { password } = await readValidated(event, passwordResetInput)
  const [row] = await useDb()
    .update(schema.users)
    .set({ passwordHash: await hashPassword(password) })
    .where(eq(schema.users.id, id))
    .returning({ id: schema.users.id })
  if (!row) throw createError({ statusCode: 404, statusMessage: 'User not found' })
  return { ok: true }
})
