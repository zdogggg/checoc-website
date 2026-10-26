import { eq } from 'drizzle-orm'
import { loginInput } from '#shared/schemas/catalog'

export default defineEventHandler(async (event) => {
  const { email, password } = await readValidated(event, loginInput)

  const user = await useDb().query.users.findFirst({ where: eq(schema.users.email, email) })
  // Same error for unknown email and wrong password
  if (!user || !user.isActive || !(await verifyPassword(user.passwordHash, password))) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized', message: 'Email hoặc mật khẩu không đúng' })
  }

  await setUserSession(event, {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    loggedInAt: Date.now(),
  })
  return { ok: true }
})
