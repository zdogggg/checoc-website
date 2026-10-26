import type { H3Event } from 'h3'

export type StaffRole = 'owner' | 'manager' | 'staff'

// Roles allowed to change the catalog (products, categories, options, coupons)
export const CATALOG_EDITORS: StaffRole[] = ['owner', 'manager']

export async function requireStaff(event: H3Event, roles?: StaffRole[]) {
  const { user } = await requireUserSession(event)
  if (roles && !roles.includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  return user
}
