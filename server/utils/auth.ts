import type { H3Event } from 'h3'
import { eq } from 'drizzle-orm'

export type StaffRole = 'owner' | 'manager' | 'staff'

// Roles allowed to change the catalog (products, categories, options, coupons)
export const CATALOG_EDITORS: StaffRole[] = ['owner', 'manager']

// The session cookie only proves who signed in. The account is re-read on every call so
// that deactivating someone or changing their role takes effect immediately.
export async function requireStaff(event: H3Event, roles?: StaffRole[]) {
  const { user: sessionUser } = await requireUserSession(event)
  const account = await useDb().query.users.findFirst({ where: eq(schema.users.id, sessionUser.id) })
  if (!account?.isActive) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized', message: 'Tài khoản đã bị khoá' })
  }
  const user = { id: account.id, email: account.email, name: account.name, role: account.role }
  if (roles && !roles.includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  return user
}
