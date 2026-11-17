import { eq } from 'drizzle-orm'
import { loginInput } from '#shared/schemas/catalog'

export default defineEventHandler(async (event) => {
  await rateLimit(event, 'login', 10, 15 * 60 * 1000)
  const { email, password } = await readValidated(event, loginInput)
  // 5 wrong passwords for one account lock it for 15 minutes, from any IP
  const lockKey = `login:${email}`
  await assertNotLocked(lockKey, 5, 15 * 60 * 1000)

  const user = await useDb().query.users.findFirst({ where: eq(schema.users.email, email) })
  // Same error for unknown email and wrong password
  if (!user || !user.isActive || !(await verifyStaffPassword(user.passwordHash, password))) {
    const failures = await recordFailure(lockKey)
    // Someone may be guessing a real staff password (or locking the account on purpose):
    // tell the shop once, when the lock starts
    if (user && failures === 5) event.waitUntil(notifyStaffLocked(user.email))
    await writeAudit(event, { userId: user?.id ?? null, userEmail: email, status: 401 })
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized', message: 'Email hoặc mật khẩu không đúng' })
  }
  await clearFailures(lockKey)

  await setUserSession(event, {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    loggedInAt: Date.now(),
  })
  await writeAudit(event, { userId: user.id, userEmail: user.email, status: 200 })
  return { ok: true }
})
