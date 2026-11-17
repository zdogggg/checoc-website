import { eq } from 'drizzle-orm'
import { passwordChangeInput } from '#shared/schemas/users'

// Any staff member changes their own password. This device stays signed in; every other
// session of the account (a lost phone, a shared computer) is signed out.
export default defineEventHandler(async (event) => {
  const me = await requireStaff(event)
  const lockKey = `password:${me.id}`
  await assertNotLocked(lockKey, 5, 15 * 60 * 1000)
  const { currentPassword, password } = await readValidated(event, passwordChangeInput)

  const account = await useDb().query.users.findFirst({ where: eq(schema.users.id, me.id) })
  if (!account || !(await verifyStaffPassword(account.passwordHash, currentPassword))) {
    await recordFailure(lockKey)
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Mật khẩu hiện tại không đúng',
      data: { issues: [{ path: 'currentPassword', message: 'Mật khẩu hiện tại không đúng' }] },
    })
  }
  await clearFailures(lockKey)

  const now = new Date()
  await useDb()
    .update(schema.users)
    .set({ passwordHash: await hashStaffPassword(password), passwordChangedAt: now })
    .where(eq(schema.users.id, me.id))
  await setUserSession(event, { loggedInAt: now.getTime() })
  return { ok: true }
})
