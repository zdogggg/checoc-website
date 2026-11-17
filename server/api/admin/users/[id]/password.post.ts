import { eq } from 'drizzle-orm'
import { passwordResetInput } from '#shared/schemas/users'

// The owner sets a new password and hands it over. Every session of that account signed in
// with the old password stops working at once (see requireStaff).
export default defineEventHandler(async (event) => {
  const me = await requireStaff(event, OWNERS)
  const id = readId(event)
  const { password } = await readValidated(event, passwordResetInput)
  const now = new Date()
  const [row] = await useDb()
    .update(schema.users)
    .set({ passwordHash: await hashStaffPassword(password), passwordChangedAt: now })
    .where(eq(schema.users.id, id))
    .returning({ id: schema.users.id })
  if (!row) throw createError({ statusCode: 404, statusMessage: 'User not found' })
  // The owner resetting their own password stays signed in here, other devices are signed out
  if (id === me.id) await setUserSession(event, { loggedInAt: now.getTime() })
  return { ok: true }
})
